"""
JASPER CRM - SEO Routes

API endpoints for SEO agent system:
- Keyword research and analysis
- Content optimization scoring
- Technical SEO analysis
- Keyword database management

Integrates with existing keyword CSV infrastructure.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.keyword_service import keyword_service
from agents.seo_agent import (
    keyword_research_agent,
    content_optimizer,
    technical_seo_agent,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/seo", tags=["SEO"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class KeywordAnalysisRequest(BaseModel):
    """Request for keyword analysis"""
    keyword: str = Field(..., description="Keyword to analyze")


class KeywordSearchRequest(BaseModel):
    """Request for keyword search"""
    query: Optional[str] = None
    category: Optional[str] = None
    intent: Optional[str] = None
    min_volume: Optional[int] = None
    max_difficulty: Optional[int] = None
    limit: int = 50


class ContentScoreRequest(BaseModel):
    """Request for content SEO scoring"""
    content: str = Field(..., description="Content to score")
    target_keywords: List[str] = Field(..., description="Target keywords")
    content_type: str = Field("blog", description="blog|landing|guide")


class ContentOptimizeRequest(BaseModel):
    """Request for content optimization"""
    content: str = Field(..., description="Content to optimize")
    target_keywords: List[str] = Field(..., description="Target keywords")
    optimization_level: str = Field("moderate", description="light|moderate|aggressive")


class MetaTagsRequest(BaseModel):
    """Request for meta tag generation"""
    content: str = Field(..., description="Content for meta tags")
    target_keywords: List[str] = Field(..., description="Target keywords")
    page_type: str = Field("blog", description="Page type")


class SchemaRequest(BaseModel):
    """Request for schema generation"""
    title: str
    description: str
    author: Optional[str] = "JASPER Financial Architecture"
    category: Optional[str] = "DFI Insights"
    schema_type: str = Field("Article", description="Article|BlogPosting|WebPage")


class TopicOpportunitiesRequest(BaseModel):
    """Request for topic keyword opportunities"""
    topic: str = Field(..., description="Topic to find keywords for")
    category: Optional[str] = None


class KeywordClusterRequest(BaseModel):
    """Request for keyword clustering"""
    keywords: List[str] = Field(..., description="Keywords to cluster")


class InternalLinksRequest(BaseModel):
    """Request for internal link suggestions"""
    content: str = Field(..., description="Content to add links to")
    available_pages: List[dict] = Field(..., description="List of {title, url, keywords}")


class TechnicalAnalysisRequest(BaseModel):
    """Request for technical SEO analysis"""
    html_content: Optional[str] = None
    page_url: Optional[str] = None


# =============================================================================
# KEYWORD DATABASE ENDPOINTS
# =============================================================================

@router.get("/keywords/stats")
async def get_keyword_stats():
    """
    Get keyword database statistics.

    Returns counts by category, total keywords, etc.
    """
    stats = keyword_service.get_stats()
    return {
        "success": True,
        "stats": stats,
    }


@router.get("/keywords/categories")
async def get_categories():
    """
    Get all keyword categories with counts.
    """
    categories = keyword_service.get_categories()
    return {
        "success": True,
        "categories": categories,
    }


@router.post("/keywords/search")
async def search_keywords(request: KeywordSearchRequest):
    """
    Search keywords with filters.

    Supports filtering by:
    - query: text search
    - category: keyword category
    - intent: search intent
    - volume/difficulty ranges
    """
    results = keyword_service.search(
        query=request.query,
        category=request.category,
        intent=request.intent,
        min_volume=request.min_volume,
        max_difficulty=request.max_difficulty,
        limit=request.limit,
    )

    return {
        "success": True,
        "keywords": results,
        "total": len(results),
    }


@router.get("/keywords/category/{category}")
async def get_keywords_by_category(
    category: str,
    limit: int = Query(100, description="Max results"),
):
    """
    Get all keywords for a specific category.
    """
    keywords = keyword_service.get_by_category(category)
    return {
        "success": True,
        "category": category,
        "keywords": keywords[:limit],
        "total": len(keywords),
    }


# =============================================================================
# KEYWORD RESEARCH ENDPOINTS
# =============================================================================

@router.post("/research/analyze")
async def analyze_keyword(request: KeywordAnalysisRequest):
    """
    Deep analysis of a single keyword using AI.

    Returns:
    - Existing data from database (if any)
    - AI-powered analysis (volume, difficulty, intent estimates)
    - Related keywords and content suggestions
    """
    try:
        result = await keyword_research_agent.analyze_keyword(request.keyword)
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Keyword analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/opportunities")
async def find_opportunities(request: TopicOpportunitiesRequest):
    """
    Find keyword opportunities for a topic.

    Uses existing keywords + AI to suggest targets.
    """
    try:
        result = await keyword_research_agent.find_opportunities(
            topic=request.topic,
            category=request.category,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Opportunity analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/cluster")
async def cluster_keywords(request: KeywordClusterRequest):
    """
    Group keywords into semantic clusters.

    Useful for content planning and pillar page strategy.
    """
    try:
        result = await keyword_research_agent.cluster_keywords(request.keywords)
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Clustering error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/enrich")
async def enrich_keyword(request: KeywordAnalysisRequest):
    """
    Enrich a keyword with AI analysis.

    Estimates volume, difficulty, intent without external API.
    """
    try:
        result = await keyword_service.enrich_keyword(request.keyword)
        return {
            "success": True,
            "enrichment": result,
        }
    except Exception as e:
        logger.error(f"Enrichment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/research/gap-analysis")
async def gap_analysis(
    sector: Optional[str] = Query(None, description="Sector focus"),
):
    """
    Analyze keyword gaps and opportunities.
    """
    try:
        result = await keyword_service.gap_analysis(sector=sector)
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Gap analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CONTENT OPTIMIZATION ENDPOINTS
# =============================================================================

@router.post("/content/score")
async def score_content(request: ContentScoreRequest):
    """
    Calculate SEO score for content.

    Returns:
    - Overall score (0-100)
    - Breakdown by category
    - Specific improvements
    - Optimized meta tags
    """
    try:
        result = await content_optimizer.score_content(
            content=request.content,
            target_keywords=request.target_keywords,
            content_type=request.content_type,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Content scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content/optimize")
async def optimize_content(request: ContentOptimizeRequest):
    """
    Generate optimized version of content.

    Applies SEO improvements while maintaining quality.
    """
    try:
        result = await content_optimizer.optimize_content(
            content=request.content,
            target_keywords=request.target_keywords,
            optimization_level=request.optimization_level,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Content optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content/meta-tags")
async def generate_meta_tags(request: MetaTagsRequest):
    """
    Generate SEO meta tags for content.

    Returns title, description, OG tags, Twitter cards.
    """
    try:
        result = await content_optimizer.generate_meta_tags(
            content=request.content,
            target_keywords=request.target_keywords,
            page_type=request.page_type,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Meta tag generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content/schema")
async def generate_schema(request: SchemaRequest):
    """
    Generate JSON-LD schema markup.
    """
    try:
        result = await content_optimizer.generate_schema(
            content_data={
                "title": request.title,
                "description": request.description,
                "author": request.author,
                "category": request.category,
            },
            schema_type=request.schema_type,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Schema generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# TECHNICAL SEO ENDPOINTS
# =============================================================================

@router.post("/technical/analyze")
async def analyze_page_structure(request: TechnicalAnalysisRequest):
    """
    Analyze page for technical SEO issues.

    Checks heading structure, images, links, etc.
    """
    try:
        result = await technical_seo_agent.analyze_page_structure(
            html_content=request.html_content,
            page_url=request.page_url,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Technical analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/technical/internal-links")
async def suggest_internal_links(request: InternalLinksRequest):
    """
    Suggest internal linking opportunities.
    """
    try:
        result = await technical_seo_agent.suggest_internal_links(
            current_content=request.content,
            available_pages=request.available_pages,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Internal links error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# INTEGRATION ENDPOINTS (CRM + SEO)
# =============================================================================

@router.get("/suggest-for-lead/{sector}")
async def suggest_keywords_for_lead_sector(sector: str):
    """
    Suggest content keywords based on lead sector.

    Used by CRM to drive content marketing.
    """
    # Find keywords matching the sector
    sector_keywords = keyword_service.search(
        query=sector,
        limit=20,
    )

    # Get category match
    category_map = {
        "agribusiness": "agribusiness",
        "agriculture": "agriculture_africa",
        "real_estate": "real_estate",
        "solar": "solar",
        "renewable": "renewable_energy",
        "water": "water",
        "mining": "mining",
        "healthcare": "healthcare",
        "infrastructure": "infrastructure",
    }

    category = category_map.get(sector.lower(), None)
    if category:
        category_keywords = keyword_service.get_by_category(category)
    else:
        category_keywords = []

    return {
        "success": True,
        "sector": sector,
        "matching_keywords": sector_keywords,
        "category_keywords": category_keywords[:20],
        "content_suggestion": f"Create content about {sector} DFI funding opportunities",
    }


@router.post("/recommend-for-content")
async def recommend_keywords_for_content(
    topic: str = Query(..., description="Content topic"),
    category: str = Query(None, description="Content category"),
):
    """
    Get keyword recommendations for new content.

    Integration point for ContentService.
    """
    try:
        result = await keyword_service.recommend_for_topic(
            topic=topic,
            category=category,
            count=10,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
