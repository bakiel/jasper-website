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
    results = blog_service.search_posts(query=q, limit=limit)

    # Transform to match frontend BlogPost interface
    return [
        {
            "slug": r.get("slug"),
            "title": r.get("title"),
            "excerpt": r.get("excerpt", "")[:200],
            "category": r.get("category"),
            "heroImage": r.get("hero_image"),  # search returns snake_case
            "publishedAt": r.get("published_at"),
            "author": {
                "name": "JASPER Research Team",
                "role": "Research Team",
                "avatar": None
            },
            "tags": [],
            "readTime": 5,
            "status": "published"
        }
        for r in results
    ]


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

    # Return data matching frontend BlogPost interface (camelCase)
    return [
        {
            "slug": p.get("slug"),
            "title": p.get("title"),
            "excerpt": p.get("excerpt", "")[:200],
            "content": p.get("content", ""),
            "category": p.get("category"),
            "heroImage": p.get("heroImage"),
            "publishedAt": p.get("publishedAt"),
            "updatedAt": p.get("updatedAt"),
            "author": {
                "name": p.get("author", "JASPER Research Team"),
                "role": "Research Team",
                "avatar": None
            },
            "tags": p.get("tags", []),
            "readTime": p.get("readTime", 5),
            "status": "published",
            "seo": p.get("seo", {})
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
        "content_blocks": post.get("content_blocks", []),
        "excerpt": post.get("excerpt"),
        "category": post.get("category"),
        "heroImage": post.get("heroImage"),
        "publishedAt": post.get("publishedAt"),
        "updatedAt": post.get("updatedAt"),
        "author": {
            "name": post.get("author", "JASPER Research Team"),
            "role": "Research Team",
            "avatar": None
        },
        "tags": post.get("tags", []),
        "readTime": post.get("readTime", 5),
        "status": "published",
        "seo": post.get("seo", {})
    }
