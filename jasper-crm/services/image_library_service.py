"""
JASPER CRM - Image Library Service

Manages all images with automatic AI evaluation and metadata extraction.
Converts ALL images to JPEG for optimal site performance.

Features:
- Auto AI evaluation for tags, quality, brand alignment
- JPEG conversion for all uploads and generated images
- Metadata extraction (dimensions, file size, colors)
- Usage tracking across articles
- Support for manual uploads, AI-generated, and stock images

AI Evaluation: Gemini 3.0 Flash Preview (Vision capable)
Image Processing: Pillow (PIL)
"""

import os
import io
import json
import uuid
import base64
import logging
from PIL import Image
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
from pathlib import Path

logger = logging.getLogger(__name__)

# Image library storage
DATA_DIR = Path(__file__).parent.parent / "data"
# Use data/generated_images to match static file serving mount point
IMAGES_DIR = DATA_DIR / "generated_images"
LIBRARY_FILE = DATA_DIR / "image_library.json"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)


@dataclass
class ImageMetadata:
    """Technical metadata for an image"""
    width: int = 0
    height: int = 0
    aspect_ratio: float = 0.0
    file_size: int = 0
    format: str = "jpeg"
    original_format: str = ""
    color_mode: str = "RGB"
    quality: int = 80  # JPEG quality setting


@dataclass
class ImageAttribution:
    """Attribution info for stock/external images"""
    photographer: Optional[str] = None
    photographer_url: Optional[str] = None  # Photographer's profile URL
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    license: str = "Generated"


@dataclass
class AIEvaluation:
    """AI-generated metadata and quality assessment"""
    tags: List[str] = field(default_factory=list)
    description: str = ""
    quality_score: float = 0.0
    brand_alignment: float = 0.0
    suggested_categories: List[str] = field(default_factory=list)
    dominant_colors: List[str] = field(default_factory=list)
    evaluated_at: str = ""
    evaluation_model: str = "gemini-3-flash-preview"


@dataclass
class LibraryImage:
    """Complete image entry in the library"""
    id: str
    filename: str
    source: str  # "generated", "upload", "unsplash", "pexels", "pixabay"
    local_path: str
    public_url: str

    # Metadata
    metadata: ImageMetadata = field(default_factory=ImageMetadata)
    attribution: ImageAttribution = field(default_factory=ImageAttribution)
    ai_evaluation: AIEvaluation = field(default_factory=AIEvaluation)

    # Usage tracking
    prompt: Optional[str] = None  # Generation prompt if AI-generated
    category: str = "Uncategorized"
    is_favorite: bool = False
    used_in: List[str] = field(default_factory=list)  # Article slugs

    # Timestamps
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "source": self.source,
            "local_path": self.local_path,
            "public_url": self.public_url,
            "metadata": asdict(self.metadata),
            "attribution": asdict(self.attribution),
            "ai_evaluation": asdict(self.ai_evaluation),
            "prompt": self.prompt,
            "category": self.category,
            "is_favorite": self.is_favorite,
            "used_in": self.used_in,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "LibraryImage":
        metadata = ImageMetadata(**data.get("metadata", {}))
        attribution = ImageAttribution(**data.get("attribution", {}))
        ai_evaluation = AIEvaluation(**data.get("ai_evaluation", {}))

        return cls(
            id=data["id"],
            filename=data["filename"],
            source=data["source"],
            local_path=data["local_path"],
            public_url=data["public_url"],
            metadata=metadata,
            attribution=attribution,
            ai_evaluation=ai_evaluation,
            prompt=data.get("prompt"),
            category=data.get("category", "Uncategorized"),
            is_favorite=data.get("is_favorite", False),
            used_in=data.get("used_in", []),
            created_at=data.get("created_at", datetime.utcnow().isoformat()),
            updated_at=data.get("updated_at", datetime.utcnow().isoformat()),
        )


class ImageLibraryService:
    """
    Manages image library with AI evaluation and JPEG conversion.

    All images are:
    1. Converted to JPEG for optimal site performance
    2. Evaluated by AI for tags, quality, brand alignment
    3. Tracked for usage across articles
    """

    # JASPER brand colors for alignment scoring
    BRAND_COLORS = {
        "navy": "#0F2A3C",
        "emerald": "#2C8A5B",
        "emerald_dark": "#1E6B45",
        "white": "#FFFFFF",
        "slate": "#64748B",
    }

    # JPEG quality settings
    JPEG_QUALITY = 85  # Balance between quality and file size
    MAX_DIMENSION = 1920  # Max width/height for optimization

    def __init__(self):
        self.library: Dict[str, LibraryImage] = {}
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.gemini_client = None

        # Initialize Gemini for AI evaluation
        if self.api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=self.api_key)
                logger.info("ImageLibraryService initialized with Gemini Vision")
            except ImportError:
                logger.warning("google-genai not installed, AI evaluation disabled")
        else:
            logger.warning("GOOGLE_API_KEY not set, AI evaluation disabled")

        # Load existing library
        self._load_library()

    def _load_library(self):
        """Load image library from JSON file"""
        if LIBRARY_FILE.exists():
            try:
                with open(LIBRARY_FILE, "r") as f:
                    data = json.load(f)
                    for img_data in data.get("images", []):
                        img = LibraryImage.from_dict(img_data)
                        self.library[img.id] = img
                logger.info(f"Loaded {len(self.library)} images from library")
            except Exception as e:
                logger.error(f"Failed to load image library: {e}")
                self.library = {}
        else:
            self.library = {}

    def _save_library(self):
        """Save image library to JSON file"""
        try:
            data = {
                "images": [img.to_dict() for img in self.library.values()],
                "updated_at": datetime.utcnow().isoformat(),
                "total_count": len(self.library),
            }
            with open(LIBRARY_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save image library: {e}")

    def _optimize_image(self, image_path: str, quality: int = 75) -> bool:
        """Run jpegoptim on saved JPEG for web optimization."""
        import subprocess
        try:
            result = subprocess.run(
                ["jpegoptim", f"--max={quality}", "--strip-all", "--quiet", image_path],
                capture_output=True,
                timeout=30
            )
            if result.returncode == 0:
                logger.info(f"Optimized image: {image_path}")
                return True
        except Exception as e:
            logger.debug(f"Optimization skipped: {e}")
        return False


    def _convert_to_jpeg(
        self,
        image_data: bytes,
        original_format: str = ""
    ) -> tuple[bytes, ImageMetadata]:
        """
        Convert any image to optimized JPEG.

        Args:
            image_data: Raw image bytes
            original_format: Original format if known

        Returns:
            Tuple of (jpeg_bytes, metadata)
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(image_data))
            original_format = original_format or img.format or "unknown"

            # Convert to RGB if necessary (for PNG with transparency, etc.)
            if img.mode in ("RGBA", "LA", "P"):
                # Create white background for transparency
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Resize if too large
            if img.width > self.MAX_DIMENSION or img.height > self.MAX_DIMENSION:
                img.thumbnail((self.MAX_DIMENSION, self.MAX_DIMENSION), Image.Resampling.LANCZOS)

            # Save as JPEG
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=self.JPEG_QUALITY, optimize=True)
            jpeg_bytes = output.getvalue()

            # Build metadata
            metadata = ImageMetadata(
                width=img.width,
                height=img.height,
                aspect_ratio=round(img.width / img.height, 2) if img.height > 0 else 0,
                file_size=len(jpeg_bytes),
                format="jpeg",
                original_format=original_format.lower(),
                color_mode="RGB",
            )

            logger.info(
                f"Converted {original_format} to JPEG: "
                f"{metadata.width}x{metadata.height}, {metadata.file_size} bytes"
            )

            return jpeg_bytes, metadata

        except Exception as e:
            logger.error(f"Image conversion failed: {e}")
            raise

    async def evaluate_image_with_ai(
        self,
        image_data: bytes,
        context: Optional[str] = None
    ) -> AIEvaluation:
        """
        Use Gemini Vision to evaluate image for metadata.

        Extracts:
        - Descriptive tags
        - Quality assessment
        - Brand alignment score
        - Suggested categories
        - Dominant colors

        Args:
            image_data: JPEG image bytes
            context: Optional context (e.g., article topic)

        Returns:
            AIEvaluation with extracted metadata
        """
        if not self.gemini_client:
            logger.warning("Gemini not available, returning basic evaluation")
            return AIEvaluation(
                tags=["untagged"],
                description="AI evaluation not available",
                quality_score=70.0,
                brand_alignment=70.0,
                evaluated_at=datetime.utcnow().isoformat(),
            )

        try:
            from google.genai import types

            # Encode image for Gemini
            image_b64 = base64.b64encode(image_data).decode("utf-8")

            prompt = f"""Analyze this image for a professional DFI consulting firm website.

Context: {context or "General business/investment content"}

Evaluate and respond with JSON only:
{{
    "tags": ["tag1", "tag2", ...],  // 5-10 descriptive tags
    "description": "Brief description of the image content",
    "quality_score": 0-100,  // Technical quality (sharpness, composition, lighting)
    "brand_alignment": 0-100,  // How well it fits professional DFI/finance aesthetic
    "suggested_categories": ["category1", ...],  // From: Renewable Energy, Infrastructure, Climate Finance, Agri-Industrial, Data Centres, Mining, Real Estate, Water, Healthcare, Technology, Manufacturing, DFI Insights
    "dominant_colors": ["#hex1", "#hex2", "#hex3"]  // Top 3 colors
}}

Brand colors for reference:
- Navy: #0F2A3C
- Emerald: #2C8A5B
- Professional, authoritative, global aesthetic preferred
"""

            # Create image part
            image_part = types.Part.from_bytes(
                data=image_data,
                mime_type="image/jpeg"
            )

            config = types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=2048,
                response_mime_type="application/json",
            )

            response = self.gemini_client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=[prompt, image_part],
                config=config,
            )

            # Parse response
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]

            result = json.loads(text.strip())

            evaluation = AIEvaluation(
                tags=result.get("tags", []),
                description=result.get("description", ""),
                quality_score=float(result.get("quality_score", 70)),
                brand_alignment=float(result.get("brand_alignment", 70)),
                suggested_categories=result.get("suggested_categories", []),
                dominant_colors=result.get("dominant_colors", []),
                evaluated_at=datetime.utcnow().isoformat(),
                evaluation_model="gemini-3-flash-preview",
            )

            logger.info(
                f"AI evaluation complete: quality={evaluation.quality_score}, "
                f"brand={evaluation.brand_alignment}, tags={len(evaluation.tags)}"
            )

            return evaluation

        except Exception as e:
            logger.error(f"AI evaluation failed: {e}")
            return AIEvaluation(
                tags=["evaluation-failed"],
                description=f"Evaluation error: {str(e)}",
                quality_score=50.0,
                brand_alignment=50.0,
                evaluated_at=datetime.utcnow().isoformat(),
            )

    async def add_image(
        self,
        image_data: bytes,
        source: str = "upload",
        original_format: str = "",
        context: Optional[str] = None,
        prompt: Optional[str] = None,
        attribution: Optional[Dict] = None,
        category: str = "Uncategorized",
    ) -> LibraryImage:
        """
        Add an image to the library with automatic processing.

        Steps:
        1. Convert to JPEG
        2. Extract technical metadata
        3. Run AI evaluation
        4. Save to library

        Args:
            image_data: Raw image bytes (any format)
            source: "upload", "generated", "unsplash", "pexels", "pixabay"
            original_format: Original format if known
            context: Context for AI evaluation (article topic, etc.)
            prompt: Generation prompt if AI-generated
            attribution: Attribution info for stock images
            category: Initial category assignment

        Returns:
            LibraryImage with all metadata
        """
        # Generate unique ID
        image_id = f"img_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Convert to JPEG
        jpeg_data, metadata = self._convert_to_jpeg(image_data, original_format)

        # Generate filename
        filename = f"{image_id}_{timestamp}.jpg"
        local_path = IMAGES_DIR / filename

        # Save JPEG file
        with open(local_path, "wb") as f:
            f.write(jpeg_data)

        # Optimize JPEG for web
        self._optimize_image(str(local_path))

        # Run AI evaluation
        ai_eval = await self.evaluate_image_with_ai(jpeg_data, context)

        # Use AI-suggested category if available
        if ai_eval.suggested_categories and category == "Uncategorized":
            category = ai_eval.suggested_categories[0]

        # Build attribution
        attr = ImageAttribution()
        if attribution:
            attr = ImageAttribution(
                photographer=attribution.get("photographer"),
                source_name=attribution.get("source_name"),
                source_url=attribution.get("source_url"),
                license=attribution.get("license", "Unknown"),
            )
        elif source == "generated":
            attr.license = "AI Generated"

        # Create library entry
        image = LibraryImage(
            id=image_id,
            filename=filename,
            source=source,
            local_path=str(local_path),
            public_url=f"/generated-images/{filename}",
            metadata=metadata,
            attribution=attr,
            ai_evaluation=ai_eval,
            prompt=prompt,
            category=category,
        )

        # Add to library and save
        self.library[image_id] = image
        self._save_library()

        logger.info(f"Added image to library: {image_id} ({source})")

        return image

    async def add_from_url(
        self,
        url: str,
        source: str = "external",
        context: Optional[str] = None,
        attribution: Optional[Dict] = None,
    ) -> LibraryImage:
        """
        Download image from URL and add to library.

        Args:
            url: Image URL
            source: Source identifier
            context: Context for AI evaluation
            attribution: Attribution info

        Returns:
            LibraryImage with all metadata
        """
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30)
                response.raise_for_status()
                image_data = response.content

                # Detect format from content-type or URL
                content_type = response.headers.get("content-type", "")
                if "png" in content_type or url.endswith(".png"):
                    original_format = "png"
                elif "webp" in content_type or url.endswith(".webp"):
                    original_format = "webp"
                else:
                    original_format = "jpeg"

                return await self.add_image(
                    image_data=image_data,
                    source=source,
                    original_format=original_format,
                    context=context,
                    attribution=attribution,
                )

        except Exception as e:
            logger.error(f"Failed to download image from {url}: {e}")
            raise

    def get_image(self, image_id: str) -> Optional[LibraryImage]:
        """Get image by ID"""
        return self.library.get(image_id)

    def list_images(
        self,
        category: Optional[str] = None,
        source: Optional[str] = None,
        tags: Optional[List[str]] = None,
        favorites_only: bool = False,
        unused_only: bool = False,
        min_quality: float = 0,
        limit: int = 50,
        offset: int = 0,
    ) -> List[LibraryImage]:
        """
        List images with filters.

        Args:
            category: Filter by category
            source: Filter by source type
            tags: Filter by tags (any match)
            favorites_only: Only show favorites
            unused_only: Only show unused images
            min_quality: Minimum quality score
            limit: Max results
            offset: Pagination offset

        Returns:
            List of matching images
        """
        results = []

        for img in self.library.values():
            # Apply filters
            if category and img.category != category:
                continue
            if source and img.source != source:
                continue
            if favorites_only and not img.is_favorite:
                continue
            if unused_only and len(img.used_in) > 0:
                continue
            if min_quality > 0 and img.ai_evaluation.quality_score < min_quality:
                continue
            if tags:
                img_tags = set(t.lower() for t in img.ai_evaluation.tags)
                search_tags = set(t.lower() for t in tags)
                if not img_tags.intersection(search_tags):
                    continue

            results.append(img)

        # Sort by creation date (newest first)
        results.sort(key=lambda x: x.created_at, reverse=True)

        # Apply pagination
        return results[offset:offset + limit]

    def update_image(
        self,
        image_id: str,
        category: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        tags: Optional[List[str]] = None,
    ) -> Optional[LibraryImage]:
        """
        Update image metadata.

        Args:
            image_id: Image ID
            category: New category
            is_favorite: Favorite status
            tags: Additional tags (merged with AI tags)

        Returns:
            Updated image or None if not found
        """
        img = self.library.get(image_id)
        if not img:
            return None

        if category is not None:
            img.category = category
        if is_favorite is not None:
            img.is_favorite = is_favorite
        if tags is not None:
            # Merge with existing AI tags
            existing = set(img.ai_evaluation.tags)
            existing.update(tags)
            img.ai_evaluation.tags = list(existing)

        img.updated_at = datetime.utcnow().isoformat()
        self._save_library()

        return img

    def mark_used_in(self, image_id: str, article_slug: str) -> bool:
        """Mark image as used in an article"""
        img = self.library.get(image_id)
        if not img:
            return False

        if article_slug not in img.used_in:
            img.used_in.append(article_slug)
            img.updated_at = datetime.utcnow().isoformat()
            self._save_library()

        return True

    def remove_usage(self, image_id: str, article_slug: str) -> bool:
        """Remove usage record from image"""
        img = self.library.get(image_id)
        if not img:
            return False

        if article_slug in img.used_in:
            img.used_in.remove(article_slug)
            img.updated_at = datetime.utcnow().isoformat()
            self._save_library()

        return True

    def delete_image(self, image_id: str, force: bool = False) -> bool:
        """
        Delete image from library.

        Args:
            image_id: Image ID
            force: Force delete even if in use

        Returns:
            True if deleted, False otherwise
        """
        img = self.library.get(image_id)
        if not img:
            return False

        if img.used_in and not force:
            logger.warning(f"Cannot delete image {image_id}: used in {img.used_in}")
            return False

        # Delete file
        try:
            Path(img.local_path).unlink(missing_ok=True)
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")

        # Remove from library
        del self.library[image_id]
        self._save_library()

        logger.info(f"Deleted image: {image_id}")
        return True

    async def re_evaluate_image(self, image_id: str, context: Optional[str] = None) -> Optional[LibraryImage]:
        """
        Re-run AI evaluation on an existing image.

        Args:
            image_id: Image ID
            context: New context for evaluation

        Returns:
            Updated image or None if not found
        """
        img = self.library.get(image_id)
        if not img:
            return None

        # Read image file
        try:
            with open(img.local_path, "rb") as f:
                image_data = f.read()
        except Exception as e:
            logger.error(f"Failed to read image file: {e}")
            return None

        # Re-evaluate
        ai_eval = await self.evaluate_image_with_ai(image_data, context)
        img.ai_evaluation = ai_eval
        img.updated_at = datetime.utcnow().isoformat()

        self._save_library()

        return img

    def get_stats(self) -> Dict[str, Any]:
        """Get library statistics"""
        total = len(self.library)

        by_source = {}
        by_category = {}
        total_size = 0
        used_count = 0
        favorite_count = 0
        avg_quality = 0

        for img in self.library.values():
            by_source[img.source] = by_source.get(img.source, 0) + 1
            by_category[img.category] = by_category.get(img.category, 0) + 1
            total_size += img.metadata.file_size
            if img.used_in:
                used_count += 1
            if img.is_favorite:
                favorite_count += 1
            avg_quality += img.ai_evaluation.quality_score

        return {
            "total_images": total,
            "by_source": by_source,
            "by_category": by_category,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "used_images": used_count,
            "unused_images": total - used_count,
            "favorites": favorite_count,
            "average_quality_score": round(avg_quality / total, 1) if total > 0 else 0,
        }


# Singleton instance
image_library = ImageLibraryService()
