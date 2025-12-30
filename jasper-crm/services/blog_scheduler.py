"""
JASPER Blog Scheduler Service
Auto-publishes scheduled posts when their scheduled time arrives.
Uses APScheduler for background task management.
"""

import asyncio
from datetime import datetime
from typing import Optional
import threading

from services.logging_service import get_logger

logger = get_logger(__name__)


class BlogSchedulerService:
    """
    Background service that checks for scheduled blog posts
    and publishes them when their scheduled time arrives.
    """

    def __init__(self):
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._check_interval = 60  # Check every 60 seconds

    def _get_scheduled_posts(self):
        """Get all posts with status='scheduled' that are due for publishing."""
        from services.blog_service import blog_service

        posts = blog_service.get_all_posts(status="scheduled")
        now = datetime.utcnow()

        due_posts = []
        for post in posts:
            scheduled_for = post.get("scheduledFor")
            if scheduled_for:
                try:
                    # Parse ISO format datetime
                    if isinstance(scheduled_for, str):
                        # Handle both formats
                        if "Z" in scheduled_for:
                            scheduled_time = datetime.fromisoformat(scheduled_for.replace("Z", "+00:00"))
                        else:
                            scheduled_time = datetime.fromisoformat(scheduled_for)

                        # Convert to naive datetime for comparison
                        if scheduled_time.tzinfo:
                            scheduled_time = scheduled_time.replace(tzinfo=None)

                        if scheduled_time <= now:
                            due_posts.append(post)
                            logger.info(f"Post due for publishing: {post['slug']} (scheduled: {scheduled_for})")
                except Exception as e:
                    logger.error(f"Error parsing scheduled time for {post.get('slug')}: {e}")

        return due_posts

    async def _publish_scheduled_post(self, post: dict):
        """Publish a single scheduled post."""
        from services.blog_service import blog_service

        slug = post.get("slug")
        title = post.get("title")

        try:
            # Check if auto-share was requested (stored in post metadata)
            auto_share = post.get("autoShareOnPublish", False)

            result = await blog_service.publish_post(
                slug=slug,
                auto_share=auto_share,
                user_id="scheduler"
            )

            if result:
                logger.info(f"Scheduled post published: {title} ({slug})")
                return True
            else:
                logger.error(f"Failed to publish scheduled post: {slug}")
                return False

        except Exception as e:
            logger.error(f"Error publishing scheduled post {slug}: {e}")
            return False

    async def _check_and_publish(self):
        """Check for due posts and publish them."""
        due_posts = self._get_scheduled_posts()

        if due_posts:
            logger.info(f"Found {len(due_posts)} scheduled posts due for publishing")

            for post in due_posts:
                await self._publish_scheduled_post(post)
        else:
            logger.debug("No scheduled posts due for publishing")

    def _run_loop(self):
        """Background thread loop."""
        logger.info("Blog scheduler started")

        while self._running:
            try:
                # Create new event loop for this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                # Run the check
                loop.run_until_complete(self._check_and_publish())
                loop.close()

            except Exception as e:
                logger.error(f"Blog scheduler error: {e}")

            # Sleep until next check
            import time
            time.sleep(self._check_interval)

        logger.info("Blog scheduler stopped")

    def start_background_scheduler(self, interval_seconds: int = 60):
        """Start the background scheduler thread."""
        if self._running:
            logger.warning("Blog scheduler already running")
            return

        self._check_interval = interval_seconds
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"Blog scheduler started (interval: {interval_seconds}s)")

    def stop_scheduler(self):
        """Stop the background scheduler."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info("Blog scheduler stopped")

    def get_status(self) -> dict:
        """Get scheduler status."""
        return {
            "running": self._running,
            "check_interval_seconds": self._check_interval,
            "next_check_in": self._check_interval if self._running else None
        }


# Singleton instance
blog_scheduler = BlogSchedulerService()
