"""
JASPER CRM - Content Generation Routes

API endpoints for AI-powered content generation.
Connects CRM insights to blog/SEO content marketing.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.content_service import content_service
from services.keyword_service import keyword_service
from services.image_service import image_service
from agents.seo_agent import content_optimizer, keyword_research_agent
from orchestrator.events import content_requested_event, EventType

router = APIRouter(prefix="/api/v1/content", tags=["Content"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class GenerateContentRequest(BaseModel):
    """Request to generate blog content."""
    topic: str = Field(..., description="Blog post topic or title")
    category: str = Field(
        default="dfi-insights",
        description="Blog category: dfi-insights, financial-modeling, infrastructure-finance, case-studies, industry-news"
    )
    seo_keywords: Optional[List[str]] = Field(
        default=None,
        description="Target SEO keywords (auto-selected if not provided)"
    )
    lead_id: Optional[str] = Field(
        default=None,
        description="Optional lead ID for contextual content"
    )
    tone: str = Field(
        default="professional",
        description="Writing tone: professional, educational, thought-leadership"
    )
    publish_immediately: bool = Field(
        default=False,
        description="Whether to publish immediately or save as draft"
    )


class ContentSuggestionsRequest(BaseModel):
    """Request for content suggestions based on CRM data."""
    recent_leads_sectors: Optional[List[str]] = Field(
        default=None,
        description="Sectors from recent leads"
    )
    trending_questions: Optional[List[str]] = Field(
        default=None,
        description="Common questions from leads"
    )


class ContentResponse(BaseModel):
    """Response with generated content."""
    success: bool
    title: Optional[str] = None
    content: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    tags: Optional[List[str]] = None
    published: bool = False
    post_id: Optional[str] = None
    error: Optional[str] = None
    generated_at: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=ContentResponse)
async def generate_content(
    request: GenerateContentRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate AI-powered blog content.

    Uses DeepSeek V3.2 to create SEO-optimized blog posts based on
    the topic and optional CRM context.

    Example:
        POST /api/v1/content/generate
        {
            "topic": "How IDC Funds Infrastructure Projects",
            "category": "dfi-insights",
            "publish_immediately": false
        }
    """
    try:
        # Get lead context if provided
        lead_context = None
        if request.lead_id:
            # TODO: Fetch lead context from lead service
            pass

        result = await content_service.generate_and_publish(
            topic=request.topic,
            category=request.category,
            seo_keywords=request.seo_keywords,
            lead_context=lead_context,
            publish_immediately=request.publish_immediately
        )

        if result.get("error"):
            return ContentResponse(
                success=False,
                error=result["error"]
            )

        generated = result.get("generated", {})

        return ContentResponse(
            success=True,
            title=generated.get("title"),
            content=generated.get("content"),
            seo_title=generated.get("seoTitle"),
            seo_description=generated.get("seoDescription"),
            tags=generated.get("tags"),
            published=result.get("published", False),
            post_id=result.get("data", {}).get("id") if result.get("success") else None,
            generated_at=generated.get("generated_at")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-async")
async def generate_content_async(
    request: GenerateContentRequest,
    background_tasks: BackgroundTasks
):
    """
    Queue content generation in background.

    Returns immediately with a task ID. Use for long-running
    content generation when you don't need to wait.
    """
    import uuid
    task_id = str(uuid.uuid4())

    async def generate_task():
        result = await content_service.generate_and_publish(
            topic=request.topic,
            category=request.category,
            seo_keywords=request.seo_keywords,
            publish_immediately=request.publish_immediately
        )
        # TODO: Store result for retrieval
        return result

    background_tasks.add_task(generate_task)

    return {
        "task_id": task_id,
        "status": "queued",
        "message": "Content generation started in background"
    }


@router.post("/suggestions")
async def get_content_suggestions(request: ContentSuggestionsRequest):
    """
    Get AI-suggested blog topics based on CRM insights.

    Analyzes lead patterns, common questions, and SEO opportunities
    to suggest high-value content topics.

    Example:
        POST /api/v1/content/suggestions
        {
            "recent_leads_sectors": ["renewable-energy", "infrastructure", "agribusiness"],
            "trending_questions": ["How do I apply for IDC funding?"]
        }
    """
    suggestions = content_service.suggest_content_from_crm(
        recent_leads_sectors=request.recent_leads_sectors,
        trending_questions=request.trending_questions
    )

    return {
        "suggestions": suggestions,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/keywords")
async def get_seo_keywords(
    category: Optional[str] = None,
    min_volume: int = 0,
    max_difficulty: int = 100,
    limit: int = 50
):
    """
    Get available SEO keywords for content planning.

    Filter by category, search volume, and difficulty to find
    the best keywords for targeting.
    """
    keywords = content_service.seo_keywords

    # Apply filters
    filtered = []
    for kw in keywords:
        if category and kw.get("category", "").lower() != category.lower():
            continue
        if kw.get("volume", 0) < min_volume:
            continue
        if kw.get("difficulty", 100) > max_difficulty:
            continue
        filtered.append(kw)

    # Sort by volume/difficulty ratio
    filtered.sort(
        key=lambda x: x.get("volume", 0) / max(x.get("difficulty", 50), 1),
        reverse=True
    )

    return {
        "keywords": filtered[:limit],
        "total_available": len(content_service.seo_keywords),
        "filtered_count": len(filtered)
    }


@router.post("/event")
async def trigger_content_event(
    topic: str,
    category: str,
    publish: bool = False,
    seo_keywords: Optional[List[str]] = None
):
    """
    Trigger a CONTENT_REQUESTED event for the AgenticBrain.

    This sends the content request through the orchestrator
    for AI-driven decision making.
    """
    event = content_requested_event(
        topic=topic,
        category=category,
        seo_keywords=seo_keywords,
        publish_immediately=publish,
        trigger_source="api"
    )

    return {
        "event_id": event.id,
        "event_type": event.type,
        "status": "dispatched",
        "message": "Content event sent to AgenticBrain"
    }


# =============================================================================
# SEO-ENHANCED CONTENT ENDPOINTS
# =============================================================================

class GenerateWithSEORequest(BaseModel):
    """Request for SEO-optimized content generation."""
    topic: str = Field(..., description="Blog post topic")
    category: str = Field(default="dfi-insights", description="Blog category")
    target_seo_score: int = Field(default=70, description="Minimum SEO score (0-100)")
    auto_optimize: bool = Field(default=True, description="Auto-optimize if below target")
    publish_immediately: bool = Field(default=False, description="Publish after optimization")


@router.post("/generate-seo-optimized")
async def generate_seo_optimized_content(request: GenerateWithSEORequest):
    """
    Generate content with automatic SEO optimization.

    Flow:
    1. Get keyword recommendations for topic
    2. Generate content with keywords
    3. Score content for SEO
    4. Auto-optimize if below target score
    5. Publish (optional)

    Returns content with SEO score and optimization details.
    """
    try:
        # Step 1: Get keyword recommendations
        keyword_recs = await keyword_service.recommend_for_topic(
            topic=request.topic,
            category=request.category,
            count=5,
        )

        # Extract target keywords
        existing_keywords = [
            kw["keyword"] for kw in keyword_recs.get("existing_matches", [])[:3]
        ]
        ai_keywords = keyword_recs.get("ai_suggestions", {}).get("primary_keyword", [])
        if ai_keywords and isinstance(ai_keywords, str):
            ai_keywords = [ai_keywords]

        target_keywords = existing_keywords + (ai_keywords if isinstance(ai_keywords, list) else [])
        if not target_keywords:
            target_keywords = [request.topic.lower()]

        # Step 2: Generate content
        generated = await content_service.generate_blog_post(
            topic=request.topic,
            category=request.category,
            seo_keywords=target_keywords,
        )

        if generated.get("error"):
            return {
                "success": False,
                "error": generated["error"],
            }

        content = generated.get("content", "")

        # Step 3: Score content
        score_result = await content_optimizer.score_content(
            content=content,
            target_keywords=target_keywords,
            content_type="blog",
        )

        initial_score = score_result.get("ai_analysis", {}).get("overall_score", 0)

        # Step 4: Optimize if needed
        optimized_content = content
        optimization_applied = False

        if request.auto_optimize and initial_score < request.target_seo_score:
            optimization = await content_optimizer.optimize_content(
                content=content,
                target_keywords=target_keywords,
                optimization_level="moderate",
            )

            if optimization.get("optimized_content"):
                optimized_content = optimization["optimized_content"]
                optimization_applied = True

                # Re-score optimized content
                score_result = await content_optimizer.score_content(
                    content=optimized_content,
                    target_keywords=target_keywords,
                    content_type="blog",
                )

        final_score = score_result.get("ai_analysis", {}).get("overall_score", 0)

        # Step 5: Generate meta tags
        meta_tags = await content_optimizer.generate_meta_tags(
            content=optimized_content,
            target_keywords=target_keywords,
            page_type="blog",
        )

        # Step 6: Publish if requested
        published = False
        post_id = None

        if request.publish_immediately:
            publish_result = await content_service.publish_blog_post(
                title=generated.get("title", request.topic),
                content=optimized_content,
                category=request.category,
                tags=target_keywords,
                seo_title=meta_tags.get("title"),
                seo_description=meta_tags.get("description"),
                publish_immediately=True,
            )
            published = publish_result.get("success", False)
            post_id = publish_result.get("data", {}).get("id")

        return {
            "success": True,
            "title": generated.get("title"),
            "content": optimized_content,
            "target_keywords": target_keywords,
            "seo_score": {
                "initial": initial_score,
                "final": final_score,
                "target": request.target_seo_score,
                "met_target": final_score >= request.target_seo_score,
            },
            "optimization_applied": optimization_applied,
            "meta_tags": meta_tags,
            "keyword_analysis": keyword_recs,
            "score_breakdown": score_result.get("ai_analysis", {}).get("score_breakdown"),
            "improvements": score_result.get("ai_analysis", {}).get("improvements", []),
            "published": published,
            "post_id": post_id,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score-existing")
async def score_existing_content(
    content: str,
    target_keywords: List[str] = None,
):
    """
    Score existing content for SEO quality.

    Useful for auditing existing blog posts.
    """
    if not target_keywords:
        # Auto-detect keywords from content
        target_keywords = []

    try:
        result = await content_optimizer.score_content(
            content=content,
            target_keywords=target_keywords,
            content_type="blog",
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-existing")
async def optimize_existing_content(
    content: str,
    target_keywords: List[str],
    optimization_level: str = "moderate",
):
    """
    Optimize existing content for SEO.
    """
    try:
        result = await content_optimizer.optimize_content(
            content=content,
            target_keywords=target_keywords,
            optimization_level=optimization_level,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# BATCH CONTENT GENERATION
# =============================================================================

class BatchGenerateRequest(BaseModel):
    """Request for batch article generation."""
    topics: List[Dict[str, Any]] = Field(
        ...,
        description="List of topics with category and seo_keywords"
    )
    publish_immediately: bool = Field(
        default=False,
        description="Publish all articles immediately"
    )
    target_seo_score: int = Field(
        default=70,
        description="Minimum SEO score target"
    )


# In-memory task storage (use Redis in production)
batch_tasks: Dict[str, Dict[str, Any]] = {}


@router.post("/batch-generate")
async def batch_generate_content(
    request: BatchGenerateRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate multiple articles in batch.

    Queues all articles for background generation and returns a task ID
    for tracking progress.

    Example:
        POST /api/v1/content/batch-generate
        {
            "topics": [
                {"topic": "IDC Funding Guide", "category": "dfi-insights"},
                {"topic": "Financial Modeling Best Practices", "category": "financial-modeling"}
            ],
            "publish_immediately": false
        }
    """
    import uuid

    task_id = str(uuid.uuid4())

    # Initialize task tracking
    batch_tasks[task_id] = {
        "id": task_id,
        "status": "queued",
        "total": len(request.topics),
        "completed": 0,
        "failed": 0,
        "results": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }

    async def process_batch():
        """Process all articles in the batch."""
        task = batch_tasks[task_id]
        task["status"] = "processing"

        for i, topic_data in enumerate(request.topics):
            try:
                # Generate with SEO optimization
                keyword_recs = await keyword_service.recommend_for_topic(
                    topic=topic_data.get("topic", ""),
                    category=topic_data.get("category", "dfi-insights"),
                    count=3
                )

                target_keywords = topic_data.get("seo_keywords", [])
                if not target_keywords:
                    target_keywords = [
                        kw["keyword"]
                        for kw in keyword_recs.get("existing_matches", [])[:3]
                    ]

                generated = await content_service.generate_blog_post(
                    topic=topic_data.get("topic"),
                    category=topic_data.get("category", "dfi-insights"),
                    seo_keywords=target_keywords
                )

                if generated.get("error"):
                    task["failed"] += 1
                    task["results"].append({
                        "topic": topic_data.get("topic"),
                        "success": False,
                        "error": generated["error"]
                    })
                else:
                    # Fetch curated images for the article
                    images_result = await image_service.get_images_for_article(
                        topic=topic_data.get("topic"),
                        category=topic_data.get("category", "dfi-insights"),
                        count=3
                    )

                    task["completed"] += 1
                    task["results"].append({
                        "topic": topic_data.get("topic"),
                        "success": True,
                        "title": generated.get("title"),
                        "published": request.publish_immediately,
                        "images": images_result.get("images", []),
                        "featured_image": images_result.get("images", [{}])[0] if images_result.get("images") else None
                    })

            except Exception as e:
                task["failed"] += 1
                task["results"].append({
                    "topic": topic_data.get("topic"),
                    "success": False,
                    "error": str(e)
                })

        task["status"] = "completed"
        task["completed_at"] = datetime.utcnow().isoformat()

    background_tasks.add_task(process_batch)

    return {
        "task_id": task_id,
        "status": "queued",
        "total_articles": len(request.topics),
        "message": f"Batch generation of {len(request.topics)} articles started",
        "track_url": f"/api/v1/content/batch-status/{task_id}"
    }


@router.get("/batch-status/{task_id}")
async def get_batch_status(task_id: str):
    """Get the status of a batch generation task."""
    if task_id not in batch_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = batch_tasks[task_id]

    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": {
            "total": task["total"],
            "completed": task["completed"],
            "failed": task["failed"],
            "percentage": round((task["completed"] + task["failed"]) / task["total"] * 100, 1) if task["total"] > 0 else 0
        },
        "started_at": task["started_at"],
        "completed_at": task["completed_at"],
        "results": task["results"] if task["status"] == "completed" else None
    }


@router.get("/scheduled-tasks")
async def get_scheduled_tasks():
    """
    Get all scheduled and running content generation tasks.

    Returns batch tasks and their current status for dashboard display.
    """
    tasks = []

    for task_id, task in batch_tasks.items():
        tasks.append({
            "id": task_id,
            "type": "batch_content_generation",
            "status": task["status"],
            "progress": f"{task['completed']}/{task['total']}",
            "started_at": task["started_at"],
            "completed_at": task["completed_at"]
        })

    return {
        "tasks": tasks,
        "total_tasks": len(tasks),
        "active_tasks": len([t for t in tasks if t["status"] == "processing"]),
        "queued_tasks": len([t for t in tasks if t["status"] == "queued"]),
        "completed_tasks": len([t for t in tasks if t["status"] == "completed"])
    }
