"""
JASPER CRM - Image Routes
API endpoints for fetching curated images from Pixabay, Pexels, and Unsplash.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from services.image_service import image_service

router = APIRouter(prefix="/api/v1/images", tags=["Images"])


class ImageSearchRequest(BaseModel):
    """Request for image search."""
    topic: str = Field(..., description="Article topic or search query")
    category: str = Field(default="dfi-insights", description="Article category")
    count: int = Field(default=3, ge=1, le=10, description="Number of images to return")


class ImageResponse(BaseModel):
    """Single image response."""
    id: str
    source: str
    url: str
    thumbnail: str
    large_url: str
    width: int
    height: int
    photographer: Optional[str]
    photographer_url: Optional[str]
    description: Optional[str]
    tags: List[str]
    relevance_score: float
    attribution: Optional[str]


@router.post("/search")
async def search_images(request: ImageSearchRequest):
    """
    Search for curated images across Pixabay, Pexels, and Unsplash.

    Returns images scored by relevance to the topic, with diverse source selection.

    Example:
        POST /api/v1/images/search
        {
            "topic": "IDC Funding for Infrastructure Projects",
            "category": "dfi-insights",
            "count": 3
        }
    """
    try:
        result = await image_service.get_images_for_article(
            topic=request.topic,
            category=request.category,
            count=request.count
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/featured")
async def get_featured_image(
    topic: str = Query(..., description="Article topic"),
    category: str = Query(default="dfi-insights", description="Article category")
):
    """
    Get a single best featured image for an article.

    Example:
        GET /api/v1/images/featured?topic=IDC%20Funding%20Guide&category=dfi-insights
    """
    try:
        result = await image_service.get_featured_image(topic, category)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pixabay")
async def search_pixabay(
    query: str = Query(..., description="Search query"),
    count: int = Query(default=5, ge=1, le=20, description="Number of results"),
    orientation: str = Query(default="horizontal", description="Image orientation")
):
    """
    Search Pixabay directly.

    Example:
        GET /api/v1/images/pixabay?query=business+finance&count=5
    """
    try:
        images = await image_service.search_pixabay(query, per_page=count, orientation=orientation)
        return {
            "source": "pixabay",
            "query": query,
            "count": len(images),
            "images": [
                {
                    "id": img.id,
                    "url": img.url,
                    "thumbnail": img.thumbnail_url,
                    "large_url": img.large_url,
                    "photographer": img.photographer,
                    "tags": img.tags,
                    "attribution": img.attribution
                }
                for img in images
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pexels")
async def search_pexels(
    query: str = Query(..., description="Search query"),
    count: int = Query(default=5, ge=1, le=20, description="Number of results"),
    orientation: str = Query(default="landscape", description="Image orientation")
):
    """
    Search Pexels directly.

    Example:
        GET /api/v1/images/pexels?query=business+meeting&count=5
    """
    try:
        images = await image_service.search_pexels(query, per_page=count, orientation=orientation)
        return {
            "source": "pexels",
            "query": query,
            "count": len(images),
            "images": [
                {
                    "id": img.id,
                    "url": img.url,
                    "thumbnail": img.thumbnail_url,
                    "large_url": img.large_url,
                    "photographer": img.photographer,
                    "attribution": img.attribution
                }
                for img in images
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unsplash")
async def search_unsplash(
    query: str = Query(..., description="Search query"),
    count: int = Query(default=5, ge=1, le=20, description="Number of results"),
    orientation: str = Query(default="landscape", description="Image orientation")
):
    """
    Search Unsplash directly.

    Example:
        GET /api/v1/images/unsplash?query=infrastructure+construction&count=5
    """
    try:
        images = await image_service.search_unsplash(query, per_page=count, orientation=orientation)
        return {
            "source": "unsplash",
            "query": query,
            "count": len(images),
            "images": [
                {
                    "id": img.id,
                    "url": img.url,
                    "thumbnail": img.thumbnail_url,
                    "large_url": img.large_url,
                    "photographer": img.photographer,
                    "tags": img.tags,
                    "attribution": img.attribution
                }
                for img in images
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/for-article/{category}")
async def get_images_by_category(
    category: str,
    count: int = Query(default=5, ge=1, le=10, description="Number of images")
):
    """
    Get curated images for a specific article category.

    Categories:
    - dfi-insights
    - financial-modeling
    - infrastructure-finance
    - case-studies
    - industry-news

    Example:
        GET /api/v1/images/for-article/dfi-insights?count=5
    """
    # Category-specific default topics
    category_topics = {
        "dfi-insights": "Development Finance Institution funding business",
        "financial-modeling": "Financial analysis data spreadsheet business",
        "infrastructure-finance": "Infrastructure development construction project",
        "case-studies": "Business success entrepreneur growth",
        "industry-news": "Technology innovation digital transformation"
    }

    topic = category_topics.get(category, "Business finance professional")

    try:
        result = await image_service.get_images_for_article(
            topic=topic,
            category=category,
            count=count
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
