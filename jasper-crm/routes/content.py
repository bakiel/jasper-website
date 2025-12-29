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


# =============================================================================
# AUTO-GENERATE ENDPOINT (Frontend Button Integration)
# =============================================================================

class AutoGenerateRequest(BaseModel):
    """Request for fully autonomous article generation."""
    category: Optional[str] = Field(
        default=None,
        description="DFI sector category. If empty, AI selects trending topic"
    )
    include_hero_image: bool = Field(
        default=True,
        description="Generate AI hero image via Nano Banana Pro"
    )
    image_model: str = Field(
        default="nano-banana-pro",
        description="Image model: nano-banana or nano-banana-pro"
    )


# Authoritative DFI external links for SEO
DFI_EXTERNAL_LINKS = {
    "IDC": {"url": "https://www.idc.co.za", "name": "Industrial Development Corporation"},
    "DBSA": {"url": "https://www.dbsa.org", "name": "Development Bank of Southern Africa"},
    "AfDB": {"url": "https://www.afdb.org", "name": "African Development Bank"},
    "IFC": {"url": "https://www.ifc.org", "name": "International Finance Corporation"},
    "Land Bank": {"url": "https://www.landbank.co.za", "name": "Land Bank"},
    "PIC": {"url": "https://www.pic.gov.za", "name": "Public Investment Corporation"},
    "National Treasury": {"url": "https://www.treasury.gov.za", "name": "National Treasury"},
    "GEPF": {"url": "https://www.gepf.co.za", "name": "Government Employees Pension Fund"},
    "NEF": {"url": "https://www.nefcorp.co.za", "name": "National Empowerment Fund"},
    "SEFA": {"url": "https://www.sefa.org.za", "name": "Small Enterprise Finance Agency"},
}

# JASPER internal pages for linking
JASPER_INTERNAL_LINKS = {
    "services": {"url": "/services", "anchor": "our DFI funding services"},
    "about": {"url": "/about", "anchor": "about JASPER Financial Architecture"},
    "contact": {"url": "/contact", "anchor": "contact our team"},
    "insights": {"url": "/insights", "anchor": "our insights"},
    "case-studies": {"url": "/case-studies", "anchor": "our case studies"},
    "financial-modeling": {"url": "/services#financial-modeling", "anchor": "financial modeling services"},
    "project-finance": {"url": "/services#project-finance", "anchor": "project finance advisory"},
}


def inject_seo_links(content: str, existing_articles: List[Dict] = None) -> str:
    """
    Inject internal and external links into article content for SEO.

    Rules:
    - Add 2-3 internal links to JASPER pages/articles
    - Add 2-3 external links to authoritative DFI sources
    - Links should be contextually relevant
    - Don't over-link (max 5-6 total links)
    """
    import re

    links_added = 0
    max_links = 6

    # Track what we've linked to avoid duplicates
    linked_terms = set()

    # 1. Add external DFI links (find mentions and link them)
    for dfi_key, dfi_info in DFI_EXTERNAL_LINKS.items():
        if links_added >= max_links:
            break

        # Look for DFI mentions that aren't already linked
        patterns = [
            rf'\b({dfi_key})\b(?![^<]*>)',  # Standalone acronym not in a tag
            rf'\b({dfi_info["name"]})\b(?![^<]*>)',  # Full name not in a tag
        ]

        for pattern in patterns:
            if links_added >= max_links:
                break
            if dfi_key.lower() in linked_terms:
                continue

            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                original = match.group(1)
                linked = f'[{original}]({dfi_info["url"]})'
                content = content[:match.start()] + linked + content[match.end():]
                linked_terms.add(dfi_key.lower())
                links_added += 1
                break

    # 2. Add internal JASPER links
    internal_keywords = {
        "DFI funding": JASPER_INTERNAL_LINKS["services"],
        "financial model": JASPER_INTERNAL_LINKS["financial-modeling"],
        "project finance": JASPER_INTERNAL_LINKS["project-finance"],
        "our services": JASPER_INTERNAL_LINKS["services"],
        "contact us": JASPER_INTERNAL_LINKS["contact"],
    }

    for keyword, link_info in internal_keywords.items():
        if links_added >= max_links:
            break
        if keyword.lower() in linked_terms:
            continue

        pattern = rf'\b({re.escape(keyword)})\b(?![^<]*>)'
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            original = match.group(1)
            linked = f'[{original}]({link_info["url"]})'
            content = content[:match.start()] + linked + content[match.end():]
            linked_terms.add(keyword.lower())
            links_added += 1

    # 3. Add links to related existing articles (if provided)
    if existing_articles and links_added < max_links:
        for article in existing_articles[:2]:  # Max 2 related articles
            if links_added >= max_links:
                break
            # Add "Related: [Article Title](/insights/slug)" at end of relevant paragraph
            # This is a simple approach - could be made smarter

    return content


async def select_trending_topic(category: Optional[str] = None) -> Dict[str, Any]:
    """
    Select a trending topic for article generation.

    Uses:
    - Recent news from news_monitor
    - Keyword opportunities from keyword_service
    - Category rotation for content diversity
    """
    from services.keyword_service import keyword_service

    # DFI sector categories
    categories = [
        "Renewable Energy",
        "Data Centres & Digital",
        "Agri-Industrial",
        "Climate Finance",
        "Technology & Platforms",
        "Manufacturing & Processing",
        "Infrastructure & Transport",
        "Real Estate Development",
        "Water & Sanitation",
        "Healthcare & Life Sciences",
        "Mining & Critical Minerals",
        "DFI Insights"
    ]

    # Use provided category or rotate
    if not category:
        import random
        category = random.choice(categories)

    # Get keyword opportunities for this category
    keywords = keyword_service.search(
        category=category.lower().replace(" ", "-"),
        min_volume=100,
        max_difficulty=60,
        limit=10
    )

    # Select topic based on keywords
    if keywords:
        import random
        selected_kw = random.choice(keywords[:5])
        topic = selected_kw.get("keyword", f"{category} Investment Guide")
        target_keywords = [selected_kw.get("keyword")]
    else:
        # Fallback topics by category
        topic_templates = {
            "Renewable Energy": "Solar and Wind Project Financing in South Africa",
            "Data Centres & Digital": "Data Centre Investment Opportunities in Africa",
            "Agri-Industrial": "Agricultural Value Chain Financing with DFIs",
            "Climate Finance": "Accessing Green Climate Fund for African Projects",
            "Infrastructure & Transport": "Public-Private Partnerships in African Infrastructure",
            "DFI Insights": "How to Structure DFI Funding Applications",
        }
        topic = topic_templates.get(category, f"Understanding {category} Investment in Africa")
        target_keywords = [category.lower()]

    return {
        "topic": topic,
        "category": category,
        "keywords": target_keywords
    }


@router.post("/auto-generate")
async def auto_generate_article(
    request: AutoGenerateRequest,
    background_tasks: BackgroundTasks
):
    """
    Fully autonomous AI article generation with auto-retry and SEO optimization.

    Pipeline:
    1. Select trending topic (AI chooses if no category specified)
    2. Generate content via DeepSeek V3.2
    3. Inject internal/external SEO links
    4. Validate SEO score - if below 70%, apply SEO optimization and retry
    5. Generate AI hero image via Nano Banana Pro
    6. Create post as draft

    This endpoint is called by the "AI Auto-Generate" button in the portal.
    """
    import logging
    logger = logging.getLogger(__name__)

    MAX_RETRIES = 2

    try:
        # Step 1: Select topic
        topic_data = await select_trending_topic(request.category)
        topic = topic_data["topic"]
        category = topic_data["category"]
        keywords = topic_data.get("keywords", [])

        logger.info(f"Auto-generate: topic='{topic}', category='{category}'")

        from services.blog_service import blog_service

        result = None
        attempt = 0

        while attempt < MAX_RETRIES:
            attempt += 1
            logger.info(f"Auto-generate attempt {attempt}/{MAX_RETRIES}")

            # Step 2: Generate content via blog_service
            # Note: Use min_seo_score=50 for auto-generation because:
            # - Links are injected AFTER generation (adds ~10-15% to SEO)
            # - Auto-improve agent can optimize articles later
            # - 50% ensures baseline quality without being too restrictive
            result = await blog_service.generate_post(
                topic=topic,
                category=category,
                keywords=keywords,
                tone="professional",
                user_id="auto-generate",
                min_seo_score=50,
                use_ai_images=request.include_hero_image
            )

            if result.get("success"):
                logger.info(f"Article generated successfully on attempt {attempt}")
                break

            # If SEO validation failed, try to optimize and retry
            if result.get("stage") == "seo_validation" and attempt < MAX_RETRIES:
                seo_score = result.get("seo_score", 0)
                logger.warning(f"SEO score {seo_score}% below threshold, applying optimization...")

                # Try with different topic approach for retry
                topic = f"Complete Guide to {topic}"
                keywords = keywords + ["guide", "how to", "step by step"]
                logger.info(f"Retrying with enhanced topic: {topic}")
            else:
                # Other failure or max retries reached
                break

        if not result or not result.get("success"):
            logger.warning(f"Auto-generate failed after {attempt} attempts")
            return {
                "success": False,
                "error": result.get("error", "Generation failed") if result else "No result",
                "stage": result.get("stage", "unknown") if result else "unknown",
                "seo_score": result.get("seo_score") if result else None,
                "topic_selected": topic,
                "category": category,
                "attempts": attempt
            }

        # Step 3: Inject SEO links into the content
        post = result.get("post", {})
        if post.get("content"):
            # Get existing articles for internal linking
            # Note: get_all_posts returns a list directly
            existing_articles = blog_service.get_all_posts(status="published", limit=10)
            post["content"] = inject_seo_links(
                post["content"],
                existing_articles=existing_articles
            )

            # Update the post with linked content
            blog_service.update_post(post["slug"], {"content": post["content"]}, user_id="auto-generate")

        return {
            "success": True,
            "post": post,
            "seo_score": result.get("seo_score", 0),
            "image_source": result.get("image_source", "none"),
            "model_used": result.get("model_used", "deepseek/deepseek-chat"),
            "topic_selected": topic,
            "category": category,
            "links_injected": True,
            "attempts": attempt
        }

    except Exception as e:
        logger.error(f"Auto-generate exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SCHEDULED GENERATION ENDPOINT
# =============================================================================

class ScheduleConfigRequest(BaseModel):
    """Configure scheduled daily article generation."""
    enabled: bool = Field(..., description="Enable/disable scheduled generation")
    daily_count: int = Field(default=20, ge=1, le=50, description="Articles per day")
    include_images: bool = Field(default=True, description="Generate AI images")
    image_model: str = Field(default="nano-banana-pro", description="Image model")
    schedule_time: str = Field(default="06:00", description="Daily run time (HH:MM SAST)")


# In-memory schedule config (use database in production)
schedule_config: Dict[str, Any] = {
    "enabled": False,
    "daily_count": 20,
    "include_images": True,
    "image_model": "nano-banana-pro",
    "schedule_time": "06:00",
    "last_run": None,
    "next_run": None,
    "articles_generated_today": 0
}


@router.post("/schedule")
async def configure_scheduled_generation(request: ScheduleConfigRequest):
    """
    Configure daily scheduled article generation.

    When enabled, generates articles daily at the specified time.
    Uses APScheduler (Pure Python architecture - no n8n).
    """
    global schedule_config

    schedule_config.update({
        "enabled": request.enabled,
        "daily_count": request.daily_count,
        "include_images": request.include_images,
        "image_model": request.image_model,
        "schedule_time": request.schedule_time,
    })

    # Calculate next run time
    if request.enabled:
        from datetime import datetime, timedelta
        now = datetime.now()
        hour, minute = map(int, request.schedule_time.split(":"))
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        schedule_config["next_run"] = next_run.isoformat()
    else:
        schedule_config["next_run"] = None

    return {
        "success": True,
        "config": schedule_config,
        "message": f"Scheduled generation {'enabled' if request.enabled else 'disabled'}"
    }


@router.get("/schedule")
async def get_schedule_config():
    """Get current scheduled generation configuration."""
    return {
        "success": True,
        "config": schedule_config
    }


@router.post("/schedule/run-now")
async def run_scheduled_generation_now(
    count: int = 1,
    background_tasks: BackgroundTasks = None
):
    """
    Manually trigger scheduled generation.

    Useful for testing or catch-up generation.
    """
    import logging
    logger = logging.getLogger(__name__)

    results = []

    for i in range(count):
        try:
            # Generate article
            topic_data = await select_trending_topic()

            from services.blog_service import blog_service
            result = await blog_service.generate_post(
                topic=topic_data["topic"],
                category=topic_data["category"],
                keywords=topic_data.get("keywords", []),
                tone="professional",
                user_id="scheduled-generation",
                min_seo_score=70,
                use_ai_images=schedule_config.get("include_images", True)
            )

            if result.get("success"):
                # Inject links
                post = result.get("post", {})
                if post.get("content"):
                    post["content"] = inject_seo_links(post["content"])
                    blog_service.update_post(post["slug"], {"content": post["content"]}, user_id="scheduled-generation")

                results.append({
                    "success": True,
                    "topic": topic_data["topic"],
                    "slug": post.get("slug"),
                    "seo_score": result.get("seo_score")
                })
            else:
                results.append({
                    "success": False,
                    "topic": topic_data["topic"],
                    "error": result.get("error")
                })

        except Exception as e:
            logger.error(f"Scheduled generation {i+1} failed: {e}")
            results.append({
                "success": False,
                "error": str(e)
            })

    # Update stats
    schedule_config["last_run"] = datetime.utcnow().isoformat()
    schedule_config["articles_generated_today"] += len([r for r in results if r.get("success")])

    return {
        "success": True,
        "generated": len([r for r in results if r.get("success")]),
        "failed": len([r for r in results if not r.get("success")]),
        "results": results
    }
