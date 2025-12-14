"""
JASPER News Monitor API Routes
Endpoints for news monitoring, content generation, and scheduling.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.news_monitor import news_monitor, NEWS_SOURCES
from services.logging_service import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/news", tags=["News Monitor"])


class ScanRequest(BaseModel):
    """Request to trigger a news scan"""
    max_posts: int = 3
    min_relevance: float = 50.0


class ScanResponse(BaseModel):
    """Response from news scan"""
    success: bool
    message: str
    scan_time: str
    items_found: int
    items_processed: int
    results: List[Dict[str, Any]]


@router.get("/status")
async def get_monitor_status():
    """Get news monitor status"""
    return {
        "success": True,
        "status": news_monitor.get_status(),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/sources")
async def get_news_sources():
    """Get configured news sources"""
    sources = []
    for source_id, config in NEWS_SOURCES.items():
        sources.append({
            "id": source_id,
            "name": config["name"],
            "category": config["category"].value,
            "keywords": config.get("keywords", [])
        })

    return {
        "success": True,
        "sources": sources,
        "total": len(sources)
    }


@router.post("/scan", response_model=ScanResponse)
async def trigger_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Trigger a news scan cycle.
    Scans all configured sources for relevant news and generates content.
    """
    try:
        logger.info(f"Manual scan triggered: max_posts={request.max_posts}")

        # Run scan cycle
        result = await news_monitor.run_scan_cycle(max_posts=request.max_posts)

        return ScanResponse(
            success=True,
            message=f"Scan complete. Generated {result['items_processed']} posts.",
            scan_time=result["scan_time"],
            items_found=result["items_found"],
            items_processed=result["items_processed"],
            results=result["results"]
        )

    except Exception as e:
        logger.error(f"Scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent")
async def get_recent_items(limit: int = 10):
    """Get recently processed news items"""
    items = news_monitor.get_recent_items(limit=limit)
    return {
        "success": True,
        "items": items,
        "total": len(items)
    }


@router.post("/scan-preview")
async def preview_scan():
    """
    Preview what a scan would find without generating content.
    Useful for testing and monitoring.
    """
    try:
        items = await news_monitor.scan_all_sources()

        preview = []
        for item in items[:20]:
            preview.append({
                "id": item.id,
                "title": item.title,
                "source": item.source,
                "category": item.category.value,
                "relevance_score": item.relevance_score,
                "keywords": item.keywords[:5],
                "published_at": item.published_at.isoformat(),
                "link": item.link
            })

        return {
            "success": True,
            "preview": preview,
            "total_found": len(items),
            "high_relevance": len([i for i in items if i.relevance_score >= 50]),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Preview scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-for-topic")
async def generate_content_for_topic(
    topic: str,
    category: str = "DFI Insights",
    keywords: List[str] = None
):
    """
    Manually generate SEO content for a specific topic.
    Use this when you spot news that the automated scan missed.
    """
    from services.news_monitor import NewsItem, NewsCategory

    # Create a synthetic news item
    item = NewsItem(
        id=f"manual-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        title=topic,
        summary=topic,
        link="",
        source="Manual Entry",
        category=NewsCategory.DFI_ANNOUNCEMENT,
        published_at=datetime.now(),
        relevance_score=100.0,
        keywords=keywords or []
    )

    try:
        content = await news_monitor.generate_content_for_news(item)

        if content:
            return {
                "success": True,
                "content": content,
                "message": "Content generated. Review and publish via /api/blog/auto-post"
            }
        else:
            return {
                "success": False,
                "message": "Content generation failed"
            }

    except Exception as e:
        logger.error(f"Manual content generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
