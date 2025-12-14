"""
JASPER Lead Prospector API Routes
Endpoints for automated lead prospecting and generation.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.lead_prospector import lead_prospector
from services.logging_service import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/prospector", tags=["Lead Prospector"])


class ProspectRequest(BaseModel):
    """Request to run prospecting"""
    max_leads: int = 5
    sectors: Optional[List[str]] = None


class ProspectResponse(BaseModel):
    """Response from prospecting cycle"""
    success: bool
    message: str
    cycle_time: str
    news_items_scanned: int
    prospects_found: int
    leads_created: int
    leads: List[Dict[str, Any]]


@router.get("/status")
async def get_prospector_status():
    """Get lead prospector status"""
    return {
        "success": True,
        "status": lead_prospector.get_status(),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/run", response_model=ProspectResponse)
async def run_prospecting(request: ProspectRequest, background_tasks: BackgroundTasks):
    """
    Run a lead prospecting cycle.
    Scans news sources for potential leads and creates them in CRM.
    """
    try:
        logger.info(f"Manual prospecting triggered: max_leads={request.max_leads}")

        # Run prospecting cycle
        result = await lead_prospector.run_prospecting_cycle(max_leads=request.max_leads)

        return ProspectResponse(
            success=True,
            message=f"Prospecting complete. Created {result['leads_created']} leads from {result['prospects_found']} prospects.",
            cycle_time=result["cycle_time"],
            news_items_scanned=result["news_items_scanned"],
            prospects_found=result["prospects_found"],
            leads_created=result["leads_created"],
            leads=result["leads"]
        )

    except Exception as e:
        logger.error(f"Prospecting failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prospects")
async def get_current_prospects(limit: int = 20):
    """Get current prospect list (not yet converted to leads)"""
    prospects = list(lead_prospector.prospects.values())

    # Sort by relevance
    prospects.sort(key=lambda p: p.relevance_score, reverse=True)

    return {
        "success": True,
        "prospects": [
            {
                "company_name": p.company_name,
                "source": p.source,
                "source_url": p.source_url,
                "relevance_score": p.relevance_score,
                "sector": p.sector,
                "deal_indicators": p.deal_indicators,
                "created_at": p.created_at.isoformat()
            }
            for p in prospects[:limit]
        ],
        "total": len(prospects)
    }


@router.post("/prospect-single")
async def prospect_single_source(
    url: str,
    title: str,
    content: str
):
    """
    Manually prospect from a specific news article or source.
    Useful for testing or when you find an article manually.
    """
    from services.news_monitor import NewsItem, NewsCategory

    # Create synthetic news item
    item = NewsItem(
        id=f"manual-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        title=title,
        summary=content,
        link=url,
        source="Manual Entry",
        category=NewsCategory.SECTOR_NEWS,
        published_at=datetime.now(),
        relevance_score=100.0,
        keywords=[]
    )

    try:
        prospects = await lead_prospector.prospect_from_news(item)

        return {
            "success": True,
            "prospects_found": len(prospects),
            "prospects": [
                {
                    "company_name": p.company_name,
                    "relevance_score": p.relevance_score,
                    "sector": p.sector,
                    "deal_indicators": p.deal_indicators
                }
                for p in prospects
            ]
        }

    except Exception as e:
        logger.error(f"Manual prospecting failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
