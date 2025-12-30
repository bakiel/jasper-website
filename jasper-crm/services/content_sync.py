"""
JASPER CRM - Content Sync Service

Syncs articles from CRM to the website (jasper-portal) with quality assurance.
Articles are improved automatically if below 70% threshold.

GROUNDING VERIFICATION:
- All factual claims are verified against ALEPH knowledge base (FREE)
- Unverified claims are checked against web sources (Jina/Gemini)
- Contradicted claims result in automatic rejection
- Grounding threshold: 80% of claims must be verified
"""

import httpx
import logging
import os
from typing import Optional, List, Dict, Any
from datetime import datetime

from models.content import (
    Article, ArticleStatus, SyncStatus,
    QualityEvaluation, ImprovementLog, ImprovementEntry
)
from agents.quality_agent import get_quality_agent, QualityAgent
from agents.grounding_agent import get_grounding_agent

logger = logging.getLogger("jasper-crm.content-sync")


class ContentSyncService:
    """
    Service for syncing articles to the live website.

    Features:
    - Quality check before sync (70% threshold)
    - Auto-improvement of below-threshold articles
    - Real-time sync on publish
    - Bulk sync for scheduled updates
    - Featured article selection by SEO score
    """

    def __init__(
        self,
        portal_api_url: Optional[str] = None,
        sync_api_key: Optional[str] = None,
    ):
        """Initialize the sync service."""
        # Default to jasper-api on VPS (port 9003) or local (port 3003)
        default_url = "http://127.0.0.1:9003" if os.getenv("NODE_ENV") == "production" else "http://127.0.0.1:3003"
        self.portal_api_url = portal_api_url or os.getenv(
            "PORTAL_API_URL", default_url
        )
        # Match the default key in jasper-api for local dev; override in production
        self.sync_api_key = sync_api_key or os.getenv("SYNC_API_KEY", "jasper-sync-key-change-in-production")
        self.quality_agent = get_quality_agent()

        # HTTP client for sync requests
        self.client = httpx.AsyncClient(
            base_url=self.portal_api_url,
            headers={
                "X-Sync-API-Key": self.sync_api_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    async def prepare_and_sync(
        self,
        article: Article,
        force_improve: bool = False
    ) -> Dict[str, Any]:
        """
        Prepare an article for sync, improving if needed, then sync.

        Args:
            article: The Article to sync
            force_improve: If True, always run improvement cycle

        Returns:
            Dict with sync result, updated article, and evaluation
        """
        logger.info(f"Preparing article for sync: {article.title}")

        # Convert article to dict for quality agent
        article_dict = {
            "title": article.title,
            "excerpt": article.excerpt or "",
            "content": article.content,
            "keywords": article.seo.keywords if article.seo else [],
        }

        # Run quality assurance
        result = await self.quality_agent.ensure_hq(article_dict)

        # Update article with quality data
        evaluation = result["evaluation"]
        improvement_log = result.get("improvement_log")

        # Convert agent evaluation to model
        quality = QualityEvaluation(
            overall_score=evaluation.overall_score,
            meets_threshold=evaluation.meets_threshold,
            seo_score=evaluation.dimensions.get("seo", type("", (), {"score": 0})()).score if "seo" in evaluation.dimensions else 0,
            readability_score=evaluation.dimensions.get("readability", type("", (), {"score": 0})()).score if "readability" in evaluation.dimensions else 0,
            dfi_accuracy_score=evaluation.dimensions.get("dfi_accuracy", type("", (), {"score": 0})()).score if "dfi_accuracy" in evaluation.dimensions else 0,
            engagement_score=evaluation.dimensions.get("engagement", type("", (), {"score": 0})()).score if "engagement" in evaluation.dimensions else 0,
            technical_depth_score=evaluation.dimensions.get("technical_depth", type("", (), {"score": 0})()).score if "technical_depth" in evaluation.dimensions else 0,
            originality_score=evaluation.dimensions.get("originality", type("", (), {"score": 0})()).score if "originality" in evaluation.dimensions else 0,
            overall_assessment=evaluation.overall_assessment,
            priority_improvements=evaluation.priority_improvements,
            evaluated_at=datetime.utcnow(),
        )

        article.quality = quality

        # If article was improved, update content
        if result["was_improved"]:
            improved_article = result["article"]
            article.title = improved_article.get("title", article.title)
            article.content = improved_article.get("content", article.content)
            article.excerpt = improved_article.get("excerpt", article.excerpt)
            article.was_auto_improved = True

            if improvement_log:
                article.original_score = improvement_log.original_score
                article.improvement_log = ImprovementLog(
                    original_score=improvement_log.original_score,
                    improved_score=improvement_log.improved_score,
                    score_improvement=improvement_log.improved_score - improvement_log.original_score,
                    improvements=[
                        ImprovementEntry(**imp) for imp in improvement_log.improvements
                    ] if improvement_log.improvements else [],
                    improved_at=datetime.utcnow(),
                )

        article.updated_at = datetime.utcnow()

        # Check if eligible for sync
        if not quality.meets_threshold:
            article.sync_status = SyncStatus.NOT_ELIGIBLE
            article.sync_error = f"Score {quality.overall_score}% below 70% threshold"
            logger.warning(f"Article not eligible for sync: {article.title}")
            return {
                "synced": False,
                "article": article,
                "reason": "below_threshold",
                "score": quality.overall_score,
            }

        # Sync to website
        sync_result = await self._sync_to_website(article)

        return {
            "synced": sync_result["success"],
            "article": article,
            "action": sync_result.get("action"),
            "reason": sync_result.get("reason"),
            "score": quality.overall_score,
        }

    async def _sync_to_website(self, article: Article) -> Dict[str, Any]:
        """
        Send article to the website API.

        Args:
            article: The Article to sync

        Returns:
            Dict with success status and action taken
        """
        logger.info(f"Syncing to website: {article.title}")

        # Build sync payload
        payload = {
            "slug": article.slug,
            "title": article.title,
            "content": article.content,
            "excerpt": article.excerpt or "",
            "category": article.categories[0] if article.categories else "general",
            "author": article.author_name or "JASPER Team",
            "hero_image_url": article.hero_image or "",
            "read_time_minutes": article.read_time_minutes or 5,
            "tags": article.tags,
            "published_at": article.published_at.isoformat() if article.published_at else datetime.utcnow().isoformat(),
            "source_id": article.id,
            "grading": {
                "overall_score": article.quality.overall_score if article.quality else 0,
                "seo_score": article.quality.seo_score if article.quality else 0,
                "readability_score": article.quality.readability_score if article.quality else 0,
                "dfi_accuracy_score": article.quality.dfi_accuracy_score if article.quality else 0,
                "engagement_score": article.quality.engagement_score if article.quality else 0,
                "technical_depth_score": article.quality.technical_depth_score if article.quality else 0,
                "originality_score": article.quality.originality_score if article.quality else 0,
                "was_auto_improved": article.was_auto_improved,
                "original_score": article.original_score,
                "improvements_made": [
                    imp.dimension for imp in article.improvement_log.improvements
                ] if article.improvement_log else [],
            },
        }

        try:
            response = await self.client.post(
                "/api/v1/blog/sync",
                json=payload
            )

            if response.status_code in [200, 201]:
                result = response.json()
                article.sync_status = SyncStatus.SYNCED
                article.synced_at = datetime.utcnow()
                article.sync_error = None
                logger.info(f"Sync successful: {article.slug}")
                return {
                    "success": True,
                    "action": result.get("action", "synced"),
                    "article_slug": article.slug,
                }
            else:
                error_msg = f"Sync failed: {response.status_code} - {response.text}"
                article.sync_status = SyncStatus.FAILED
                article.sync_error = error_msg
                logger.error(error_msg)
                return {
                    "success": False,
                    "reason": error_msg,
                    "article_slug": article.slug,
                }

        except httpx.RequestError as e:
            error_msg = f"Request error: {str(e)}"
            article.sync_status = SyncStatus.FAILED
            article.sync_error = error_msg
            logger.error(error_msg)
            return {
                "success": False,
                "reason": error_msg,
                "article_slug": article.slug,
            }

    async def sync_all_published(
        self,
        articles: List[Article],
        skip_already_synced: bool = True
    ) -> Dict[str, Any]:
        """
        Bulk sync all published articles.

        Args:
            articles: List of articles to sync
            skip_already_synced: Skip articles with SYNCED status

        Returns:
            Summary of sync results
        """
        logger.info(f"Starting bulk sync of {len(articles)} articles")

        results = {
            "total": len(articles),
            "synced": 0,
            "improved": 0,
            "failed": 0,
            "skipped": 0,
            "details": [],
        }

        for article in articles:
            # Filter to published only
            if article.status != ArticleStatus.PUBLISHED:
                results["skipped"] += 1
                continue

            # Skip already synced if requested
            if skip_already_synced and article.sync_status == SyncStatus.SYNCED:
                results["skipped"] += 1
                continue

            # Sync article
            result = await self.prepare_and_sync(article)

            if result["synced"]:
                results["synced"] += 1
                if article.was_auto_improved:
                    results["improved"] += 1
            else:
                results["failed"] += 1

            results["details"].append({
                "slug": article.slug,
                "synced": result["synced"],
                "score": result.get("score"),
                "was_improved": article.was_auto_improved,
                "reason": result.get("reason"),
            })

        logger.info(
            f"Bulk sync complete: {results['synced']} synced, "
            f"{results['improved']} improved, {results['failed']} failed"
        )

        return results

    def get_featured_articles(
        self,
        articles: List[Article],
        count: int = 3
    ) -> List[Article]:
        """
        Get top articles by SEO score for featured section.

        Args:
            articles: List of all articles
            count: Number of featured articles to return

        Returns:
            Top articles by SEO score
        """
        # Filter to published with 70%+ score
        eligible = [
            a for a in articles
            if a.status == ArticleStatus.PUBLISHED
            and a.quality
            and a.quality.meets_threshold
        ]

        # Sort by overall score descending
        sorted_articles = sorted(
            eligible,
            key=lambda a: a.quality.overall_score if a.quality else 0,
            reverse=True
        )

        return sorted_articles[:count]

    async def evaluate_article(self, article: Article) -> Article:
        """
        Evaluate an article without syncing.
        Useful for preview or manual review.
        """
        article_dict = {
            "title": article.title,
            "excerpt": article.excerpt or "",
            "content": article.content,
            "keywords": article.seo.keywords if article.seo else [],
        }

        evaluation = await self.quality_agent.evaluate(article_dict)

        article.quality = QualityEvaluation(
            overall_score=evaluation.overall_score,
            meets_threshold=evaluation.meets_threshold,
            seo_score=evaluation.dimensions.get("seo", type("", (), {"score": 0})()).score if "seo" in evaluation.dimensions else 0,
            readability_score=evaluation.dimensions.get("readability", type("", (), {"score": 0})()).score if "readability" in evaluation.dimensions else 0,
            dfi_accuracy_score=evaluation.dimensions.get("dfi_accuracy", type("", (), {"score": 0})()).score if "dfi_accuracy" in evaluation.dimensions else 0,
            engagement_score=evaluation.dimensions.get("engagement", type("", (), {"score": 0})()).score if "engagement" in evaluation.dimensions else 0,
            technical_depth_score=evaluation.dimensions.get("technical_depth", type("", (), {"score": 0})()).score if "technical_depth" in evaluation.dimensions else 0,
            originality_score=evaluation.dimensions.get("originality", type("", (), {"score": 0})()).score if "originality" in evaluation.dimensions else 0,
            overall_assessment=evaluation.overall_assessment,
            priority_improvements=evaluation.priority_improvements,
            evaluated_at=datetime.utcnow(),
        )

        return article

    async def prepare_and_sync_with_grounding(
        self,
        article: Article,
        verify_facts: bool = True,
        skip_web_verification: bool = False,
    ) -> Dict[str, Any]:
        """
        Prepare and sync article with FULL grounding verification.

        This is the RECOMMENDED method for production use.
        It ensures both quality AND factual accuracy before publishing.

        Args:
            article: The Article to sync
            verify_facts: Whether to verify factual claims (default: True)
            skip_web_verification: Only use ALEPH for grounding (FREE but less comprehensive)

        Returns:
            Dict with sync result, updated article, evaluation, and grounding info
        """
        logger.info(f"Preparing article with grounding verification: {article.title}")

        # Convert article to dict for quality agent
        article_dict = {
            "title": article.title,
            "excerpt": article.excerpt or "",
            "content": article.content,
            "keywords": article.seo.keywords if article.seo else [],
        }

        # Run FULL verification pipeline (quality + grounding)
        result = await self.quality_agent.ensure_hq_with_grounding(
            article_dict,
            verify_facts=verify_facts,
            skip_web_verification=skip_web_verification,
        )

        # Update article with quality and grounding data
        evaluation = result["evaluation"]
        improvement_log = result.get("improvement_log")

        # Convert agent evaluation to model
        quality = QualityEvaluation(
            overall_score=evaluation.overall_score,
            meets_threshold=evaluation.meets_threshold,
            seo_score=evaluation.dimensions.get("seo", type("", (), {"score": 0})()).score if "seo" in evaluation.dimensions else 0,
            readability_score=evaluation.dimensions.get("readability", type("", (), {"score": 0})()).score if "readability" in evaluation.dimensions else 0,
            dfi_accuracy_score=evaluation.dimensions.get("dfi_accuracy", type("", (), {"score": 0})()).score if "dfi_accuracy" in evaluation.dimensions else 0,
            engagement_score=evaluation.dimensions.get("engagement", type("", (), {"score": 0})()).score if "engagement" in evaluation.dimensions else 0,
            technical_depth_score=evaluation.dimensions.get("technical_depth", type("", (), {"score": 0})()).score if "technical_depth" in evaluation.dimensions else 0,
            originality_score=evaluation.dimensions.get("originality", type("", (), {"score": 0})()).score if "originality" in evaluation.dimensions else 0,
            overall_assessment=evaluation.overall_assessment,
            priority_improvements=evaluation.priority_improvements,
            evaluated_at=datetime.utcnow(),
            # Add grounding scores
            grounding_score=evaluation.grounding_score,
            grounding_passes=evaluation.grounding_passes,
        )

        article.quality = quality

        # If article was improved, update content
        if result["was_improved"]:
            improved_article = result["article"]
            article.title = improved_article.get("title", article.title)
            article.content = improved_article.get("content", article.content)
            article.excerpt = improved_article.get("excerpt", article.excerpt)
            article.was_auto_improved = True

            if improvement_log:
                article.original_score = improvement_log.original_score
                article.improvement_log = ImprovementLog(
                    original_score=improvement_log.original_score,
                    improved_score=improvement_log.improved_score,
                    score_improvement=improvement_log.improved_score - improvement_log.original_score,
                    improvements=[
                        ImprovementEntry(**imp) for imp in improvement_log.improvements
                    ] if improvement_log.improvements else [],
                    improved_at=datetime.utcnow(),
                )

        article.updated_at = datetime.utcnow()

        # Check if approved for publishing
        if not result["publish_approved"]:
            article.sync_status = SyncStatus.NOT_ELIGIBLE
            article.sync_error = result["rejection_reason"]
            logger.warning(f"Article rejected: {result['rejection_reason']}")
            return {
                "synced": False,
                "article": article,
                "reason": result["rejection_reason"],
                "quality_score": quality.overall_score,
                "grounding": result.get("grounding", {}),
            }

        # Sync to website with grounding info in payload
        sync_result = await self._sync_to_website_with_grounding(article, result.get("grounding", {}))

        return {
            "synced": sync_result["success"],
            "article": article,
            "action": sync_result.get("action"),
            "reason": sync_result.get("reason"),
            "quality_score": quality.overall_score,
            "grounding": result.get("grounding", {}),
        }

    async def _sync_to_website_with_grounding(
        self,
        article: Article,
        grounding_info: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send article to website API with grounding verification data.
        """
        logger.info(f"Syncing to website with grounding data: {article.title}")

        # Build sync payload with grounding
        payload = {
            "slug": article.slug,
            "title": article.title,
            "content": article.content,
            "excerpt": article.excerpt or "",
            "category": article.categories[0] if article.categories else "general",
            "author": article.author_name or "JASPER Team",
            "hero_image_url": article.hero_image or "",
            "read_time_minutes": article.read_time_minutes or 5,
            "tags": article.tags,
            "published_at": article.published_at.isoformat() if article.published_at else datetime.utcnow().isoformat(),
            "source_id": article.id,
            "grading": {
                "overall_score": article.quality.overall_score if article.quality else 0,
                "seo_score": article.quality.seo_score if article.quality else 0,
                "readability_score": article.quality.readability_score if article.quality else 0,
                "dfi_accuracy_score": article.quality.dfi_accuracy_score if article.quality else 0,
                "engagement_score": article.quality.engagement_score if article.quality else 0,
                "technical_depth_score": article.quality.technical_depth_score if article.quality else 0,
                "originality_score": article.quality.originality_score if article.quality else 0,
                "was_auto_improved": article.was_auto_improved,
                "original_score": article.original_score,
                "improvements_made": [
                    imp.dimension for imp in article.improvement_log.improvements
                ] if article.improvement_log else [],
                # Grounding verification data
                "grounding_score": grounding_info.get("score", 0),
                "grounding_verified_claims": grounding_info.get("verified_claims", 0),
                "grounding_total_claims": grounding_info.get("total_claims", 0),
                "grounding_contradictions": grounding_info.get("contradicted", 0),
                "sources_cited_count": grounding_info.get("sources_cited", 0),
            },
        }

        try:
            response = await self.client.post(
                "/api/v1/blog/sync",
                json=payload
            )

            if response.status_code in [200, 201]:
                result = response.json()
                article.sync_status = SyncStatus.SYNCED
                article.synced_at = datetime.utcnow()
                article.sync_error = None
                logger.info(f"Sync successful with grounding: {article.slug}")
                return {
                    "success": True,
                    "action": result.get("action", "synced"),
                    "article_slug": article.slug,
                }
            else:
                error_msg = f"Sync failed: {response.status_code} - {response.text}"
                article.sync_status = SyncStatus.FAILED
                article.sync_error = error_msg
                logger.error(error_msg)
                return {
                    "success": False,
                    "reason": error_msg,
                    "article_slug": article.slug,
                }

        except httpx.RequestError as e:
            error_msg = f"Request error: {str(e)}"
            article.sync_status = SyncStatus.FAILED
            article.sync_error = error_msg
            logger.error(error_msg)
            return {
                "success": False,
                "reason": error_msg,
                "article_slug": article.slug,
            }

    async def verify_article_grounding(
        self,
        article: Article,
        skip_web: bool = False,
    ) -> Dict[str, Any]:
        """
        Verify factual claims in an article without syncing.
        Returns detailed grounding report.
        """
        grounding_agent = get_grounding_agent()

        result = await grounding_agent.verify_article(
            content=article.content,
            title=article.title,
            skip_web_verification=skip_web,
        )

        return {
            "grounding_score": result.grounding_score,
            "passes_threshold": result.passes_threshold,
            "total_claims": result.total_claims,
            "verified_claims": result.verified_claims,
            "unverified_claims": result.unverified_claims,
            "contradicted_claims": result.contradicted_claims,
            "flagged_for_review": [
                {"text": c.text, "status": c.status.value, "category": c.category}
                for c in result.flagged_for_review
            ],
            "sources_cited": result.sources_cited[:10],
        }

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_content_sync_service: Optional[ContentSyncService] = None


def get_content_sync_service() -> ContentSyncService:
    """Get or create the global ContentSyncService instance."""
    global _content_sync_service
    if _content_sync_service is None:
        _content_sync_service = ContentSyncService()
    return _content_sync_service
