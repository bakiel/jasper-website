"""
JASPER CRM - Nano Banana Image Generation Service
Uses Gemini 2.5 Flash Image for FREE AI-generated images (500/day)

Models:
- Primary: gemini-2.5-flash-image (FREE 500/day)
- Fallback: gemini-3-pro-image-preview ($0.134/image)
- Validator: gemini-2.5-flash-lite (FREE - for quality checking)

Resolution: 1792x1024 (16:9) for all blog headers
Quality Gate: 3 tries with validation before fallback
"""

import os
import io
import uuid
import base64
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from google import genai
from google.genai import types
from PIL import Image

logger = logging.getLogger(__name__)

# Image storage paths
STORAGE_PATH = Path("/var/www/jasper/images/blog")
PUBLIC_URL = "https://jasperfinance.org/images/blog"

# Design system colors
DESIGN_SYSTEM = {
    "background_primary": "#0F1419",
    "background_secondary": "#1A2530",
    "accent_gold": "#C9A962",
    "accent_cyan": "#00D4FF",
    "text_primary": "#FFFFFF",
    "text_secondary": "#8B9CAC",
}

# Category-specific styles
CATEGORY_STYLES = {
    "renewable-energy": "solar panels, wind turbines, green energy, sustainable power",
    "data-centres": "servers, networking, technology, digital infrastructure",
    "agri-industrial": "farming, agriculture, food production, greenhouse, hydroponics",
    "climate-finance": "green bonds, sustainability, environmental, carbon credits",
    "infrastructure": "construction, buildings, transportation, development",
    "dfi-insights": "finance, banking, global institutions, professional office",
    "methodology": "charts, analysis, data visualization, professional Excel",
}


@dataclass
class GeneratedImage:
    """Represents an AI-generated image."""
    success: bool
    url: Optional[str] = None
    filename: Optional[str] = None
    width: int = 1792
    height: int = 1024
    model_used: str = "gemini-2.5-flash-image"
    quality_score: float = 0.0
    validation_passed: bool = False
    error: Optional[str] = None


class NanoBananaService:
    """AI image generation using Gemini (Nano Banana) with quality validation."""
    
    # ALWAYS 16:9 for blog headers
    IMAGE_WIDTH = 1792
    IMAGE_HEIGHT = 1024
    ASPECT_RATIO = "16:9"
    MAX_RETRIES = 3  # 3 tries before fallback
    MIN_QUALITY_SCORE = 0.7  # 70% quality threshold
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        self.client = genai.Client(api_key=api_key)
        self.primary_model = "gemini-2.5-flash-image"
        self.fallback_model = "gemini-3-pro-image-preview"
        self.validator_model = "gemini-2.5-flash-lite"
        
        # Ensure storage directory exists
        STORAGE_PATH.mkdir(parents=True, exist_ok=True)
        
        logger.info("NanoBananaService initialized with quality validation")
    
    async def generate_featured_image(
        self,
        title: str,
        category: str,
        custom_aspect_ratio: str = None,
    ) -> GeneratedImage:
        """
        Generate and validate 16:9 featured image for blog post.
        
        Quality Gate: 3 tries with validation before fallback.
        
        Args:
            title: Article title for image text overlay
            category: Article category for style selection
            custom_aspect_ratio: Override default 16:9 (rarely used)
        
        Returns:
            GeneratedImage with URL, quality score, and metadata
        """
        width = self.IMAGE_WIDTH
        height = self.IMAGE_HEIGHT
        
        # Build design-system-aligned prompt
        style = CATEGORY_STYLES.get(category.lower().replace(" ", "-"), "professional, modern, financial")
        display_text = self._truncate_title(title)
        
        # Only add JASPER branding for methodology/dfi-insights or JASPER-titled articles
        use_branding = (
            category.lower() in ["methodology", "dfi-insights"] or 
            "jasper" in title.lower()
        )
        branding_section = """
BRANDING:
- Include subtle JASPER logo watermark in bottom-right corner (small, semi-transparent)
- Logo is a geometric building icon in navy/emerald colors
- Brand tagline: "Financial Architecture"
""" if use_branding else ""
        
        prompt = f"""
Professional blog header image for JASPER Financial Architecture.

DESIGN SYSTEM (STRICT - must match jasperfinance.org):
- Background: Dark blue gradient from {DESIGN_SYSTEM['background_primary']} to {DESIGN_SYSTEM['background_secondary']}
- Accent color: Gold {DESIGN_SYSTEM['accent_gold']} for highlights
- Secondary accent: Cyan {DESIGN_SYSTEM['accent_cyan']} for tech elements
- Clean, premium, sophisticated financial aesthetic

STYLE:
- {style}
- No people, no faces, no stock photo feel
- Subtle geometric patterns or abstract elements
- Professional, institutional quality

TEXT:
- Large, centered, bold text: "{display_text}"
- Text color: white or gold {DESIGN_SYSTEM['accent_gold']}
- Clear, readable sans-serif font
- Text must be perfectly legible

{branding_section}
COMPOSITION:
- {width}x{height} pixels ({self.ASPECT_RATIO} aspect ratio)
- Text is the primary focus (centered, prominent)
- Balanced, professional layout
- Leave breathing room around text
- Logo should be subtle, not dominating
"""

        # Try primary model with quality validation (3 tries)
        best_image = None
        best_score = 0.0
        
        for attempt in range(self.MAX_RETRIES):
            try:
                logger.info(f"Image generation attempt {attempt + 1}/{self.MAX_RETRIES} with {self.primary_model}")
                
                response = self.client.models.generate_content(
                    model=self.primary_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["image", "text"],
                    ),
                )
                
                # Extract image from response
                image_data = self._extract_image_from_response(response)
                if not image_data:
                    logger.warning(f"Attempt {attempt + 1}: No image in response")
                    continue
                
                # Validate image quality
                quality_score, is_valid = await self._validate_image_quality(
                    image_data, display_text, category
                )
                
                logger.info(f"Attempt {attempt + 1}: Quality score {quality_score:.1%}, valid={is_valid}")
                
                # Keep best image
                if quality_score > best_score:
                    best_score = quality_score
                    best_image = image_data
                
                # If quality passes, save and return
                if is_valid:
                    result = await self._save_image(image_data)
                    result.model_used = self.primary_model
                    result.quality_score = quality_score
                    result.validation_passed = True
                    return result
                
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
        
        # Use best image if we have one (even if below threshold)
        if best_image and best_score >= 0.5:
            logger.info(f"Using best available image with {best_score:.1%} quality")
            result = await self._save_image(best_image)
            result.model_used = self.primary_model
            result.quality_score = best_score
            result.validation_passed = False
            return result
        
        # Fallback to Pro model
        logger.info(f"Using fallback model: {self.fallback_model}")
        try:
            response = self.client.models.generate_content(
                model=self.fallback_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["image", "text"],
                ),
            )
            
            image_data = self._extract_image_from_response(response)
            if image_data:
                quality_score, is_valid = await self._validate_image_quality(
                    image_data, display_text, category
                )
                result = await self._save_image(image_data)
                result.model_used = self.fallback_model
                result.quality_score = quality_score
                result.validation_passed = is_valid
                return result
                
        except Exception as e:
            logger.error(f"Fallback model failed: {e}")
        
        return GeneratedImage(
            success=False,
            error="Failed to generate quality image after all retries"
        )
    
    async def _validate_image_quality(
        self, 
        image_data: bytes,
        expected_text: str,
        category: str
    ) -> Tuple[float, bool]:
        """
        Validate image quality using Gemini vision model.
        
        Checks:
        - Text is readable and matches expected
        - Image has professional quality
        - Appropriate for category
        
        Returns:
            Tuple of (quality_score 0-1, passes_threshold bool)
        """
        try:
            # Create a validation prompt
            validation_prompt = f"""
Analyze this image for quality. Score each criterion 0-10:

1. TEXT_CLARITY: Is the text "{expected_text}" clearly visible and readable?
2. PROFESSIONAL_QUALITY: Does it look like a professional blog header?
3. DESIGN_CONSISTENCY: Does it have a clean, modern financial aesthetic?
4. COMPOSITION: Is the layout balanced with good use of space?

Respond with JSON only:
{{"text_clarity": N, "professional_quality": N, "design_consistency": N, "composition": N, "overall_score": N}}
"""
            
            # Encode image for validation
            if isinstance(image_data, str):
                image_b64 = image_data
            else:
                image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.models.generate_content(
                model=self.validator_model,
                contents=[
                    {"text": validation_prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": image_b64
                        }
                    }
                ],
            )
            
            # Parse response
            import json
            import re
            
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Extract JSON from response
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                scores = json.loads(json_match.group())
                overall = scores.get('overall_score', 5) / 10.0
                return overall, overall >= self.MIN_QUALITY_SCORE
            
            # Default to moderate score if parsing fails
            return 0.6, False
            
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            # Return moderate score to allow fallback decision
            return 0.5, False
    
    def _extract_image_from_response(self, response) -> Optional[bytes]:
        """Extract image bytes from Gemini response."""
        try:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    if part.inline_data.mime_type.startswith('image/'):
                        return part.inline_data.data
        except Exception as e:
            logger.error(f"Failed to extract image: {e}")
        return None
    
    def _truncate_title(self, title: str, max_words: int = 5) -> str:
        """Truncate title for image text overlay."""
        words = title.split()
        if len(words) <= max_words:
            return title.upper()
        return " ".join(words[:max_words]).upper() + "..."
    
    async def _save_image(self, image_data: bytes) -> GeneratedImage:
        """Save image to storage and return public URL."""
        try:
            filename = f"{uuid.uuid4()}.png"
            filepath = STORAGE_PATH / filename
            
            # Decode if base64 encoded
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data)
            
            # Save image
            with open(filepath, "wb") as f:
                f.write(image_data)
            
            # Verify dimensions
            try:
                with Image.open(filepath) as img:
                    width, height = img.size
            except:
                width, height = self.IMAGE_WIDTH, self.IMAGE_HEIGHT
            
            url = f"{PUBLIC_URL}/{filename}"
            logger.info(f"Saved AI image: {url}")
            
            return GeneratedImage(
                success=True,
                url=url,
                filename=filename,
                width=width,
                height=height,
            )
            
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            return GeneratedImage(
                success=False,
                error=str(e)
            )


# Singleton instance
nano_banana = NanoBananaService()
