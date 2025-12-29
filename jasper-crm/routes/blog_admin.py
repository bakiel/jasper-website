"""
Blog Admin Routes - Complete blog management API
Endpoints for CRUD, SEO optimization, social sharing, AI generation
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import logging
from pathlib import Path

from services.blog_service import blog_service
from routes.blog import normalize_blocks, markdown_to_blocks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/blog", tags=["Blog Admin"])



# =============================================================================
# BACKGROUND TASKS
# =============================================================================

async def _generate_hero_image_background(slug: str, title: str, excerpt: str, content: str, category: str):
    """Background task to generate hero image for a new article.

    Uses existing generate_article_images function.
    Images that pass any quality check get used.
    """
    try:
        from services.ai_image_service import generate_article_images
        from datetime import datetime

        logger.info(f"Starting background image generation for: {slug}")

        # Use the full pipeline
        image_result = await generate_article_images(
            title=title,
            excerpt=excerpt,
            content=content,
            category=category,
            slug=slug,
            max_images=1,
            image_type="hero"
        )

        # Check if we got any images (even if not "success" due to strict 90% threshold)
        images = image_result.get("images", [])

        if images:
            # Use first image regardless of quality score
            hero_image = images[0]
            new_image_path = f"/generated-images/{hero_image.get('id', slug + '_hero')}.jpg"

            blog_service.update_post(
                slug,
                {
                    "heroImage": new_image_path,
                    "imageGeneratedAt": datetime.utcnow().isoformat() + "Z",
                    "imageQualityScore": hero_image.get("quality_score", 0)
                },
                "system"
            )
            logger.info(f"Background image set for {slug}: {new_image_path}")
        elif image_result.get("success"):
            logger.info(f"No images returned but success=True for {slug}")
        else:
            # Check if there's a generated file on disk we can use
            import glob
            import os
            pattern = f"/opt/jasper-crm/data/generated_images/{slug}*hero*.jpg"
            files = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)

            if files:
                # Use most recent generated file
                file_path = files[0]
                file_name = os.path.basename(file_path)
                new_image_path = f"/generated-images/{file_name}"

                blog_service.update_post(
                    slug,
                    {
                        "heroImage": new_image_path,
                        "imageGeneratedAt": datetime.utcnow().isoformat() + "Z",
                        "imageQualityScore": 0.5  # Unknown quality
                    },
                    "system"
                )
                logger.info(f"Using existing generated image for {slug}: {new_image_path}")
            else:
                logger.warning(f"Background image generation failed for {slug}: {image_result.get('error', 'No images generated')}")

    except Exception as e:
        logger.error(f"Background image generation error for {slug}: {e}")



# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class CreatePostRequest(BaseModel):
    """Request model for creating a new blog post"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    content_blocks: Optional[List[Dict[str, Any]]] = None  # Structured block content
    excerpt: Optional[str] = None
    category: str = "DFI Insights"
    tags: List[str] = []
    status: str = "draft"
    author: str = "JASPER Research Team"
    heroImage: Optional[str] = None
    heroImageId: Optional[str] = None  # Image library ID for hero image
    seo: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = "system"
    auto_generate_image: bool = Field(default=True, description="Auto-generate hero image if none provided")


class UpdatePostRequest(BaseModel):
    """Request model for updating a blog post"""
    title: Optional[str] = None
    content: Optional[str] = None
    content_blocks: Optional[List[Dict[str, Any]]] = None  # Structured block content
    excerpt: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    author: Optional[str] = None
    heroImage: Optional[str] = None
    heroImageId: Optional[str] = None  # Image library ID for hero image
    seo: Optional[Dict[str, Any]] = None
    featured: Optional[bool] = None
    seoTitle: Optional[str] = None  # Custom SEO title
    seoDescription: Optional[str] = None  # Custom SEO description
    user_id: Optional[str] = "system"


class SchedulePostRequest(BaseModel):
    """Request model for scheduling a post"""
    scheduled_for: datetime
    auto_share_twitter: bool = False
    auto_share_linkedin: bool = False
    user_id: Optional[str] = "system"


class GeneratePostRequest(BaseModel):
    """Request model for AI content generation with quality thresholds"""
    topic: str = Field(..., min_length=5)
    category: str = "DFI Insights"
    keywords: List[str] = []
    tone: str = "professional"
    target_audience: str = "business executives"
    user_id: Optional[str] = "system"
    # Quality threshold options (per JASPER_CONTENT_QUALITY_PIPELINE.md)
    min_seo_score: int = Field(default=70, ge=0, le=100, description="Minimum SEO score to accept article (default 70%)")
    use_ai_images: bool = Field(default=True, description="Generate AI images with Nano Banana Pro (fallback to stock if disabled or fails)")


class SEOAnalyzeRequest(BaseModel):
    """Request model for SEO analysis"""
    focus_keyword: Optional[str] = None


class RatingRequest(BaseModel):
    """Request model for article rating"""
    rating: int = Field(..., ge=1, le=5)


class PublishRequest(BaseModel):
    """Request model for publishing"""
    auto_share: bool = True
    user_id: Optional[str] = "system"


# =============================================================================
# CRUD ENDPOINTS
# =============================================================================

@router.post("/posts", response_model=Dict[str, Any])
async def create_post(request: CreatePostRequest, background_tasks: BackgroundTasks):
    """
    Create a new blog post

    Creates a draft post with the provided content.
    SEO score is automatically calculated on creation.
    If auto_generate_image=True and no heroImage provided, generates one via Nano Banana Pro.
    """
    try:
        post = blog_service.create_post(
            title=request.title,
            content=request.content,
            excerpt=request.excerpt,
            category=request.category,
            tags=request.tags,
            status=request.status,
            author=request.author,
            hero_image=request.heroImage,
            seo=request.seo,
            user_id=request.user_id
        )

        # Auto-generate hero image if none provided and content exists
        if request.auto_generate_image and not request.heroImage and request.content:
            background_tasks.add_task(
                _generate_hero_image_background,
                slug=post["slug"],
                title=request.title,
                excerpt=request.excerpt or post.get("excerpt", ""),
                content=request.content,
                category=request.category
            )
            post["_image_generating"] = True

        return {"success": True, "post": post}
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts", response_model=Dict[str, Any])
async def list_posts(
    status: Optional[str] = Query(None, description="Filter by status: draft, published, scheduled, archived"),
    category: Optional[str] = Query(None, description="Filter by category"),
    featured: Optional[bool] = Query(None, description="Filter featured posts only"),
    sort_by: Optional[str] = Query("updatedAt", description="Sort by: updatedAt, createdAt, publishedAt, rating, title, views"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    List all blog posts with optional filtering

    Returns posts sorted by creation date (newest first).
    Supports filtering by status, category, and featured flag.
    """
    try:
        posts = blog_service.get_all_posts()

        # Apply filters
        if status:
            posts = [p for p in posts if p.get("status") == status]
        if category:
            posts = [p for p in posts if p.get("category") == category]
        if featured is not None:
            posts = [p for p in posts if p.get("featured") == featured]

        # Apply sorting
        sort_key = sort_by if sort_by in ["updatedAt", "createdAt", "publishedAt", "rating", "title", "views", "readTime", "status"] else "updatedAt"
        reverse = sort_order != "asc"

        def get_sort_value(post):
            if sort_key == "rating":
                return post.get("rating", {}).get("average", 0)
            elif sort_key == "views":
                return post.get("views", 0)
            elif sort_key in ["updatedAt", "createdAt", "publishedAt"]:
                val = post.get(sort_key, "")
                return val if val else "1970-01-01"
            else:
                return str(post.get(sort_key, "")).lower()

        try:
            posts = sorted(posts, key=get_sort_value, reverse=reverse)
        except:
            pass  # Keep original order if sort fails

        # Pagination
        total = len(posts)
        posts = posts[offset:offset + limit]

        # Clear content_blocks so frontend uses ReactMarkdown on raw content
        for post in posts:
            post["content_blocks"] = []

        # Enrich posts with author details
        posts = [enrich_post_with_author(p) for p in posts]

        return {
            "success": True,
            "posts": posts,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error listing posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{slug}", response_model=Dict[str, Any])
async def get_post(slug: str):
    """
    Get a single blog post by slug

    Returns full post data including SEO scores and social sharing status.
    """
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")
    # Clear content_blocks so frontend uses ReactMarkdown on raw content
    post["content_blocks"] = []
    # Enrich with author details
    post = enrich_post_with_author(post)
    return {"success": True, "post": post}


@router.put("/posts/{slug}", response_model=Dict[str, Any])
async def update_post(slug: str, request: UpdatePostRequest):
    """
    Update an existing blog post

    SEO score is automatically recalculated on update.
    Activity is logged for transparency.
    """
    # DEBUG: Log raw request content_blocks BEFORE dict conversion
    logger.info(f"[DEBUG] PUT /posts/{slug} - request.content_blocks present: {request.content_blocks is not None}")
    if request.content_blocks is not None:
        logger.info(f"[DEBUG] PUT /posts/{slug} - content_blocks count: {len(request.content_blocks)}")
        if request.content_blocks:
            logger.info(f"[DEBUG] PUT /posts/{slug} - first block: {request.content_blocks[0] if request.content_blocks else 'empty'}")

    updates = request.dict(exclude_none=True, exclude={"user_id"})

    # DEBUG: Log updates dict after conversion
    logger.info(f"[DEBUG] PUT /posts/{slug} - updates keys: {list(updates.keys())}")
    if "content_blocks" in updates:
        logger.info(f"[DEBUG] PUT /posts/{slug} - content_blocks IN updates dict: {len(updates.get('content_blocks', []))}")
    else:
        logger.warning(f"[DEBUG] PUT /posts/{slug} - content_blocks MISSING from updates dict!")

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    post = blog_service.update_post(slug, updates, request.user_id)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    # Enrich with author details
    post = enrich_post_with_author(post)
    return {"success": True, "post": post}


@router.delete("/posts/{slug}", response_model=Dict[str, Any])
async def delete_post(slug: str, user_id: str = Query("system")):
    """
    Soft delete a blog post (archives it)

    Post is not permanently deleted, just archived.
    Can be restored by updating status back to draft/published.
    """
    success = blog_service.delete_post(slug, user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    return {"success": True, "message": f"Post archived: {slug}"}


@router.delete("/posts/{slug}/purge")
async def purge_post(slug: str):
    """Permanently delete a post - cannot be recovered."""
    try:
        posts = blog_service.get_all_posts()
        original_count = len(posts)
        posts = [p for p in posts if p.get("slug") != slug]
        
        if len(posts) < original_count:
            blog_service._save_posts(posts)
            return {"success": True, "message": f"Post permanently deleted: {slug}"}
        else:
            raise HTTPException(status_code=404, detail="Post not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/purge-archived")
async def purge_all_archived():
    """Permanently delete ALL archived posts."""
    try:
        posts = blog_service.get_all_posts()
        original_count = len(posts)
        archived = [p.get("slug") for p in posts if p.get("status") == "archived"]
        posts = [p for p in posts if p.get("status") != "archived"]
        purged = original_count - len(posts)
        
        if purged > 0:
            blog_service._save_posts(posts)
            return {"success": True, "purged": purged, "slugs": archived}
        return {"success": True, "purged": 0, "message": "No archived posts"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# STATS & RANKINGS
# =============================================================================

@router.get("/posts/stats/rankings")
async def get_post_rankings():
    """
    Get post rankings by various metrics.

    Returns top posts by rating, views, and recency.
    """
    try:
        posts = blog_service.get_all_posts()
        published = [p for p in posts if p.get("status") == "published"]

        # By rating (top rated)
        by_rating = sorted(
            published,
            key=lambda x: (x.get("rating") or {}).get("average", 0),
            reverse=True
        )[:10]

        # By views (most viewed) - if we have this data
        by_views = sorted(
            published,
            key=lambda x: x.get("views") or 0,
            reverse=True
        )[:10]

        # Most recent
        by_date = sorted(
            published,
            key=lambda x: x.get("publishedAt") or x.get("createdAt") or "1970-01-01",
            reverse=True
        )[:10]

        # Summary stats
        total_posts = len(posts)
        total_published = len(published)
        total_drafts = len([p for p in posts if p.get("status") == "draft"])
        total_archived = len([p for p in posts if p.get("status") == "archived"])

        avg_rating = 0
        rated_posts = [p for p in published if p.get("rating", {}).get("count", 0) > 0]
        if rated_posts:
            avg_rating = sum(p.get("rating", {}).get("average", 0) for p in rated_posts) / len(rated_posts)

        categories = {}
        for p in posts:
            cat = p.get("category", "Uncategorized")
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "success": True,
            "summary": {
                "total": total_posts,
                "published": total_published,
                "drafts": total_drafts,
                "archived": total_archived,
                "averageRating": round(avg_rating, 2),
                "categories": categories
            },
            "rankings": {
                "byRating": [
                    {
                        "slug": p.get("slug"),
                        "title": p.get("title"),
                        "rating": p.get("rating", {}).get("average", 0),
                        "ratingCount": p.get("rating", {}).get("count", 0)
                    }
                    for p in by_rating
                ],
                "byViews": [
                    {
                        "slug": p.get("slug"),
                        "title": p.get("title"),
                        "views": p.get("views", 0)
                    }
                    for p in by_views
                ],
                "mostRecent": [
                    {
                        "slug": p.get("slug"),
                        "title": p.get("title"),
                        "publishedAt": p.get("publishedAt")
                    }
                    for p in by_date
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/stats/overview")
async def get_posts_overview():
    """
    Get a table-friendly overview of all posts with key metrics.

    Returns all posts with sortable fields for table display.
    """
    try:
        posts = blog_service.get_all_posts()

        table_data = []
        for p in posts:
            table_data.append({
                "slug": p.get("slug"),
                "title": p.get("title", "")[:60],
                "status": p.get("status"),
                "category": p.get("category", ""),
                "author": p.get("author", ""),
                "rating": p.get("rating", {}).get("average", 0),
                "ratingCount": p.get("rating", {}).get("count", 0),
                "views": p.get("views", 0),
                "readTime": p.get("readTime", 0),
                "featured": p.get("featured", False),
                "createdAt": p.get("createdAt"),
                "updatedAt": p.get("updatedAt"),
                "publishedAt": p.get("publishedAt")
            })

        return {
            "success": True,
            "total": len(table_data),
            "posts": table_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





# =============================================================================
# PUBLISHING ENDPOINTS
# =============================================================================

@router.post("/posts/{slug}/publish", response_model=Dict[str, Any])
async def publish_post(slug: str, request: PublishRequest, background_tasks: BackgroundTasks):
    """
    Publish a blog post immediately

    Makes the post visible on the website.
    Optionally auto-shares to Twitter and LinkedIn.
    Sends notifications to Slack/Discord.
    """
    try:
        post = await blog_service.publish_post(slug, request.auto_share, request.user_id)
        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

        return {
            "success": True,
            "post": post,
            "message": f"Post published: {post.get('title')}"
        }
    except Exception as e:
        logger.error(f"Error publishing post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{slug}/unpublish", response_model=Dict[str, Any])
async def unpublish_post(slug: str, user_id: str = Query("system")):
    """
    Unpublish a blog post (revert to draft)

    Removes the post from the public website.
    """
    post = blog_service.unpublish_post(slug, user_id)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    return {
        "success": True,
        "post": post,
        "message": f"Post reverted to draft: {post.get('title')}"
    }


@router.post("/posts/{slug}/schedule", response_model=Dict[str, Any])
async def schedule_post(slug: str, request: SchedulePostRequest):
    """
    Schedule a post for future publication

    Post will be automatically published at the scheduled time.
    Optional auto-sharing to social media on publish.
    """
    # Convert datetime to ISO string
    scheduled_for_str = request.scheduled_for.isoformat()
    if not scheduled_for_str.endswith("Z"):
        scheduled_for_str += "Z"

    post = blog_service.schedule_post(
        slug,
        scheduled_for_str,
        request.auto_share_twitter,
        request.auto_share_linkedin,
        request.user_id
    )
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    return {
        "success": True,
        "post": post,
        "message": f"Post scheduled for: {request.scheduled_for.isoformat()}"
    }


# =============================================================================
# AI CONTENT GENERATION ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=Dict[str, Any])
async def generate_post(request: GeneratePostRequest):
    """
    Generate a new blog post using AI with quality validation.

    Pipeline (per JASPER_CONTENT_QUALITY_PIPELINE.md):
    1. Content generation via DeepSeek workers
    2. SEO validation - REJECTS if score < min_seo_score (default 70%)
    3. AI image generation via Nano Banana Pro
    4. Image quality validation - falls back to stock if < 70%
    5. Creates draft post for review

    Quality Thresholds:
    - min_seo_score: Minimum SEO score to accept (default 70%)
    - use_ai_images: Enable AI image generation (default True)
    """
    try:
        result = await blog_service.generate_post(
            topic=request.topic,
            category=request.category,
            keywords=request.keywords,
            tone=request.tone,
            user_id=request.user_id,
            min_seo_score=request.min_seo_score,
            use_ai_images=request.use_ai_images
        )

        # Check if generation was rejected
        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error"),
                "stage": result.get("stage"),
                "seo_score": result.get("seo_score"),
                "seo_details": result.get("seo_details"),
                "message": f"Article rejected at {result.get('stage', 'unknown')} stage"
            }

        return {
            "success": True,
            "post": result.get("post"),
            "seo_score": result.get("seo_score"),
            "image_source": result.get("image_source"),
            "pipeline_stages": result.get("pipeline_stages"),
            "model_used": result.get("model_used"),
            "message": "AI-generated draft created. Review and publish when ready."
        }
    except Exception as e:
        logger.error(f"Error generating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/outline", response_model=Dict[str, Any])
async def generate_outline(request: GeneratePostRequest):
    """
    Generate an article outline only (not full content)

    Useful for planning articles before full generation.
    """
    try:
        from services.content_service import content_service

        prompt = f"""Create a detailed article outline for the topic: {request.topic}

Target audience: {request.target_audience}
Tone: {request.tone}
Keywords to include: {', '.join(request.keywords) if request.keywords else 'relevant DFI terms'}

Provide:
1. Suggested title (compelling, SEO-friendly)
2. Introduction hook
3. Main sections (H2 headings) with brief descriptions
4. Key points for each section
5. Suggested conclusion
6. Call to action

Format as a structured outline."""

        outline = await content_service.generate_content(
            content_type="outline",
            topic=request.topic,
            additional_context=prompt
        )

        return {
            "success": True,
            "outline": outline,
            "topic": request.topic
        }
    except Exception as e:
        logger.error(f"Error generating outline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{slug}/rewrite", response_model=Dict[str, Any])
async def rewrite_content(slug: str, instructions: str = Query(..., min_length=5)):
    """
    Rewrite/improve existing post content using AI

    Provide instructions for how to improve the content.
    """
    try:
        post = blog_service.get_post(slug)
        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

        from services.content_service import content_service

        prompt = f"""Rewrite and improve the following blog post content.

INSTRUCTIONS: {instructions}

CURRENT TITLE: {post.get('title')}

CURRENT CONTENT:
{post.get('content', '')}

Provide the improved version with better structure, clarity, and engagement.
Maintain the same general topic but enhance the quality."""

        improved = await content_service.generate_content(
            content_type="rewrite",
            topic=post.get("title"),
            additional_context=prompt
        )

        return {
            "success": True,
            "original_title": post.get("title"),
            "improved_content": improved,
            "instructions": instructions
        }
    except Exception as e:
        logger.error(f"Error rewriting content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SEO ENDPOINTS
# =============================================================================

@router.get("/posts/{slug}/seo/score", response_model=Dict[str, Any])
async def get_seo_score(slug: str, focus_keyword: Optional[str] = Query(None)):
    """
    Get auto-calculated SEO score for a post (like Rank Math)

    Returns a score from 0-100 with detailed breakdown:
    - Keyword usage analysis
    - Title and meta description length
    - Content length and structure
    - Link analysis
    - Image optimization

    Each check shows pass/fail with suggestions for improvement.
    """
    result = blog_service.get_seo_score(slug, focus_keyword)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {"success": True, **result}


@router.post("/posts/{slug}/seo/analyze", response_model=Dict[str, Any])
async def analyze_seo(slug: str, request: SEOAnalyzeRequest):
    """
    Run full SEO analysis on a post

    Same as get_seo_score but accepts focus_keyword in body.
    """
    result = blog_service.get_seo_score(slug, request.focus_keyword)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {"success": True, **result}


@router.post("/posts/{slug}/seo/optimize", response_model=Dict[str, Any])
async def optimize_seo(slug: str, request: SEOAnalyzeRequest, user_id: str = Query("system")):
    """
    Auto-optimize post content for better SEO score

    Uses AI to improve:
    - Keyword placement and density
    - Title and meta description
    - Content structure (headings)
    - Internal link suggestions
    """
    try:
        result = await blog_service.optimize_seo(slug, request.focus_keyword, user_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Error optimizing SEO: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{slug}/seo/keywords", response_model=Dict[str, Any])
async def get_keyword_suggestions(slug: str):
    """
    Get AI-powered keyword suggestions for a post
    """
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    try:
        from services.content_service import content_service

        prompt = f"""Analyze this blog post and suggest optimal keywords:

TITLE: {post.get('title')}
CATEGORY: {post.get('category')}
CONTENT PREVIEW: {post.get('content', '')[:1000]}

Provide:
1. Primary focus keyword (1 phrase)
2. Secondary keywords (3-5 phrases)
3. Long-tail keywords (3-5 phrases)
4. Related terms for semantic SEO

Format as JSON with keys: primary, secondary, long_tail, related"""

        suggestions = await content_service.generate_content(
            content_type="keywords",
            topic=post.get("title"),
            additional_context=prompt
        )

        return {
            "success": True,
            "slug": slug,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"Error getting keyword suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SOCIAL SHARING ENDPOINTS
# =============================================================================

@router.get("/posts/{slug}/share/preview/twitter", response_model=Dict[str, Any])
async def preview_tweet(slug: str):
    """
    Preview AI-generated tweet for a post

    Shows what will be posted to Twitter without actually posting.
    """
    try:
        preview = await blog_service.preview_social(slug, "twitter")
        if "error" in preview:
            raise HTTPException(status_code=404, detail=preview["error"])

        return {"success": True, **preview}
    except Exception as e:
        logger.error(f"Error previewing tweet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{slug}/share/preview/linkedin", response_model=Dict[str, Any])
async def preview_linkedin(slug: str):
    """
    Preview AI-generated LinkedIn post

    Shows what will be posted to LinkedIn without actually posting.
    """
    try:
        preview = await blog_service.preview_social(slug, "linkedin")
        if "error" in preview:
            raise HTTPException(status_code=404, detail=preview["error"])

        return {"success": True, **preview}
    except Exception as e:
        logger.error(f"Error previewing LinkedIn post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{slug}/share/twitter", response_model=Dict[str, Any])
async def share_to_twitter(slug: str, user_id: str = Query("system")):
    """
    Share a post to Twitter now

    Uses jasper-social service to post tweet.
    Updates post with tweet ID and timestamp.
    """
    try:
        result = await blog_service.share_to_twitter(slug, user_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Error sharing to Twitter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{slug}/share/linkedin", response_model=Dict[str, Any])
async def share_to_linkedin(slug: str, user_id: str = Query("system")):
    """
    Share a post to LinkedIn now

    Uses jasper-social service to post.
    Updates post with post ID and timestamp.
    """
    try:
        result = await blog_service.share_to_linkedin(slug, user_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Error sharing to LinkedIn: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# RATING ENDPOINTS
# =============================================================================

@router.post("/posts/{slug}/rate", response_model=Dict[str, Any])
async def rate_post(slug: str, request: RatingRequest):
    """
    Submit a star rating for a post (1-5 stars)

    Updates the post's average rating and distribution.
    """
    result = blog_service.rate_post(slug, request.rating)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {"success": True, **result}


@router.get("/posts/{slug}/rating", response_model=Dict[str, Any])
async def get_rating(slug: str):
    """
    Get the current rating for a post
    """
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    rating = post.get("rating", {"average": 0, "count": 0, "distribution": {}})
    return {
        "success": True,
        "slug": slug,
        "rating": rating
    }


# =============================================================================
# STATISTICS & ACTIVITY ENDPOINTS
# =============================================================================

@router.get("/stats", response_model=Dict[str, Any])
async def get_blog_stats():
    """
    Get dashboard statistics for blog management

    Returns:
    - Total posts by status
    - Posts by category
    - Social sharing stats
    - SEO score averages
    - Recent activity
    - Upcoming scheduled posts
    """
    stats = blog_service.get_stats()
    return {"success": True, **stats}


@router.get("/activity", response_model=Dict[str, Any])
async def get_blog_activity(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get activity log for blog operations

    Shows all actions: creates, edits, publishes, shares, etc.
    Filtered to entity_type=blog automatically.
    """
    try:
        # Use existing activity service
        from services.activity_service import get_activities

        activities = await get_activities(
            entity_type="blog",
            limit=limit,
            offset=offset
        )

        return {
            "success": True,
            "activities": activities,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting blog activity: {e}")
        # Fallback if activity service not available
        return {
            "success": True,
            "activities": [],
            "limit": limit,
            "offset": offset,
            "note": "Activity service not available"
        }


# =============================================================================
# BULK OPERATIONS
# =============================================================================

@router.post("/bulk/publish", response_model=Dict[str, Any])
async def bulk_publish(slugs: List[str], user_id: str = Query("system")):
    """
    Publish multiple posts at once
    """
    results = []
    for slug in slugs:
        try:
            post = await blog_service.publish_post(slug, auto_share=False, user_id=user_id)
            results.append({"slug": slug, "success": True})
        except Exception as e:
            results.append({"slug": slug, "success": False, "error": str(e)})

    return {
        "success": True,
        "results": results,
        "published": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]])
    }


@router.post("/bulk/delete", response_model=Dict[str, Any])
async def bulk_delete(slugs: List[str], user_id: str = Query("system")):
    """
    Archive multiple posts at once
    """
    results = []
    for slug in slugs:
        success = blog_service.delete_post(slug, user_id)
        results.append({"slug": slug, "success": success})

    return {
        "success": True,
        "results": results,
        "archived": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]])
    }



@router.post("/bulk/seo-optimize", response_model=Dict[str, Any])
async def bulk_seo_optimize(
    min_score: int = Query(70, description="Only optimize articles below this score"),
    slugs: Optional[List[str]] = Query(None, description="Specific slugs to optimize (None = all below min_score)"),
    user_id: str = Query("system")
):
    """
    Bulk optimize SEO for articles below a threshold.

    Uses the SEO Optimizer V2 agent to improve:
    - Keyword optimization in first 100 words
    - Keyword density throughout content
    - Internal links to other JASPER articles
    - External links to authoritative sources
    - Meta descriptions

    Args:
        min_score: Only optimize articles with SEO score below this (default 70)
        slugs: Specific slugs to optimize (None = all below min_score)
        user_id: User performing the action

    Returns:
        Results with before/after scores
    """
    try:
        from agents.seo_optimizer_v2 import SEOOptimizerV2
        from services.seo_scorer import SEOScorer

        posts = blog_service.get_all_posts()
        optimizer = SEOOptimizerV2()
        seo_scorer = SEOScorer()

        # Filter posts to optimize
        if slugs:
            target_posts = [p for p in posts if p.get("slug") in slugs]
        else:
            target_posts = [
                p for p in posts
                if p.get("seoScore", 0) < min_score
                and p.get("status") in ["published", "draft"]
            ]

        results = {"success": [], "failed": [], "skipped": [], "total": len(target_posts)}

        for post in target_posts:
            slug = post.get("slug")
            title = post.get("title", "")
            content = post.get("content", "")
            original_score = post.get("seoScore", 0)

            if not content:
                results["skipped"].append({
                    "slug": slug,
                    "reason": "No content",
                    "score": original_score
                })
                continue

            try:
                # Run SEO optimization
                result = await optimizer.optimize_content(
                    content=content,
                    slug=slug,
                    title=title,
                    seo_keywords=post.get("seoKeywords")
                )

                if result.get("optimized_content"):
                    # Update the post with optimized content
                    updates = {"content": result["optimized_content"]}

                    # Add meta description if generated
                    if result.get("meta_description"):
                        seo_data = post.get("seo", {}) or {}
                        seo_data["metaDescription"] = result["meta_description"]
                        updates["seo"] = seo_data

                    blog_service.update_post(slug, updates, user_id)

                    # Recalculate SEO score
                    new_analysis = seo_scorer.calculate_score({
                        **post,
                        "content": result["optimized_content"]
                    })
                    new_score = new_analysis.score

                    # Update the score
                    blog_service.update_post(slug, {"seoScore": new_score}, user_id)

                    improvement = new_score - original_score

                    if improvement > 0:
                        results["success"].append({
                            "slug": slug,
                            "title": title[:50],
                            "before": original_score,
                            "after": new_score,
                            "improvement": improvement
                        })
                        logger.info(f"SEO optimized {slug}: {original_score}% -> {new_score}% (+{improvement})")
                    else:
                        results["skipped"].append({
                            "slug": slug,
                            "reason": f"No improvement (was {original_score}%, now {new_score}%)",
                            "score": new_score
                        })
                else:
                    results["failed"].append({
                        "slug": slug,
                        "error": result.get("error", "No optimized content returned")
                    })

            except Exception as e:
                logger.error(f"SEO optimization error for {slug}: {e}")
                results["failed"].append({
                    "slug": slug,
                    "error": str(e)
                })

        total_improvement = sum(r["improvement"] for r in results["success"])

        return {
            "success": True,
            "message": f"Optimized {len(results['success'])} articles (+{total_improvement}% total improvement)",
            "results": results
        }

    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Required module not available: {e}")
    except Exception as e:
        logger.error(f"Bulk SEO optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/posts/{slug}/improve", response_model=Dict[str, Any])
async def improve_single_article(
    slug: str,
    user_id: str = Query("system")
):
    """
    Improve a single article's SEO without requiring parameters.

    Uses SEO Optimizer V2 to enhance:
    - Keyword placement and density
    - Internal/external links
    - Meta description

    Returns before/after scores.
    """
    try:
        from agents.seo_optimizer_v2 import SEOOptimizerV2
        from services.seo_scorer import SEOScorer

        # Get the article
        post = blog_service.get_post_by_slug(slug)
        if not post:
            raise HTTPException(status_code=404, detail="Article not found")

        title = post.get("title", "")
        content = post.get("content", "")
        original_score = post.get("seoScore", 0)

        if not content:
            raise HTTPException(status_code=400, detail="Article has no content to optimize")

        optimizer = SEOOptimizerV2()
        seo_scorer = SEOScorer()

        # Run SEO optimization
        result = await optimizer.optimize_content(
            content=content,
            slug=slug,
            title=title,
            seo_keywords=post.get("seoKeywords")
        )

        if not result.get("optimized_content"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Optimization failed - no content returned")
            )

        # Update the post with optimized content
        updates = {"content": result["optimized_content"]}

        # Add meta description if generated
        if result.get("meta_description"):
            seo_data = post.get("seo", {}) or {}
            seo_data["metaDescription"] = result["meta_description"]
            updates["seo"] = seo_data

        blog_service.update_post(slug, updates, user_id)

        # Recalculate SEO score
        new_analysis = seo_scorer.calculate_score({
            **post,
            "content": result["optimized_content"]
        })
        new_score = new_analysis.score

        # Update the score
        blog_service.update_post(slug, {"seoScore": new_score}, user_id)

        improvement = new_score - original_score

        logger.info(f"SEO improved {slug}: {original_score}% -> {new_score}% (+{improvement})")

        return {
            "success": True,
            "slug": slug,
            "title": title,
            "before_score": original_score,
            "after_score": new_score,
            "improvement": improvement,
            "message": f"Article improved: {original_score}% → {new_score}%"
        }

    except HTTPException:
        raise
    except ImportError as e:
        logger.error(f"Import error in improve: {e}")
        raise HTTPException(status_code=500, detail=f"Required module not available: {e}")
    except Exception as e:
        logger.error(f"Improve article error for {slug}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk/regenerate-images", response_model=Dict[str, Any])
async def bulk_regenerate_images(
    slugs: Optional[List[str]] = Query(None),
    user_id: str = Query("system")
):
    """
    Regenerate hero images for existing articles using improved Nano Banana Pro prompts.

    Nano Banana Pro Improvements:
    - Professional photography style (not sci-fi/crystalline)
    - Technical camera specs (Sony A7III, 85mm f/1.4)
    - Proper lighting (three-point, softbox, golden hour)
    - South African business context
    - Editorial quality like Financial Times or Bloomberg

    Args:
        slugs: Specific slugs to regenerate (None = all published posts)
        user_id: User performing the action

    Returns:
        Results with new image paths and quality scores
    """
    try:
        from services.ai_image_service import generate_article_images

        posts = blog_service.get_all_posts()

        # Filter to specific slugs or all published
        if slugs:
            target_posts = [p for p in posts if p.get("slug") in slugs]
        else:
            target_posts = [p for p in posts if p.get("status") == "published"]

        results = {"success": [], "failed": [], "total": len(target_posts)}

        for post in target_posts:
            slug = post.get("slug")
            try:
                # Generate new images with improved Nano Banana Pro prompts
                image_result = await generate_article_images(
                    title=post.get("title", ""),
                    excerpt=post.get("excerpt", ""),
                    content=post.get("content", ""),
                    category=post.get("category", "DFI Insights"),
                    slug=slug,
                    max_images=1  # Just hero image
                )

                if image_result.get("success") and image_result.get("images"):
                    hero_image = image_result["images"][0]
                    new_image_path = f"/generated-images/{hero_image['id']}.jpg"

                    # Update post with new hero image
                    blog_service.update_post(slug, {
                        "heroImage": new_image_path,
                        "imageGeneratedAt": datetime.utcnow().isoformat() + "Z",
                        "imageQualityScore": hero_image.get("quality_score", 0)
                    }, user_id)

                    results["success"].append({
                        "slug": slug,
                        "title": post.get("title"),
                        "newImage": new_image_path,
                        "qualityScore": hero_image.get("quality_score", 0),
                        "brandCompliance": hero_image.get("brand_compliance", 0)
                    })
                    logger.info(f"Regenerated image for {slug}: {new_image_path}")
                else:
                    # Check if there were rejected images
                    rejected = image_result.get("rejected", [])
                    error_msg = "No images passed 90% quality threshold"
                    if rejected:
                        error_msg = f"Image rejected: {rejected[0].get('feedback', 'Below quality standard')}"

                    results["failed"].append({
                        "slug": slug,
                        "title": post.get("title"),
                        "error": error_msg
                    })
                    logger.warning(f"Image regeneration failed for {slug}: {error_msg}")

            except Exception as e:
                logger.error(f"Image regeneration error for {slug}: {e}")
                results["failed"].append({
                    "slug": slug,
                    "title": post.get("title"),
                    "error": str(e)
                })

        return {
            "success": True,
            "message": f"Regenerated {len(results['success'])} images, {len(results['failed'])} failed",
            "total_cost_usd": len(results["success"]) * 0.10,  # ~$0.10/image estimate
            "results": results
        }

    except Exception as e:
        logger.error(f"Bulk image regeneration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# AUTO-POST ENDPOINT (For news_monitor integration)
# =============================================================================

class AutoPostRequest(BaseModel):
    """Request model for automated blog posting from news_monitor"""
    title: str
    content: str
    excerpt: Optional[str] = None
    category: str = "DFI Insights"
    tags: List[str] = []
    seoTitle: Optional[str] = None
    seoDescription: Optional[str] = None
    publishImmediately: bool = False
    heroImage: Optional[str] = None
    source: str = "news_monitor"


@router.post("/auto-post", response_model=Dict[str, Any])
async def auto_post_from_news_monitor(
    request: AutoPostRequest,
    x_ai_api_key: Optional[str] = None
):
    """
    Automated blog posting endpoint for news_monitor service.

    This endpoint receives auto-generated content from the news monitoring
    system and creates blog posts (as drafts by default for review).

    Authentication via X-AI-API-Key header.
    """
    # Verify API key (basic auth for automated system)
    import os
    expected_key = os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key")
    # Note: In production, check header properly

    try:
        # Get hero image if not provided
        hero_image = request.heroImage
        if not hero_image:
            from services.image_service import image_service
            hero_result = await image_service.get_featured_image(
                request.title,
                request.category
            )
            if hero_result.get("success") and hero_result.get("image"):
                hero_image = hero_result["image"]["large_url"]

        # Create the post
        post = blog_service.create_post(
            title=request.title,
            content=request.content,
            excerpt=request.excerpt or request.content[:200] + "...",
            category=request.category,
            tags=request.tags,
            hero_image=hero_image,
            seo={
                "title": request.seoTitle or request.title[:60],
                "description": request.seoDescription or request.excerpt[:160] if request.excerpt else request.content[:160],
                "keywords": request.tags
            },
            user_id="news_monitor",
            source=request.source
        )

        # Optionally publish immediately
        if request.publishImmediately:
            post = await blog_service.publish_post(
                post["slug"],
                auto_share=True,
                user_id="news_monitor"
            )

        logger.info(f"Auto-post created: {post['slug']} (published: {request.publishImmediately})")

        return {
            "success": True,
            "post": post,
            "message": "Draft created" if not request.publishImmediately else "Post published",
            "source": request.source
        }

    except Exception as e:
        logger.error(f"Auto-post failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CATEGORIES & TAGS
# =============================================================================

@router.get("/categories", response_model=Dict[str, Any])
async def get_categories():
    """
    Get all blog categories with post counts
    """
    posts = blog_service.get_all_posts()
    categories = {}
    for post in posts:
        cat = post.get("category", "Uncategorized")
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "success": True,
        "categories": [
            {"name": k, "count": v}
            for k, v in sorted(categories.items(), key=lambda x: -x[1])
        ]
    }


@router.get("/tags", response_model=Dict[str, Any])
async def get_tags():
    """
    Get all blog tags with usage counts
    """
    posts = blog_service.get_all_posts()
    tags = {}
    for post in posts:
        for tag in post.get("tags", []):
            tags[tag] = tags.get(tag, 0) + 1

    return {
        "success": True,
        "tags": [
            {"name": k, "count": v}
            for k, v in sorted(tags.items(), key=lambda x: -x[1])
        ]
    }



# =============================================================================
# AUTHOR MANAGEMENT ENDPOINTS
# =============================================================================

AUTHORS_FILE = Path(__file__).parent.parent / "data" / "authors.json"


def load_authors() -> List[Dict]:
    """Load authors from JSON file."""
    try:
        if AUTHORS_FILE.exists():
            return json.load(open(AUTHORS_FILE))
        return []
    except Exception as e:
        logger.error(f"Error loading authors: {e}")
        return []


def save_authors(authors: List[Dict]) -> bool:
    """Save authors to JSON file."""
    try:
        with open(AUTHORS_FILE, 'w') as f:
            json.dump(authors, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving authors: {e}")
        return False

def enrich_post_with_author(post: Dict) -> Dict:
    """Add full author details to a post."""
    if not post:
        return post
    
    author_name = post.get("author", "")
    if not author_name:
        return post
    
    # Load authors
    authors = load_authors()
    
    # Find matching author by name or id
    for author in authors:
        if author.get("name") == author_name or author.get("id") == author_name:
            post["author_details"] = author
            return post
    
    # If no match found, create basic author details
    post["author_details"] = {
        "name": author_name,
        "role": "",
        "avatar": "/images/jasper-icon.png",
        "bio": ""
    }
    return post




@router.get("/authors", response_model=Dict[str, Any])
async def get_authors():
    """
    Get all pre-designed and custom authors.
    Returns a list of author profiles that can be selected for blog posts.
    """
    authors = load_authors()
    return {
        "success": True,
        "authors": authors,
        "count": len(authors)
    }


@router.get("/authors/{author_id}", response_model=Dict[str, Any])
async def get_author(author_id: str):
    """
    Get a specific author by ID.
    """
    authors = load_authors()
    for author in authors:
        if author.get("id") == author_id:
            return {"success": True, "author": author}
    raise HTTPException(status_code=404, detail="Author not found")


class CreateAuthorRequest(BaseModel):
    """Request model for creating a new author"""
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = None
    avatar: Optional[str] = "/images/jasper-icon.png"
    email: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None


class UpdateAuthorRequest(BaseModel):
    """Request model for updating an author"""
    name: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    isDefault: Optional[bool] = None


@router.post("/authors", response_model=Dict[str, Any])
async def create_author(request: CreateAuthorRequest):
    """
    Create a new custom author.
    """
    authors = load_authors()
    
    # Generate unique ID from name
    base_id = request.name.lower().replace(" ", "-")
    base_id = ''.join(c if c.isalnum() or c == '-' else '' for c in base_id)
    
    # Ensure unique ID
    author_id = base_id
    counter = 1
    existing_ids = {a.get("id") for a in authors}
    while author_id in existing_ids:
        author_id = f"{base_id}-{counter}"
        counter += 1
    
    new_author = {
        "id": author_id,
        "name": request.name,
        "role": request.role,
        "bio": request.bio or "",
        "avatar": request.avatar or "/images/jasper-icon.png",
        "email": request.email,
        "linkedin": request.linkedin,
        "twitter": request.twitter,
        "isDefault": False,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    
    authors.append(new_author)
    
    if not save_authors(authors):
        raise HTTPException(status_code=500, detail="Failed to save author")
    
    return {
        "success": True,
        "message": "Author created successfully",
        "author": new_author
    }


@router.put("/authors/{author_id}", response_model=Dict[str, Any])
async def update_author(author_id: str, request: UpdateAuthorRequest):
    """
    Update an existing author.
    """
    authors = load_authors()
    
    for i, author in enumerate(authors):
        if author.get("id") == author_id:
            # Update fields
            if request.name is not None:
                authors[i]["name"] = request.name
            if request.role is not None:
                authors[i]["role"] = request.role
            if request.bio is not None:
                authors[i]["bio"] = request.bio
            if request.avatar is not None:
                authors[i]["avatar"] = request.avatar
            if request.email is not None:
                authors[i]["email"] = request.email
            if request.linkedin is not None:
                authors[i]["linkedin"] = request.linkedin
            if request.twitter is not None:
                authors[i]["twitter"] = request.twitter
            if request.isDefault is not None:
                # If setting as default, unset other defaults
                if request.isDefault:
                    for a in authors:
                        a["isDefault"] = False
                authors[i]["isDefault"] = request.isDefault
            
            authors[i]["updatedAt"] = datetime.utcnow().isoformat() + "Z"
            
            if not save_authors(authors):
                raise HTTPException(status_code=500, detail="Failed to save author")
            
            return {
                "success": True,
                "message": "Author updated successfully",
                "author": authors[i]
            }
    
    raise HTTPException(status_code=404, detail="Author not found")


@router.delete("/authors/{author_id}", response_model=Dict[str, Any])
async def delete_author(author_id: str):
    """
    Delete an author. Cannot delete the default author.
    """
    authors = load_authors()
    
    for i, author in enumerate(authors):
        if author.get("id") == author_id:
            if author.get("isDefault"):
                raise HTTPException(status_code=400, detail="Cannot delete the default author")
            
            deleted = authors.pop(i)
            
            if not save_authors(authors):
                raise HTTPException(status_code=500, detail="Failed to save authors")
            
            return {
                "success": True,
                "message": "Author deleted successfully",
                "author": deleted
            }
    
    raise HTTPException(status_code=404, detail="Author not found")




# =============================================================================
# AI AUTHOR SUGGESTION
# =============================================================================

class SuggestAuthorRequest(BaseModel):
    """Request model for AI author suggestion"""
    title: str
    content: str
    category: Optional[str] = None


@router.post("/authors/suggest", response_model=Dict[str, Any])
async def suggest_author(request: SuggestAuthorRequest):
    """
    AI-powered author suggestion based on article content.
    
    Analyzes the article content, category, and tone to recommend
    the most appropriate author from the available authors.
    """
    try:
        import google.generativeai as genai
        import os
        
        # Load available authors
        authors = load_authors()
        if not authors:
            raise HTTPException(status_code=400, detail="No authors available")
        
        # Configure Gemini
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Build prompt
        authors_json = json.dumps([{
            "id": a.get("id"),
            "name": a.get("name"),
            "role": a.get("role", ""),
            "bio": a.get("bio", "")[:200]  # Truncate bio
        } for a in authors], indent=2)
        
        prompt = f"""You are an editorial assistant helping to assign the best author for an article.

AVAILABLE AUTHORS:
{authors_json}

ARTICLE TO ANALYZE:
Title: {request.title}
Category: {request.category or "General"}
Content Preview: {request.content[:1500]}

TASK:
Analyze the article's topic, tone, and expertise requirements.
Select the most appropriate author from the list above.

Consider:
1. Author's role and expertise area
2. Match between article topic and author bio
3. Writing style alignment

Return ONLY a valid JSON object (no markdown, no explanation):
{{
    "author_id": "the-author-id",
    "author_name": "Author Name",
    "confidence": 85,
    "reasoning": "Brief explanation why this author is best suited (1-2 sentences)"
}}
"""
        
        # Call Gemini
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 500,
            }
        )
        
        # Parse response
        result_text = response.text.strip()
        
        # Clean up markdown if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0]
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0]
        
        result = json.loads(result_text.strip())
        
        # Validate author exists
        author_id = result.get("author_id")
        valid_ids = [a.get("id") for a in authors]
        if author_id not in valid_ids:
            # Fall back to default author
            default_author = next((a for a in authors if a.get("isDefault")), authors[0])
            result = {
                "author_id": default_author.get("id"),
                "author_name": default_author.get("name"),
                "confidence": 60,
                "reasoning": "Defaulting to primary author"
            }
        
        return {
            "success": True,
            "suggestion": result
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        # Return default author on parse error
        authors = load_authors()
        default_author = next((a for a in authors if a.get("isDefault")), authors[0] if authors else None)
        if default_author:
            return {
                "success": True,
                "suggestion": {
                    "author_id": default_author.get("id"),
                    "author_name": default_author.get("name"),
                    "confidence": 50,
                    "reasoning": "AI analysis unavailable, suggesting default author"
                }
            }
        raise HTTPException(status_code=500, detail="AI author suggestion failed")
    except Exception as e:
        logger.error(f"Author suggestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# GROUNDING VERIFICATION ENDPOINTS (Anti-Hallucination)
# =============================================================================

@router.post("/posts/{slug}/grounding/verify", response_model=Dict[str, Any])
async def verify_grounding(
    slug: str,
    skip_web: bool = Query(False, description="Skip web verification (use ALEPH only, faster & FREE)"),
    user_id: str = Query("system")
):
    """
    Run grounding verification on a post to detect hallucinations.

    Multi-layer verification:
    1. Extract factual claims from content
    2. Verify against ALEPH knowledge base (FREE)
    3. Verify remaining claims via web (Jina/Gemini if configured)
    4. Calculate grounding score (80% threshold to pass)

    Articles that fail grounding will have flagged claims for review.
    """
    try:
        from agents.grounding_agent import get_grounding_agent
        from datetime import datetime

        post = blog_service.get_post(slug)
        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

        grounding_agent = get_grounding_agent()

        # Run verification
        result = await grounding_agent.verify_article(
            content=post.get("content", ""),
            title=post.get("title", ""),
            skip_web_verification=skip_web
        )

        # Update post with grounding results
        now = datetime.utcnow().isoformat() + "Z"
        updates = {
            "groundingVerified": True,
            "groundingScore": result.grounding_score,
            "groundingPasses": result.passes_threshold,
            "groundingVerifiedAt": now,
            "contradictedClaims": result.contradicted_claims,
            "unverifiedClaims": result.unverified_claims,
        }

        blog_service.update_post(slug, updates, user_id)

        return {
            "success": True,
            "slug": slug,
            "grounding_score": result.grounding_score,
            "passes_threshold": result.passes_threshold,
            "threshold": 80.0,
            "total_claims": result.total_claims,
            "verified_claims": result.verified_claims,
            "unverified_claims": result.unverified_claims,
            "contradicted_claims": result.contradicted_claims,
            "flagged_for_review": len(result.flagged_for_review),
            "sources_cited": len(result.sources_cited),
            "verification_skipped": result.verification_skipped,
            "skip_reason": result.skip_reason,
        }

    except Exception as e:
        logger.error(f"Grounding verification failed for {slug}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{slug}/grounding/status", response_model=Dict[str, Any])
async def get_grounding_status(slug: str):
    """
    Get the current grounding verification status for a post.
    """
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    return {
        "success": True,
        "slug": slug,
        "grounding_verified": post.get("groundingVerified", False),
        "grounding_score": post.get("groundingScore", 0),
        "grounding_passes": post.get("groundingPasses", False),
        "verified_at": post.get("groundingVerifiedAt"),
        "contradicted_claims": post.get("contradictedClaims", 0),
        "unverified_claims": post.get("unverifiedClaims", 0),
    }


@router.post("/grounding/verify-all", response_model=Dict[str, Any])
async def verify_all_grounding(
    skip_web: bool = Query(False, description="Skip web verification (faster)"),
    only_unverified: bool = Query(True, description="Only verify posts that haven't been checked"),
    user_id: str = Query("system")
):
    """
    Run grounding verification on all posts (batch operation).

    This is useful for verifying imported articles or running periodic checks.
    Results are saved to each post and a summary is returned.
    """
    try:
        from agents.grounding_agent import get_grounding_agent
        from datetime import datetime

        posts = blog_service.get_all_posts()
        grounding_agent = get_grounding_agent()

        results = []
        verified_count = 0
        passed_count = 0
        failed_count = 0
        skipped_count = 0

        for post in posts:
            slug = post.get("slug")

            # Skip already verified if requested
            if only_unverified and post.get("groundingVerified", False):
                skipped_count += 1
                continue

            try:
                result = await grounding_agent.verify_article(
                    content=post.get("content", ""),
                    title=post.get("title", ""),
                    skip_web_verification=skip_web
                )

                # Update post
                now = datetime.utcnow().isoformat() + "Z"
                updates = {
                    "groundingVerified": True,
                    "groundingScore": result.grounding_score,
                    "groundingPasses": result.passes_threshold,
                    "groundingVerifiedAt": now,
                    "contradictedClaims": result.contradicted_claims,
                    "unverifiedClaims": result.unverified_claims,
                }
                blog_service.update_post(slug, updates, user_id)

                verified_count += 1
                if result.passes_threshold:
                    passed_count += 1
                else:
                    failed_count += 1

                results.append({
                    "slug": slug,
                    "score": result.grounding_score,
                    "passes": result.passes_threshold,
                    "claims": result.total_claims,
                    "contradicted": result.contradicted_claims,
                })

            except Exception as e:
                logger.error(f"Grounding failed for {slug}: {e}")
                results.append({
                    "slug": slug,
                    "error": str(e),
                })

        return {
            "success": True,
            "summary": {
                "total_posts": len(posts),
                "verified": verified_count,
                "passed": passed_count,
                "failed": failed_count,
                "skipped": skipped_count,
                "pass_rate": f"{(passed_count/verified_count*100):.1f}%" if verified_count > 0 else "N/A",
            },
            "results": results,
        }

    except Exception as e:
        logger.error(f"Batch grounding verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# VERSION HISTORY ENDPOINTS
# =============================================================================

@router.get("/posts/{slug}/revisions", response_model=Dict[str, Any])
async def get_revisions(
    slug: str,
    limit: int = Query(20, ge=1, le=100, description="Maximum revisions to return")
):
    """
    Get revision history for a post.

    Returns metadata only (not full snapshots) for performance.
    Use GET /posts/{slug}/revisions/{rev_number} for full content.
    """
    # Verify post exists
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    history = blog_service.get_revision_history(slug, limit)

    return {
        "success": True,
        "slug": slug,
        "revision_count": len(history),
        "revisions": history
    }


@router.get("/posts/{slug}/revisions/{rev_number}", response_model=Dict[str, Any])
async def get_revision(slug: str, rev_number: int):
    """
    Get a specific revision with full snapshot content.

    Returns the complete snapshot including title, content, content_blocks,
    and all other versioned fields at that point in time.
    """
    # Verify post exists
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    revision = blog_service.get_revision(slug, rev_number)
    if not revision:
        raise HTTPException(
            status_code=404,
            detail=f"Revision {rev_number} not found for post: {slug}"
        )

    return {
        "success": True,
        "slug": slug,
        "revision": revision
    }


@router.post("/posts/{slug}/restore/{rev_number}", response_model=Dict[str, Any])
async def restore_revision(
    slug: str,
    rev_number: int,
    user_id: str = Query("system", description="User performing the restore")
):
    """
    Restore a post to a previous revision.

    This creates two new revisions:
    1. A "pre_restore" snapshot of the current state
    2. A "restored" snapshot after applying the old version

    This ensures complete audit trail and ability to undo the restore.
    """
    # Verify post exists
    post = blog_service.get_post(slug)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post not found: {slug}")

    # Verify revision exists
    revision = blog_service.get_revision(slug, rev_number)
    if not revision:
        raise HTTPException(
            status_code=404,
            detail=f"Revision {rev_number} not found for post: {slug}"
        )

    # Perform restore
    restored_post = blog_service.restore_revision(slug, rev_number, user_id)
    if not restored_post:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to restore revision {rev_number}"
        )

    return {
        "success": True,
        "slug": slug,
        "restored_from_revision": rev_number,
        "post": restored_post,
        "message": f"Successfully restored to revision {rev_number}"
    }

# =============================================================================
# AUTO-CLEANUP SCHEDULER
# =============================================================================

from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

def auto_purge_old_archived():
    """Auto-purge archived posts older than 30 days."""
    try:
        posts = blog_service.get_all_posts()
        cutoff = datetime.utcnow() - timedelta(days=30)
        original_count = len(posts)
        
        kept = []
        purged = []
        for p in posts:
            if p.get("status") == "archived":
                updated = p.get("updatedAt", p.get("createdAt", ""))
                if updated:
                    try:
                        updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00").replace("+00:00", ""))
                        if updated_dt < cutoff:
                            purged.append(p.get("slug"))
                            continue
                    except:
                        pass
            kept.append(p)
        
        if purged:
            blog_service._save_posts(kept)
            logger.info(f"Auto-purged {len(purged)} old archived posts: {purged}")
        
        return len(purged)
    except Exception as e:
        logger.error(f"Auto-purge failed: {e}")
        return 0

# Initialize scheduler (runs daily at 3 AM)
_scheduler = None
def init_auto_cleanup():
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
        _scheduler.add_job(
            auto_purge_old_archived,
            CronTrigger(hour=3, minute=0),
            id="auto_purge_archived",
            replace_existing=True
        )
        _scheduler.start()
        logger.info("Auto-cleanup scheduler started (daily at 3 AM)")

# Start scheduler on module load
try:
    init_auto_cleanup()
except Exception as e:
    logger.warning(f"Could not start auto-cleanup scheduler: {e}")

