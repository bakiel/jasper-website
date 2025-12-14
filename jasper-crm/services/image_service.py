"""
JASPER CRM - Image Service
Fetches and curates images from Pixabay, Pexels, and Unsplash for articles.
Uses intelligent selection based on topic relevance and image quality.
"""

import os
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

# API Keys
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY", "53008439-9738eb541a6c2b6d1c4a6c512")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "ikaeTroGoIYfoYhCkH4eaZi8SSPB1R1Rjwq3DXAl59YLSBfcA3VxKFcs")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "eMqjx_TDf5erSWvsqnHpEbMUNmmM0WLtkgHqRKm_58g")


class ImageSource(Enum):
    PIXABAY = "pixabay"
    PEXELS = "pexels"
    UNSPLASH = "unsplash"


@dataclass
class CuratedImage:
    """Represents a curated image with metadata."""
    id: str
    source: ImageSource
    url: str
    thumbnail_url: str
    large_url: str
    width: int
    height: int
    photographer: Optional[str]
    photographer_url: Optional[str]
    description: Optional[str]
    tags: List[str]
    relevance_score: float = 0.0
    quality_score: float = 0.0
    attribution: Optional[str] = None


class ImageService:
    """Service for fetching and curating images from multiple sources."""

    # Topic to keyword mapping for better image search
    TOPIC_KEYWORDS = {
        "dfi-insights": ["business finance", "corporate meeting", "investment", "banking", "financial planning"],
        "financial-modeling": ["spreadsheet", "data analysis", "charts graphs", "financial planning", "business analytics"],
        "infrastructure-finance": ["infrastructure", "construction", "renewable energy", "solar panels", "development"],
        "case-studies": ["success business", "entrepreneur", "startup", "business growth", "team collaboration"],
        "industry-news": ["technology", "innovation", "digital transformation", "business news", "modern office"],
    }

    # South African specific terms for better relevance
    SA_KEYWORDS = {
        "IDC": ["industrial development", "manufacturing", "factory"],
        "DBSA": ["infrastructure Africa", "development bank", "construction"],
        "NEF": ["black business", "entrepreneur Africa", "empowerment"],
        "renewable energy": ["solar farm Africa", "wind turbines", "green energy"],
        "agriculture": ["farming Africa", "agricultural", "crops harvest"],
        "township": ["urban development", "community", "small business"],
    }

    def __init__(self):
        self.client = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(timeout=30.0)
        return self.client

    def _extract_search_terms(self, topic: str, category: str) -> List[str]:
        """Extract optimal search terms from topic and category."""
        search_terms = []

        # Add category-based keywords
        if category in self.TOPIC_KEYWORDS:
            search_terms.extend(self.TOPIC_KEYWORDS[category][:2])

        # Check for SA-specific terms
        topic_lower = topic.lower()
        for key, keywords in self.SA_KEYWORDS.items():
            if key.lower() in topic_lower:
                search_terms.extend(keywords[:2])
                break

        # Extract key words from topic
        important_words = [
            word for word in topic.split()
            if len(word) > 4 and word.lower() not in
            ['guide', 'complete', 'understanding', 'south', 'african', 'how', 'what', 'best']
        ]
        search_terms.extend(important_words[:3])

        # Deduplicate while preserving order
        seen = set()
        unique_terms = []
        for term in search_terms:
            if term.lower() not in seen:
                seen.add(term.lower())
                unique_terms.append(term)

        return unique_terms[:5]

    async def search_pixabay(
        self,
        query: str,
        per_page: int = 5,
        image_type: str = "photo",
        orientation: str = "horizontal"
    ) -> List[CuratedImage]:
        """Search Pixabay for images."""
        client = await self._get_client()

        try:
            response = await client.get(
                "https://pixabay.com/api/",
                params={
                    "key": PIXABAY_API_KEY,
                    "q": query,
                    "image_type": image_type,
                    "orientation": orientation,
                    "per_page": per_page,
                    "safesearch": "true",
                    "editors_choice": "true"  # Higher quality
                }
            )

            if response.status_code != 200:
                return []

            data = response.json()
            images = []

            for hit in data.get("hits", []):
                images.append(CuratedImage(
                    id=str(hit["id"]),
                    source=ImageSource.PIXABAY,
                    url=hit["webformatURL"],
                    thumbnail_url=hit["previewURL"],
                    large_url=hit["largeImageURL"],
                    width=hit["imageWidth"],
                    height=hit["imageHeight"],
                    photographer=hit.get("user"),
                    photographer_url=f"https://pixabay.com/users/{hit.get('user_id')}/",
                    description=hit.get("tags"),
                    tags=hit.get("tags", "").split(", "),
                    quality_score=min(hit.get("likes", 0) / 100, 1.0),
                    attribution=f"Image by {hit.get('user')} on Pixabay"
                ))

            return images

        except Exception as e:
            print(f"Pixabay search error: {e}")
            return []

    async def search_pexels(
        self,
        query: str,
        per_page: int = 5,
        orientation: str = "landscape"
    ) -> List[CuratedImage]:
        """Search Pexels for images."""
        client = await self._get_client()

        try:
            response = await client.get(
                "https://api.pexels.com/v1/search",
                params={
                    "query": query,
                    "per_page": per_page,
                    "orientation": orientation
                },
                headers={"Authorization": PEXELS_API_KEY}
            )

            if response.status_code != 200:
                return []

            data = response.json()
            images = []

            for photo in data.get("photos", []):
                images.append(CuratedImage(
                    id=str(photo["id"]),
                    source=ImageSource.PEXELS,
                    url=photo["src"]["medium"],
                    thumbnail_url=photo["src"]["small"],
                    large_url=photo["src"]["large2x"],
                    width=photo["width"],
                    height=photo["height"],
                    photographer=photo.get("photographer"),
                    photographer_url=photo.get("photographer_url"),
                    description=photo.get("alt"),
                    tags=[],
                    quality_score=0.8,  # Pexels is curated, generally high quality
                    attribution=f"Photo by {photo.get('photographer')} on Pexels"
                ))

            return images

        except Exception as e:
            print(f"Pexels search error: {e}")
            return []

    async def search_unsplash(
        self,
        query: str,
        per_page: int = 5,
        orientation: str = "landscape"
    ) -> List[CuratedImage]:
        """Search Unsplash for images."""
        client = await self._get_client()

        try:
            response = await client.get(
                "https://api.unsplash.com/search/photos",
                params={
                    "query": query,
                    "per_page": per_page,
                    "orientation": orientation
                },
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
            )

            if response.status_code != 200:
                return []

            data = response.json()
            images = []

            for photo in data.get("results", []):
                images.append(CuratedImage(
                    id=photo["id"],
                    source=ImageSource.UNSPLASH,
                    url=photo["urls"]["regular"],
                    thumbnail_url=photo["urls"]["thumb"],
                    large_url=photo["urls"]["full"],
                    width=photo["width"],
                    height=photo["height"],
                    photographer=photo["user"]["name"],
                    photographer_url=photo["user"]["links"]["html"],
                    description=photo.get("description") or photo.get("alt_description"),
                    tags=[tag["title"] for tag in photo.get("tags", [])[:5]],
                    quality_score=min(photo.get("likes", 0) / 500, 1.0),
                    attribution=f"Photo by {photo['user']['name']} on Unsplash"
                ))

            return images

        except Exception as e:
            print(f"Unsplash search error: {e}")
            return []

    def _score_image_relevance(
        self,
        image: CuratedImage,
        search_terms: List[str],
        topic: str
    ) -> float:
        """Score image relevance to the topic."""
        score = 0.0

        # Check tags
        image_tags = " ".join(image.tags).lower()
        description = (image.description or "").lower()
        topic_lower = topic.lower()

        for term in search_terms:
            term_lower = term.lower()
            if term_lower in image_tags:
                score += 0.3
            if term_lower in description:
                score += 0.2
            if term_lower in topic_lower:
                score += 0.1

        # Bonus for professional/business related tags
        professional_keywords = ["business", "office", "professional", "corporate", "finance", "meeting"]
        for keyword in professional_keywords:
            if keyword in image_tags or keyword in description:
                score += 0.15

        # Quality bonus
        score += image.quality_score * 0.2

        # Prefer landscape images for articles
        if image.width > image.height:
            score += 0.1

        # Prefer larger images
        if image.width >= 1920:
            score += 0.1

        return min(score, 1.0)

    async def get_images_for_article(
        self,
        topic: str,
        category: str,
        count: int = 3
    ) -> Dict[str, Any]:
        """
        Get curated images for an article.

        Searches all three sources, scores by relevance, and returns the best matches.
        """
        search_terms = self._extract_search_terms(topic, category)
        search_query = " ".join(search_terms[:3])

        # Search all sources in parallel
        results = await asyncio.gather(
            self.search_pixabay(search_query, per_page=5),
            self.search_pexels(search_query, per_page=5),
            self.search_unsplash(search_query, per_page=5),
            return_exceptions=True
        )

        all_images = []
        for result in results:
            if isinstance(result, list):
                all_images.extend(result)

        # Score all images for relevance
        for image in all_images:
            image.relevance_score = self._score_image_relevance(image, search_terms, topic)

        # Sort by relevance score
        all_images.sort(key=lambda x: x.relevance_score, reverse=True)

        # Get top images, preferring diversity of sources
        selected = []
        sources_used = set()

        for image in all_images:
            if len(selected) >= count:
                break

            # Prefer diverse sources for first few images
            if len(selected) < 3 and image.source in sources_used:
                continue

            selected.append(image)
            sources_used.add(image.source)

        # If we don't have enough, fill with best remaining
        if len(selected) < count:
            for image in all_images:
                if image not in selected:
                    selected.append(image)
                    if len(selected) >= count:
                        break

        return {
            "success": True,
            "topic": topic,
            "category": category,
            "search_query": search_query,
            "search_terms": search_terms,
            "images": [
                {
                    "id": img.id,
                    "source": img.source.value,
                    "url": img.url,
                    "thumbnail": img.thumbnail_url,
                    "large_url": img.large_url,
                    "width": img.width,
                    "height": img.height,
                    "photographer": img.photographer,
                    "photographer_url": img.photographer_url,
                    "description": img.description,
                    "tags": img.tags,
                    "relevance_score": round(img.relevance_score, 2),
                    "attribution": img.attribution,
                }
                for img in selected
            ],
            "total_found": len(all_images),
            "sources_searched": ["pixabay", "pexels", "unsplash"]
        }

    async def get_featured_image(
        self,
        topic: str,
        category: str
    ) -> Optional[Dict[str, Any]]:
        """Get a single best featured image for an article."""
        result = await self.get_images_for_article(topic, category, count=1)

        if result["images"]:
            return {
                "success": True,
                "image": result["images"][0],
                "search_query": result["search_query"]
            }

        return {
            "success": False,
            "error": "No suitable images found"
        }

    async def close(self):
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None


# Singleton instance
image_service = ImageService()
