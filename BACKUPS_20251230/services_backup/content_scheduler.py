"""
JASPER CRM - Content Scheduler Service

APScheduler-based service for automated daily article generation.
Per Pure Python Architecture policy - no n8n/Zapier/Make.com.

Features:
- Daily scheduled article generation (configurable count)
- Background task execution
- Quality gate enforcement (70% SEO minimum)
- Automatic internal/external linking
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)


class ContentScheduler:
    """
    Scheduler for automated content generation.

    Uses APScheduler for cron-like scheduling.
    Generates articles at configured times with quality validation.
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.config: Dict[str, Any] = {
            "enabled": False,
            "daily_count": 20,
            "include_images": True,
            "image_model": "nano-banana-pro",
            "schedule_time": "06:00",  # SAST
            "min_seo_score": 70,
            "last_run": None,
            "next_run": None,
            "articles_generated_today": 0,
            "total_articles_generated": 0,
            "generation_history": []
        }
        self._job_id = "daily_content_generation"
        self._is_running = False

    def start(self):
        """Start the scheduler."""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("ContentScheduler started")

    def stop(self):
        """Stop the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("ContentScheduler stopped")

    def enable_daily_generation(
        self,
        count: int = 20,
        include_images: bool = True,
        image_model: str = "nano-banana-pro",
        time: str = "06:00",
        min_seo_score: int = 70
    ):
        """
        Enable daily scheduled generation.

        Args:
            count: Number of articles to generate daily
            include_images: Whether to generate AI images
            image_model: Image model (nano-banana or nano-banana-pro)
            time: Time to run (HH:MM format, SAST)
            min_seo_score: Minimum SEO score threshold
        """
        # Update config
        self.config.update({
            "enabled": True,
            "daily_count": count,
            "include_images": include_images,
            "image_model": image_model,
            "schedule_time": time,
            "min_seo_score": min_seo_score
        })

        # Parse time
        hour, minute = map(int, time.split(":"))

        # Remove existing job if any
        try:
            self.scheduler.remove_job(self._job_id)
        except:
            pass

        # Add new job
        self.scheduler.add_job(
            self._run_daily_generation,
            CronTrigger(hour=hour, minute=minute),
            id=self._job_id,
            name="Daily Content Generation",
            replace_existing=True
        )

        # Calculate next run
        now = datetime.now()
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        self.config["next_run"] = next_run.isoformat()

        logger.info(f"Daily generation enabled: {count} articles at {time}, next run: {next_run}")

    def disable_daily_generation(self):
        """Disable daily scheduled generation."""
        self.config["enabled"] = False
        self.config["next_run"] = None

        try:
            self.scheduler.remove_job(self._job_id)
        except:
            pass

        logger.info("Daily generation disabled")

    async def _run_daily_generation(self):
        """
        Execute daily generation job.

        Generates configured number of articles with quality validation.
        """
        if self._is_running:
            logger.warning("Daily generation already running, skipping")
            return

        self._is_running = True
        start_time = datetime.utcnow()
        results = []

        logger.info(f"Starting daily generation: {self.config['daily_count']} articles")

        try:
            from services.blog_service import blog_service
            from routes.content import select_trending_topic, inject_seo_links

            count = self.config["daily_count"]
            successful = 0
            failed = 0

            for i in range(count):
                try:
                    # Select topic
                    topic_data = await select_trending_topic()

                    logger.info(f"Generating article {i+1}/{count}: {topic_data['topic']}")

                    # Generate article
                    result = await blog_service.generate_post(
                        topic=topic_data["topic"],
                        category=topic_data["category"],
                        keywords=topic_data.get("keywords", []),
                        tone="professional",
                        user_id="scheduled-generation",
                        min_seo_score=self.config["min_seo_score"],
                        use_ai_images=self.config["include_images"]
                    )

                    if result.get("success"):
                        # Inject SEO links
                        post = result.get("post", {})
                        if post.get("content"):
                            existing = blog_service.get_all_posts(status="published", limit=10)
                            post["content"] = inject_seo_links(
                                post["content"],
                                existing_articles=existing.get("posts", [])
                            )
                            blog_service.update_post(
                                post["slug"],
                                {"content": post["content"]},
                                user_id="scheduled-generation"
                            )

                        successful += 1
                        results.append({
                            "success": True,
                            "topic": topic_data["topic"],
                            "slug": post.get("slug"),
                            "seo_score": result.get("seo_score")
                        })
                        logger.info(f"Article {i+1} generated: {post.get('slug')}")
                    else:
                        failed += 1
                        results.append({
                            "success": False,
                            "topic": topic_data["topic"],
                            "error": result.get("error")
                        })
                        logger.warning(f"Article {i+1} failed: {result.get('error')}")

                    # Delay between articles to avoid rate limits
                    if i < count - 1:
                        await asyncio.sleep(30)  # 30 second delay

                except Exception as e:
                    failed += 1
                    results.append({
                        "success": False,
                        "error": str(e)
                    })
                    logger.error(f"Article {i+1} exception: {e}")

            # Update stats
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            self.config["last_run"] = end_time.isoformat()
            self.config["articles_generated_today"] = successful
            self.config["total_articles_generated"] += successful

            # Calculate next run
            hour, minute = map(int, self.config["schedule_time"].split(":"))
            next_run = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
            next_run += timedelta(days=1)
            self.config["next_run"] = next_run.isoformat()

            # Add to history
            self.config["generation_history"].append({
                "date": end_time.isoformat(),
                "successful": successful,
                "failed": failed,
                "duration_seconds": duration
            })

            # Keep only last 30 days of history
            self.config["generation_history"] = self.config["generation_history"][-30:]

            logger.info(
                f"Daily generation complete: {successful} successful, {failed} failed, "
                f"duration: {duration:.1f}s"
            )

        except Exception as e:
            logger.error(f"Daily generation failed: {e}")
            import traceback
            traceback.print_exc()

        finally:
            self._is_running = False

    async def run_now(self, count: int = 1) -> Dict[str, Any]:
        """
        Manually trigger generation.

        Args:
            count: Number of articles to generate

        Returns:
            Results dict with success/failure counts
        """
        if self._is_running:
            return {
                "success": False,
                "error": "Generation already in progress"
            }

        # Temporarily set count and run
        original_count = self.config["daily_count"]
        self.config["daily_count"] = count

        await self._run_daily_generation()

        self.config["daily_count"] = original_count

        return {
            "success": True,
            "generated": self.config["articles_generated_today"]
        }

    def get_next_run_time(self) -> Optional[str]:
        """Get the next scheduled run time."""
        return self.config.get("next_run")

    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics."""
        return {
            "enabled": self.config["enabled"],
            "daily_count": self.config["daily_count"],
            "schedule_time": self.config["schedule_time"],
            "last_run": self.config["last_run"],
            "next_run": self.config["next_run"],
            "articles_generated_today": self.config["articles_generated_today"],
            "total_articles_generated": self.config["total_articles_generated"],
            "is_running": self._is_running,
            "recent_history": self.config["generation_history"][-7:]
        }


# Global instance
content_scheduler = ContentScheduler()


def start_scheduler():
    """Start the content scheduler."""
    content_scheduler.start()


def stop_scheduler():
    """Stop the content scheduler."""
    content_scheduler.stop()
