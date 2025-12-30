"""
JASPER CRM - End-to-End Content Pipeline
Automated news scanning → content generation → blog publishing.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum
import os

logger = logging.getLogger(__name__)


class PipelineStage(str, Enum):
    SCANNING = "scanning"
    FILTERING = "filtering"
    GENERATING = "generating"
    REVIEWING = "reviewing"
    PUBLISHING = "publishing"
    COMPLETED = "completed"
    FAILED = "failed"


class ContentPipeline:
    """
    Orchestrates the full content creation pipeline:
    1. Scan news sources for relevant items
    2. Filter by relevance score
    3. Generate SEO content via AI
    4. Auto-publish or queue for review
    """

    def __init__(self):
        self.min_relevance_score = 50.0
        self.max_posts_per_run = 3
        self.auto_publish_threshold = 80.0  # High confidence = auto-publish
        self.pipeline_runs: List[Dict] = []

    async def run_full_pipeline(
        self,
        max_posts: int = None,
        auto_publish: bool = False,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Execute the full content pipeline.

        Args:
            max_posts: Max posts to generate (default: 3)
            auto_publish: Publish immediately or save as draft
            dry_run: Simulate without actually publishing
        """
        from services.job_monitor import job_monitor

        max_posts = max_posts or self.max_posts_per_run
        run_id = f"pipeline-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        job_monitor.start_job(run_id, "content_pipeline", {
            "max_posts": max_posts,
            "auto_publish": auto_publish,
            "dry_run": dry_run
        })

        result = {
            "run_id": run_id,
            "started_at": datetime.now().isoformat(),
            "stages": {},
            "posts_created": [],
            "errors": []
        }

        try:
            # Stage 1: Scan news sources
            result["stages"]["scanning"] = await self._stage_scan()
            if not result["stages"]["scanning"]["success"]:
                raise Exception("Scanning failed")

            news_items = result["stages"]["scanning"]["items"]
            logger.info(f"Pipeline {run_id}: Found {len(news_items)} news items")

            # Stage 2: Filter by relevance
            result["stages"]["filtering"] = await self._stage_filter(news_items)
            filtered_items = result["stages"]["filtering"]["items"]
            logger.info(f"Pipeline {run_id}: {len(filtered_items)} items passed filter")

            if not filtered_items:
                result["message"] = "No items passed relevance filter"
                job_monitor.complete_job(run_id, result)
                return result

            # Stage 3: Generate content for top items
            result["stages"]["generating"] = await self._stage_generate(
                filtered_items[:max_posts]
            )
            generated_content = result["stages"]["generating"]["content"]
            logger.info(f"Pipeline {run_id}: Generated {len(generated_content)} posts")

            # Stage 4: Publish or queue
            if not dry_run:
                result["stages"]["publishing"] = await self._stage_publish(
                    generated_content,
                    auto_publish=auto_publish
                )
                result["posts_created"] = result["stages"]["publishing"]["posts"]
            else:
                result["stages"]["publishing"] = {"dry_run": True, "would_publish": len(generated_content)}

            result["success"] = True
            result["completed_at"] = datetime.now().isoformat()

            job_monitor.complete_job(run_id, result)

        except Exception as e:
            logger.error(f"Pipeline {run_id} failed: {e}")
            result["success"] = False
            result["error"] = str(e)
            job_monitor.fail_job(run_id, str(e))

            # Send alert
            from services.alerting import alerting_service
            alerting_service.send_alert(
                level="error",
                title="Content Pipeline Failed",
                message=str(e),
                metadata={"run_id": run_id}
            )

        self.pipeline_runs.append(result)
        return result

    async def _stage_scan(self) -> Dict[str, Any]:
        """Stage 1: Scan all news sources."""
        try:
            from services.news_monitor import news_monitor

            items = await news_monitor.scan_all_sources()

            return {
                "success": True,
                "items": items,
                "count": len(items),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _stage_filter(self, items: List) -> Dict[str, Any]:
        """Stage 2: Filter items by relevance score."""
        try:
            filtered = [
                item for item in items
                if item.relevance_score >= self.min_relevance_score
            ]

            # Sort by relevance (highest first)
            filtered.sort(key=lambda x: x.relevance_score, reverse=True)

            return {
                "success": True,
                "items": filtered,
                "original_count": len(items),
                "filtered_count": len(filtered),
                "min_score_applied": self.min_relevance_score
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _stage_generate(self, items: List) -> Dict[str, Any]:
        """Stage 3: Generate SEO content for items."""
        try:
            from services.news_monitor import news_monitor

            generated = []
            errors = []

            for item in items:
                try:
                    content = await news_monitor.generate_content_for_news(item)
                    if content:
                        generated.append({
                            "news_item": {
                                "id": item.id,
                                "title": item.title,
                                "source": item.source,
                                "relevance_score": item.relevance_score
                            },
                            "content": content
                        })
                except Exception as e:
                    errors.append({"item_id": item.id, "error": str(e)})

            return {
                "success": True,
                "content": generated,
                "generated_count": len(generated),
                "errors": errors
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _stage_publish(
        self,
        content_list: List[Dict],
        auto_publish: bool = False
    ) -> Dict[str, Any]:
        """Stage 4: Publish content to blog."""
        try:
            import httpx

            blog_api_key = os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key")
            blog_url = "http://localhost:8000/api/blog/auto-post"

            published = []
            errors = []

            async with httpx.AsyncClient() as client:
                for item in content_list:
                    content = item["content"]
                    news = item["news_item"]

                    # Determine if auto-publish based on relevance
                    should_publish = auto_publish or news["relevance_score"] >= self.auto_publish_threshold

                    payload = {
                        "title": content.get("title", news["title"]),
                        "content": content.get("content", ""),
                        "excerpt": content.get("excerpt", ""),
                        "category": content.get("category", "DFI Insights"),
                        "tags": content.get("tags", []),
                        "seoTitle": content.get("seo_title"),
                        "seoDescription": content.get("seo_description"),
                        "publishImmediately": should_publish
                    }

                    try:
                        response = await client.post(
                            blog_url,
                            json=payload,
                            headers={"X-AI-API-Key": blog_api_key},
                            timeout=30
                        )
                        response.raise_for_status()
                        result = response.json()

                        published.append({
                            "news_id": news["id"],
                            "slug": result.get("post", {}).get("slug"),
                            "status": "published" if should_publish else "draft",
                            "relevance_score": news["relevance_score"]
                        })
                    except Exception as e:
                        errors.append({"news_id": news["id"], "error": str(e)})

            return {
                "success": True,
                "posts": published,
                "published_count": len([p for p in published if p["status"] == "published"]),
                "draft_count": len([p for p in published if p["status"] == "draft"]),
                "errors": errors
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_recent_runs(self, limit: int = 10) -> List[Dict]:
        """Get recent pipeline runs."""
        return self.pipeline_runs[-limit:][::-1]

    async def schedule_pipeline(
        self,
        interval_hours: int = 6,
        max_runs: int = 4
    ):
        """
        Schedule recurring pipeline runs.
        Call this from app startup for automated content.
        """
        runs_completed = 0

        while runs_completed < max_runs:
            try:
                logger.info(f"Scheduled pipeline run {runs_completed + 1}/{max_runs}")
                await self.run_full_pipeline(auto_publish=False)
                runs_completed += 1
            except Exception as e:
                logger.error(f"Scheduled pipeline error: {e}")

            if runs_completed < max_runs:
                await asyncio.sleep(interval_hours * 3600)


# Singleton instance
content_pipeline = ContentPipeline()
