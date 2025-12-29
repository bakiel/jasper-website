"""
JASPER CRM - Public Blog API Routes
Public endpoints for blog content (no authentication required).
"""

from fastapi import APIRouter, Query
from typing import List, Dict, Any

from services.blog_service import BlogService

router = APIRouter(prefix="/blog", tags=["Blog Public"])

blog_service = BlogService()


@router.get("/search", response_model=List[Dict[str, Any]])
async def search_posts(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results")
):
    """
    Search published blog posts.

    Returns posts matching the query in title, excerpt, content, or tags.
    Results are sorted by relevance.
    """
    return blog_service.search_posts(query=q, limit=limit)


@router.get("/posts", response_model=List[Dict[str, Any]])
async def list_published_posts(
    category: str = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    List published blog posts.

    Returns public posts sorted by publish date (newest first).
    """
    posts = blog_service.get_all_posts(
        status="published",
        category=category,
        limit=limit,
        offset=offset
    )

    # Return simplified public data
    return [
        {
            "slug": p.get("slug"),
            "title": p.get("title"),
            "excerpt": p.get("excerpt", "")[:200],
            "category": p.get("category"),
            "hero_image": p.get("heroImage"),
            "published_at": p.get("publishedAt"),
            "author": p.get("author"),
            "tags": p.get("tags", [])
        }
        for p in posts
    ]


@router.get("/posts/{slug}", response_model=Dict[str, Any])
async def get_post(slug: str):
    """
    Get a single published blog post by slug.
    """
    post = blog_service.get_post_by_slug(slug)

    if not post or post.get("status") != "published":
        return {"error": "Post not found"}

    return {
        "slug": post.get("slug"),
        "title": post.get("title"),
        "content": post.get("content"),
        "excerpt": post.get("excerpt"),
        "category": post.get("category"),
        "hero_image": post.get("heroImage"),
        "published_at": post.get("publishedAt"),
        "author": post.get("author"),
        "tags": post.get("tags", []),
        "seo": post.get("seo", {})
    }
