"""
JASPER CRM - Blog Service
Business logic for blog management with activity logging.

Features:
- CRUD operations on blog posts (JSON storage)
- Activity logging via existing ActivityLogTable
- SEO score calculation on save
- Social sharing status tracking
- Star rating system
- Integration with content_service for AI generation
- Integration with image_service for stock photos
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
import uuid
import re
import httpx

from db.database import SessionLocal
from db.tables import ActivityLogTable
from services.seo_scorer import seo_scorer, SEOResult
from services.content_service import content_service
from services.image_service import image_service, ensure_jpeg_url
from services.ai_image_service import generate_article_images, get_fallback_image
from services.image_library_service import image_library

logger = logging.getLogger(__name__)


def _optimize_image_url(url: str) -> str:
    """Ensure hero image URL is optimized (JPEG, 1600px max width)."""
    if not url or url == "/images/blog/default.jpg":
        return url
    return ensure_jpeg_url(url, quality=80, max_width=1600)

# Blog posts JSON file location
BLOG_DATA_PATH = Path(__file__).parent.parent / "data" / "blog_posts.json"

# Blog revisions JSON file location (version history)
REVISION_DATA_PATH = Path(__file__).parent.parent / "data" / "blog_revisions.json"
MAX_REVISIONS_PER_POST = 50  # Keep last 50 revisions per post


class BlogService:
    """
    Blog management service with full transparency logging.

    All actions are logged to ActivityLogTable with entity_type="blog".
    """

    def __init__(self):
        self.data_path = BLOG_DATA_PATH
        self._ensure_data_file()

        # Social service URL (jasper-social on port 8002)
        self.social_api_url = os.getenv("SOCIAL_API_URL", "http://localhost:8002")

        # Notification webhooks (from Doppler/env)
        self.discord_webhook = os.getenv("DISCORD_WEBHOOK_URL")
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")

    def _ensure_data_file(self):
        """Ensure blog_posts.json exists."""
        if not self.data_path.exists():
            self.data_path.parent.mkdir(parents=True, exist_ok=True)
            self._save_posts([])

    def _load_posts(self) -> List[Dict[str, Any]]:
        """Load all posts from JSON file."""
        try:
            with open(self.data_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load blog posts: {e}")
            return []

    def _save_posts(self, posts: List[Dict[str, Any]]):
        """Save posts to JSON file."""
        try:
            with open(self.data_path, "w") as f:
                json.dump(posts, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save blog posts: {e}")
            raise

    # =========================================================================
    # REVISION MANAGEMENT (Version History)
    # =========================================================================

    def _load_revisions(self) -> Dict[str, Any]:
        """Load all revisions from JSON file."""
        try:
            if REVISION_DATA_PATH.exists():
                with open(REVISION_DATA_PATH, "r") as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Failed to load revisions: {e}")
            return {}

    def _save_revisions(self, revisions: Dict[str, Any]):
        """Save revisions to JSON file."""
        try:
            with open(REVISION_DATA_PATH, "w") as f:
                json.dump(revisions, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save revisions: {e}")
            raise

    def _create_snapshot(self, post: Dict[str, Any]) -> Dict[str, Any]:
        """Create a snapshot of versioned fields only."""
        return {
            "title": post.get("title"),
            "content": post.get("content"),
            "content_blocks": post.get("content_blocks"),
            "excerpt": post.get("excerpt"),
            "category": post.get("category"),
            "tags": post.get("tags"),
            "status": post.get("status"),
            "heroImage": post.get("heroImage"),
            "heroImageId": post.get("heroImageId"),
            "seo": post.get("seo"),
        }

    def save_revision(
        self,
        slug: str,
        post: Dict[str, Any],
        action: str,
        user_id: str = "system",
        summary: str = None
    ) -> Dict[str, Any]:
        """
        Save a new revision snapshot.

        Called before changes are applied to preserve current state.

        Args:
            slug: Post slug
            post: Current post data (before changes)
            action: Action type (created, updated, pre_restore, restored)
            user_id: User performing the action
            summary: Optional description of changes

        Returns:
            The created revision record
        """
        revisions = self._load_revisions()

        if slug not in revisions:
            revisions[slug] = {"current_revision": 0, "revisions": []}

        post_revisions = revisions[slug]
        next_rev = post_revisions["current_revision"] + 1

        new_revision = {
            "rev": next_rev,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "user_id": user_id,
            "action": action,
            "snapshot": self._create_snapshot(post),
            "summary": summary or f"{action.capitalize()} by {user_id}"
        }

        post_revisions["revisions"].append(new_revision)
        post_revisions["current_revision"] = next_rev

        # Prune old revisions (keep last MAX_REVISIONS_PER_POST)
        if len(post_revisions["revisions"]) > MAX_REVISIONS_PER_POST:
            post_revisions["revisions"] = post_revisions["revisions"][-MAX_REVISIONS_PER_POST:]

        revisions[slug] = post_revisions
        self._save_revisions(revisions)

        logger.info(f"Saved revision {next_rev} for post: {slug} (action: {action})")
        return new_revision

    def get_revision_history(self, slug: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get revision history for a post (newest first).

        Returns metadata only (not full snapshots) for performance.
        """
        revisions = self._load_revisions()
        post_revs = revisions.get(slug, {}).get("revisions", [])

        # Return metadata only (not full snapshots)
        history = []
        for rev in reversed(post_revs[-limit:]):
            history.append({
                "rev": rev["rev"],
                "timestamp": rev["timestamp"],
                "user_id": rev["user_id"],
                "action": rev["action"],
                "summary": rev.get("summary", ""),
                "title": rev["snapshot"].get("title", "Untitled")
            })

        return history

    def get_revision(self, slug: str, rev_number: int) -> Optional[Dict[str, Any]]:
        """Get a specific revision with full snapshot."""
        revisions = self._load_revisions()
        post_revs = revisions.get(slug, {}).get("revisions", [])

        for rev in post_revs:
            if rev["rev"] == rev_number:
                return rev

        return None

    def restore_revision(
        self,
        slug: str,
        rev_number: int,
        user_id: str = "system"
    ) -> Optional[Dict[str, Any]]:
        """
        Restore a post to a previous revision.

        Creates two new revisions:
        1. Pre-restore snapshot (current state before restore)
        2. Restored snapshot (state after restore)

        This ensures complete audit trail.
        """
        revision = self.get_revision(slug, rev_number)
        if not revision:
            logger.warning(f"Revision {rev_number} not found for post: {slug}")
            return None

        # Get current post
        post = self.get_post_by_slug(slug)
        if not post:
            logger.warning(f"Post not found for restore: {slug}")
            return None

        # Save current state as new revision before restoring
        self.save_revision(
            slug,
            post,
            "pre_restore",
            user_id,
            f"State before restoring to revision {rev_number}"
        )

        # Apply snapshot to current post (without triggering another revision save)
        snapshot = revision["snapshot"]
        updates = {k: v for k, v in snapshot.items() if v is not None}

        # Direct update without calling update_post to avoid double revision
        posts = self._load_posts()
        for i, p in enumerate(posts):
            if p.get("slug") == slug:
                for key, value in updates.items():
                    p[key] = value
                p["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                posts[i] = p
                self._save_posts(posts)

                # Save restored state as new revision
                self.save_revision(
                    slug,
                    p,
                    "restored",
                    user_id,
                    f"Restored to revision {rev_number}"
                )

                # Log activity
                self._log_activity(
                    entity_id=slug,
                    action="restored",
                    details={"from_revision": rev_number},
                    user_id=user_id
                )

                logger.info(f"Post {slug} restored to revision {rev_number}")
                return p

        return None

    def _generate_slug(self, title: str) -> str:
        """Generate URL-friendly slug from title."""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        return slug.strip('-')

    def _log_activity(
        self,
        entity_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        user_id: str = "system"
    ):
        """Log activity using existing ActivityLogTable."""
        try:
            db = SessionLocal()
            activity = ActivityLogTable(
                entity_type="blog",
                entity_id=entity_id,
                action=action,
                details=json.dumps(details) if details else None,
                user_id=user_id
            )
            db.add(activity)
            db.commit()
            db.close()
            logger.info(f"Activity logged: blog/{entity_id} - {action}")
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")

    async def _notify_slack_discord(
        self,
        event: str,
        title: str,
        url: Optional[str] = None,
        **kwargs
    ):
        """Send transparency notifications to Slack and Discord."""
        messages = {
            "blog_created": f"📝 **New Draft Created**\n{title}",
            "blog_published": f"🚀 **Blog Published**\n{title}\n{url or ''}",
            "blog_shared_twitter": f"🐦 **Tweeted**\n{title}\n{kwargs.get('tweet_url', '')}",
            "blog_shared_linkedin": f"💼 **LinkedIn Post**\n{title}",
            "blog_seo_optimized": f"📊 **SEO Optimized**\n{title}\nScore: {kwargs.get('old_score', '?')} → {kwargs.get('new_score', '?')}",
            "blog_scheduled": f"📅 **Scheduled**\n{title}\nFor: {kwargs.get('scheduled_for', '?')}",
        }

        message = messages.get(event, f"📌 Blog: {event} - {title}")

        async with httpx.AsyncClient() as client:
            # Send to Discord
            if self.discord_webhook:
                try:
                    await client.post(self.discord_webhook, json={"content": message})
                except Exception as e:
                    logger.error(f"Discord notification failed: {e}")

            # Send to Slack
            if self.slack_webhook:
                try:
                    await client.post(self.slack_webhook, json={"text": message})
                except Exception as e:
                    logger.error(f"Slack notification failed: {e}")

    # =========================================================================
    # CRUD OPERATIONS
    # =========================================================================

    def get_all_posts(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all posts with optional filtering."""
        posts = self._load_posts()

        if status:
            posts = [p for p in posts if p.get("status") == status]
        if category:
            posts = [p for p in posts if p.get("category") == category]

        # Sort by publishedAt or createdAt (newest first)
        posts.sort(
            key=lambda p: p.get("publishedAt") or p.get("createdAt") or "",
            reverse=True
        )

        return posts[offset:offset + limit]

    def search_posts(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search published posts by title, excerpt, and content.
        Returns simplified results for public search API.
        """
        if not query or len(query.strip()) < 2:
            return []

        query_lower = query.lower().strip()
        posts = self._load_posts()

        # Only search published posts
        published = [p for p in posts if p.get("status") == "published"]

        results = []
        for post in published:
            title = (post.get("title") or "").lower()
            excerpt = (post.get("excerpt") or "").lower()
            content = (post.get("content") or "").lower()
            tags = " ".join(post.get("tags") or []).lower()

            # Score based on where match is found
            score = 0
            if query_lower in title:
                score += 10
            if query_lower in excerpt:
                score += 5
            if query_lower in tags:
                score += 3
            if query_lower in content:
                score += 1

            if score > 0:
                results.append({
                    "slug": post.get("slug"),
                    "title": post.get("title"),
                    "excerpt": post.get("excerpt", "")[:200],
                    "category": post.get("category"),
                    "hero_image": post.get("heroImage"),
                    "published_at": post.get("publishedAt"),
                    "_score": score
                })

        # Sort by score (highest first)
        results.sort(key=lambda x: x["_score"], reverse=True)

        # Remove score and limit results
        for r in results:
            del r["_score"]

        return results[:limit]

    def get_post_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get a single post by slug."""
        posts = self._load_posts()
        for post in posts:
            if post.get("slug") == slug:
                return post
        return None

    # Alias for compatibility
    def get_post(self, slug: str) -> Optional[Dict[str, Any]]:
        """Alias for get_post_by_slug for API compatibility."""
        return self.get_post_by_slug(slug)

    def create_post(
        self,
        title: str,
        content: str = "",
        excerpt: str = "",
        category: str = "DFI Insights",
        tags: List[str] = None,
        status: str = "draft",
        author: str = "JASPER Research Team",
        hero_image: str = None,
        seo: Dict[str, Any] = None,
        user_id: str = "system",
        source: str = "manual"
    ) -> Dict[str, Any]:
        """Create a new blog post (draft by default)."""
        posts = self._load_posts()

        # Ensure content is never None
        content = content or ""
        excerpt = excerpt or ""

        slug = self._generate_slug(title)

        # Ensure unique slug
        existing_slugs = [p.get("slug") for p in posts]
        if slug in existing_slugs:
            counter = 2
            while f"{slug}-{counter}" in existing_slugs:
                counter += 1
            slug = f"{slug}-{counter}"

        now = datetime.utcnow().isoformat() + "Z"

        # Calculate SEO score
        post_data = {
            "title": title,
            "content": content,
            "excerpt": excerpt,
            "slug": slug,
            "seo": seo or {}
        }
        seo_result = seo_scorer.calculate_score(post_data)

        # Calculate read time safely
        word_count = len(content.split()) if content else 0
        read_time = max(1, word_count // 200)

        # Generate excerpt if not provided
        auto_excerpt = excerpt if excerpt else (content[:200] + "..." if len(content) > 200 else content)

        # Get SEO values safely
        seo_title = title[:60] if len(title) <= 60 else title[:57] + "..."
        seo_desc = auto_excerpt[:160] if len(auto_excerpt) <= 160 else auto_excerpt[:157] + "..."
        if seo:
            seo_title = seo.get("title") or seo_title
            seo_desc = seo.get("description") or seo_desc

        new_post = {
            "slug": slug,
            "title": title,
            "content": content,
            "excerpt": auto_excerpt,
            "category": category,
            "tags": tags or [],
            "status": status,
            "author": author,
            "readTime": read_time,
            "featured": False,
            "heroImage": _optimize_image_url(hero_image) if hero_image else "/images/blog/default.jpg",
            "publishedAt": None,
            "createdAt": now,
            "updatedAt": now,
            "scheduledFor": None,
            "seo": {
                "title": seo_title,
                "description": seo_desc,
                "score": seo_result.score,
                "keywords": seo.get("keywords", tags) if seo else tags or []
            },
            "social": {
                "twitterShared": False,
                "twitterPostId": None,
                "twitterSharedAt": None,
                "linkedinShared": False,
                "linkedinPostId": None,
                "linkedinSharedAt": None
            },
            "rating": {
                "average": 0,
                "count": 0,
                "distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            },
            "aiGenerated": source == "ai"
        }

        posts.append(new_post)
        self._save_posts(posts)

        # Save initial revision (for version history)
        self.save_revision(
            slug,
            new_post,
            "created",
            user_id,
            "Initial creation"
        )

        # Log activity
        self._log_activity(
            entity_id=slug,
            action="created",
            details={"title": title, "source": source, "category": category},
            user_id=user_id
        )

        return new_post

    def update_post(
        self,
        slug: str,
        updates: Dict[str, Any],
        user_id: str = "system"
    ) -> Optional[Dict[str, Any]]:
        """Update an existing post."""
        # DEBUG: Log incoming updates
        logger.info(f"[DEBUG] update_post called for slug: {slug}")
        logger.info(f"[DEBUG] Updates keys received: {list(updates.keys())}")
        if "content_blocks" in updates:
            blocks = updates.get("content_blocks", [])
            logger.info(f"[DEBUG] content_blocks count: {len(blocks) if blocks else 0}")
            if blocks:
                logger.info(f"[DEBUG] content_blocks types: {[b.get('type') for b in blocks[:5]]}")
        else:
            logger.warning(f"[DEBUG] content_blocks NOT in updates for {slug}")

        posts = self._load_posts()

        for i, post in enumerate(posts):
            if post.get("slug") == slug:
                # Save revision BEFORE applying changes (for version history)
                self.save_revision(
                    slug,
                    post,
                    "updated",
                    user_id,
                    f"Content updated"
                )

                # Track what changed
                changes = {}
                for key, value in updates.items():
                    if key in post and post[key] != value:
                        changes[key] = {"old": post[key], "new": value}

                # Apply updates
                for key, value in updates.items():
                    if key != "slug":  # Don't allow slug changes
                        post[key] = value

                post["updatedAt"] = datetime.utcnow().isoformat() + "Z"

                # Recalculate readTime from content word count
                content = post.get("content", "")
                if content:
                    word_count = len(content.split())
                    post["readTime"] = max(1, word_count // 200)
                    logger.info(f"[update_post] Recalculated readTime: {word_count} words → {post['readTime']} min")

                # Recalculate SEO score
                seo_result = seo_scorer.calculate_score(post)
                if "seo" not in post:
                    post["seo"] = {}
                post["seo"]["score"] = seo_result.score
                post["seoScore"] = seo_result.score  # Also update top-level field

                posts[i] = post
                self._save_posts(posts)

                # Log activity
                self._log_activity(
                    entity_id=slug,
                    action="updated",
                    details={"changes": changes},
                    user_id=user_id
                )

                return post

        return None

    def delete_post(self, slug: str, user_id: str = "system") -> bool:
        """Soft delete (archive) a post."""
        posts = self._load_posts()

        for post in posts:
            if post.get("slug") == slug:
                post["status"] = "archived"
                post["archivedAt"] = datetime.utcnow().isoformat() + "Z"
                self._save_posts(posts)

                self._log_activity(
                    entity_id=slug,
                    action="archived",
                    details={"title": post.get("title")},
                    user_id=user_id
                )
                return True

        return False

    def purge_post(self, slug: str) -> bool:
        """Permanently delete a post - cannot be recovered."""
        posts = self._load_posts()
        original_count = len(posts)

        posts = [p for p in posts if p.get("slug") != slug]

        if len(posts) < original_count:
            self._save_posts(posts)
            logger.info(f"Permanently deleted post: {slug}")
            return True
        return False

    def purge_archived_posts(self) -> dict:
        """Permanently delete all archived posts."""
        posts = self._load_posts()
        original_count = len(posts)

        archived_slugs = [p.get("slug") for p in posts if p.get("status") == "archived"]
        posts = [p for p in posts if p.get("status") != "archived"]
        purged_count = original_count - len(posts)

        if purged_count > 0:
            self._save_posts(posts)
            logger.info(f"Purged {purged_count} archived posts: {archived_slugs}")

        return {"count": purged_count, "slugs": archived_slugs}


    # =========================================================================
    # PUBLISHING
    # =========================================================================

    async def publish_post(
        self,
        slug: str,
        auto_share: bool = False,
        user_id: str = "system"
    ) -> Optional[Dict[str, Any]]:
        """Publish a post immediately."""
        posts = self._load_posts()

        for i, post in enumerate(posts):
            if post.get("slug") == slug:
                now = datetime.utcnow().isoformat() + "Z"
                post["status"] = "published"
                post["publishedAt"] = now
                post["updatedAt"] = now
                post["scheduledFor"] = None
                post["sync_status"] = "synced"  # Track that it's live on the website

                posts[i] = post
                self._save_posts(posts)

                # Log activity
                self._log_activity(
                    entity_id=slug,
                    action="published",
                    details={"auto_share": auto_share},
                    user_id=user_id
                )

                # Notify Slack/Discord
                url = f"https://jasperfinance.org/insights/{slug}"
                await self._notify_slack_discord("blog_published", post["title"], url)

                # Auto-share to social if enabled
                if auto_share:
                    await self.share_to_twitter(slug, user_id)
                    await self.share_to_linkedin(slug, user_id)

                return post

        return None

    def unpublish_post(self, slug: str, user_id: str = "system") -> Optional[Dict[str, Any]]:
        """Revert post to draft status."""
        posts = self._load_posts()

        for i, post in enumerate(posts):
            if post.get("slug") == slug:
                post["status"] = "draft"
                post["publishedAt"] = None
                post["updatedAt"] = datetime.utcnow().isoformat() + "Z"

                posts[i] = post
                self._save_posts(posts)

                self._log_activity(
                    entity_id=slug,
                    action="unpublished",
                    details={"title": post.get("title")},
                    user_id=user_id
                )

                return post

        return None

    def schedule_post(
        self,
        slug: str,
        scheduled_for: str,
        auto_share_twitter: bool = False,
        auto_share_linkedin: bool = False,
        user_id: str = "system"
    ) -> Optional[Dict[str, Any]]:
        """Schedule a post for future publication."""
        posts = self._load_posts()

        for i, post in enumerate(posts):
            if post.get("slug") == slug:
                post["status"] = "scheduled"
                post["scheduledFor"] = scheduled_for
                post["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                # Store auto-share preferences for scheduler
                post["autoShareOnPublish"] = auto_share_twitter or auto_share_linkedin
                post["autoShareTwitter"] = auto_share_twitter
                post["autoShareLinkedin"] = auto_share_linkedin

                posts[i] = post
                self._save_posts(posts)

                self._log_activity(
                    entity_id=slug,
                    action="scheduled",
                    details={
                        "scheduled_for": scheduled_for,
                        "auto_share_twitter": auto_share_twitter,
                        "auto_share_linkedin": auto_share_linkedin
                    },
                    user_id=user_id
                )

                return post

        return None

    # =========================================================================
    # SOCIAL SHARING
    # =========================================================================

    async def share_to_twitter(self, slug: str, user_id: str = "system") -> Dict[str, Any]:
        """Share post to Twitter via jasper-social."""
        post = self.get_post_by_slug(slug)
        if not post:
            return {"success": False, "error": "Post not found"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.social_api_url}/blog/share/twitter/{slug}",
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    tweet_id = data.get("tweet_id")

                    # Update post with Twitter status
                    posts = self._load_posts()
                    for p in posts:
                        if p.get("slug") == slug:
                            if "social" not in p:
                                p["social"] = {}
                            p["social"]["twitterShared"] = True
                            p["social"]["twitterPostId"] = tweet_id
                            p["social"]["twitterSharedAt"] = datetime.utcnow().isoformat() + "Z"
                            break
                    self._save_posts(posts)

                    # Log activity
                    self._log_activity(
                        entity_id=slug,
                        action="shared_twitter",
                        details={"tweet_id": tweet_id},
                        user_id=user_id
                    )

                    # Notify team
                    tweet_url = f"https://twitter.com/i/web/status/{tweet_id}" if tweet_id else None
                    await self._notify_slack_discord(
                        "blog_shared_twitter",
                        post["title"],
                        tweet_url=tweet_url
                    )

                    return {"success": True, "tweet_id": tweet_id}
                else:
                    return {"success": False, "error": f"Social API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Twitter share failed: {e}")
            return {"success": False, "error": str(e)}

    async def share_to_linkedin(self, slug: str, user_id: str = "system") -> Dict[str, Any]:
        """Share post to LinkedIn via jasper-social."""
        post = self.get_post_by_slug(slug)
        if not post:
            return {"success": False, "error": "Post not found"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.social_api_url}/blog/share/linkedin/{slug}",
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    post_id = data.get("post_id")

                    # Update post with LinkedIn status
                    posts = self._load_posts()
                    for p in posts:
                        if p.get("slug") == slug:
                            if "social" not in p:
                                p["social"] = {}
                            p["social"]["linkedinShared"] = True
                            p["social"]["linkedinPostId"] = post_id
                            p["social"]["linkedinSharedAt"] = datetime.utcnow().isoformat() + "Z"
                            break
                    self._save_posts(posts)

                    # Log activity
                    self._log_activity(
                        entity_id=slug,
                        action="shared_linkedin",
                        details={"post_id": post_id},
                        user_id=user_id
                    )

                    await self._notify_slack_discord("blog_shared_linkedin", post["title"])

                    return {"success": True, "post_id": post_id}
                else:
                    return {"success": False, "error": f"Social API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"LinkedIn share failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_social_preview(self, slug: str, platform: str) -> Dict[str, Any]:
        """Get AI-generated social media preview."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.social_api_url}/blog/preview/{platform}/{slug}",
                    timeout=30.0
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    return {"success": False, "error": f"Preview API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Social preview failed: {e}")
            return {"success": False, "error": str(e)}

    # Alias for API compatibility
    async def preview_social(self, slug: str, platform: str) -> Dict[str, Any]:
        """Alias for get_social_preview."""
        return await self.get_social_preview(slug, platform)

    # =========================================================================
    # AI CONTENT GENERATION
    # =========================================================================

    async def generate_post(
        self,
        topic: str,
        category: str = "DFI Insights",
        keywords: List[str] = None,
        tone: str = "professional",
        user_id: str = "system",
        min_seo_score: int = 70,
        use_ai_images: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a new post using AI with auto-selected images.

        Pipeline (per JASPER_CONTENT_QUALITY_PIPELINE.md):
        1. Generate content via DeepSeek workers
        2. Validate SEO score - REJECT if below min_seo_score (default 70%)
        3. Generate AI images via Nano Banana Pro
        4. Validate image quality - use fallback if below 70%
        5. Create post as draft

        Quality thresholds:
        - Article SEO: 70% minimum
        - Image quality: 70% minimum
        """
        try:
            # Step 1: Generate content via content_service
            generated = await content_service.generate_blog_post(
                topic=topic,
                category=category.lower().replace(" ", "-"),
                seo_keywords=keywords,
                tone=tone
            )

            if generated.get("error"):
                return {"success": False, "error": generated["error"], "stage": "content_generation"}

            # Step 2: Calculate SEO score and enforce threshold
            temp_post = {
                "title": generated.get("title", topic),
                "content": generated.get("content", ""),
                "excerpt": generated.get("excerpt", ""),
                "slug": self._generate_slug(generated.get("title", topic)),
                "seo": {
                    "title": generated.get("seoTitle", ""),
                    "description": generated.get("seoDescription", ""),
                    "keywords": generated.get("tags", [])
                }
            }
            seo_result = seo_scorer.calculate_score(temp_post)

            if seo_result.score < min_seo_score:
                logger.warning(f"Article rejected: SEO score {seo_result.score} < {min_seo_score}")
                return {
                    "success": False,
                    "error": f"Article SEO score ({seo_result.score}%) below threshold ({min_seo_score}%)",
                    "stage": "seo_validation",
                    "seo_score": seo_result.score,
                    "seo_details": seo_scorer.to_dict(seo_result)
                }

            # Step 3: Generate AI images (if enabled)
            hero_image = None
            image_info = None
            image_source = "none"
            library_image_id = None

            if use_ai_images:
                try:
                    ai_result = await generate_article_images(
                        title=generated.get("title", topic),
                        excerpt=generated.get("excerpt", ""),
                        content=generated.get("content", ""),
                        category=category,
                        slug=self._generate_slug(generated.get("title", topic)),
                        max_images=2  # Hero (16:9) + Infographic
                    )

                    if ai_result.get("success") and ai_result.get("images"):
                        # AI image passed quality validation (70%+)
                        hero_image = ai_result["images"][0]["file_path"]
                        image_info = ai_result["images"][0]
                        image_source = "ai_generated"
                        logger.info(f"AI image generated: quality={image_info.get('quality_score', 0)*100:.0f}%")

                        # Add to image library with AI evaluation
                        try:
                            file_path = ai_result["images"][0].get("file_path")
                            if file_path and Path(file_path).exists():
                                with open(file_path, "rb") as f:
                                    image_data = f.read()
                                lib_image = await image_library.add_image(
                                    image_data=image_data,
                                    source="generated",
                                    original_format="png",
                                    context=f"{generated.get('title', topic)} - {category}",
                                    prompt=image_info.get("prompt", ""),
                                    category=category,
                                )
                                library_image_id = lib_image.id
                                hero_image = lib_image.public_url  # Use library URL
                                logger.info(f"Image added to library: {library_image_id}")
                        except Exception as lib_err:
                            logger.warning(f"Failed to add AI image to library: {lib_err}")
                    else:
                        # Log rejection reasons
                        rejected = ai_result.get("rejected", [])
                        for r in rejected:
                            logger.warning(f"AI image rejected: score={r.get('score')}%, feedback={r.get('feedback')}")

                except Exception as e:
                    logger.error(f"AI image generation failed: {e}")

            # Step 4: Fallback to stock photos if AI image failed
            if not hero_image:
                try:
                    stock_result = await image_service.get_featured_image(topic, category)
                    if stock_result.get("success") and stock_result.get("image"):
                        stock_url = stock_result["image"]["large_url"]
                        image_info = stock_result["image"]
                        image_source = "stock_photo"
                        logger.info(f"Using stock photo from {image_info.get('source')}")

                        # Add stock photo to library with AI evaluation
                        try:
                            lib_image = await image_library.add_from_url(
                                url=stock_url,
                                source=image_info.get("source", "stock"),
                                context=f"{generated.get('title', topic)} - {category}",
                                attribution={
                                    "photographer": image_info.get("photographer"),
                                    "source_name": image_info.get("source"),
                                    "source_url": image_info.get("page_url"),
                                    "license": "Stock Photo License",
                                },
                            )
                            library_image_id = lib_image.id
                            hero_image = lib_image.public_url  # Use library URL (JPEG)
                            logger.info(f"Stock image added to library: {library_image_id}")
                        except Exception as lib_err:
                            logger.warning(f"Failed to add stock image to library: {lib_err}")
                            hero_image = stock_url  # Fallback to original URL
                except Exception as e:
                    logger.error(f"Stock image fetch failed: {e}")

            # Step 5: Ultimate fallback - curated Unsplash URL
            if not hero_image:
                hero_image = get_fallback_image(category)
                image_source = "fallback_stock"
                logger.warning(f"Using fallback image for category: {category}")

            # Step 6: Create the post as draft
            post = self.create_post(
                title=generated.get("title", topic),
                content=generated.get("content", ""),
                excerpt=generated.get("excerpt", ""),
                category=category,
                tags=generated.get("tags", keywords or []),
                hero_image=_optimize_image_url(hero_image) if hero_image else "/images/blog/default.jpg",
                seo={
                    "title": generated.get("seoTitle", ""),
                    "description": generated.get("seoDescription", ""),
                    "keywords": generated.get("tags", []),
                    "score": seo_result.score
                },
                user_id=user_id,
                source="ai"
            )

            return {
                "success": True,
                "post": post,
                "seo_score": seo_result.score,
                "image_source": image_source,
                "image_info": image_info,
                "library_image_id": library_image_id,
                "model_used": generated.get("model"),
                "pipeline_stages": {
                    "content_generation": "passed",
                    "seo_validation": f"passed ({seo_result.score}%)",
                    "image_generation": image_source,
                    "image_library": "added" if library_image_id else "skipped"
                }
            }

        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return {"success": False, "error": str(e), "stage": "unknown"}

    # =========================================================================
    # SEO OPERATIONS
    # =========================================================================

    def get_seo_score(self, slug: str, focus_keyword: str = None) -> Dict[str, Any]:
        """Get detailed SEO score for a post."""
        post = self.get_post_by_slug(slug)
        if not post:
            return {"success": False, "error": "Post not found"}

        result = seo_scorer.calculate_score(post, focus_keyword)
        return {
            "success": True,
            "slug": slug,
            **seo_scorer.to_dict(result)
        }

    async def optimize_seo(
        self,
        slug: str,
        focus_keyword: str = None,
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """AI auto-optimize content for SEO using V2 optimizer."""
        post = self.get_post_by_slug(slug)
        if not post:
            return {"success": False, "error": "Post not found"}

        old_score = post.get("seo", {}).get("score", 0)

        # Use SURGICAL SEO Optimizer V3 (additive only, no rewriting)
        from agents.seo_optimizer_v3 import seo_optimizer_v3

        try:
            keywords = [focus_keyword] if focus_keyword else post.get("seo", {}).get("keywords", [])
            excerpt = post.get("seoDescription") or post.get("excerpt", "")

            optimization = await seo_optimizer_v3.optimize_content(
                content=post.get("content", ""),
                slug=slug,
                title=post.get("title", ""),
                seo_keywords=keywords,
                excerpt=excerpt
            )

            if optimization.get("optimized_content") or optimization.get("meta_description"):
                updates = {}

                if optimization.get("optimized_content"):
                    updates["content"] = optimization["optimized_content"]

                # Also update meta description if generated
                if optimization.get("meta_description"):
                    meta_desc = optimization["meta_description"]
                    updates["seoDescription"] = meta_desc
                    updates["excerpt"] = meta_desc

                    # CRITICAL: Also update seo.description which is what the scorer checks!
                    seo_data = post.get("seo", {}) or {}
                    seo_data["description"] = meta_desc
                    updates["seo"] = seo_data

                    logger.info(f"SEO V3: Updating meta description to: {meta_desc[:50]}...")
                    logger.info(f"SEO V3: Updated seo.description, excerpt, and seoDescription")

                # Add grading data to track auto-improvement
                updates["grading"] = {
                    "was_auto_improved": True,
                    "original_score": old_score,
                    "optimized_at": datetime.utcnow().isoformat() + "Z"
                }

                self.update_post(slug, updates, user_id)

                # Recalculate score
                updated_post = self.get_post_by_slug(slug)
                new_score = updated_post.get("seo", {}).get("score", 0)

                # Log and notify
                self._log_activity(
                    entity_id=slug,
                    action="seo_optimized",
                    details={"old_score": old_score, "new_score": new_score},
                    user_id=user_id
                )

                await self._notify_slack_discord(
                    "blog_seo_optimized",
                    post["title"],
                    old_score=old_score,
                    new_score=new_score
                )

                return {
                    "success": True,
                    "old_score": old_score,
                    "new_score": new_score,
                    "improvements": optimization.get("changes", [])
                }

            return {"success": False, "error": "Optimization failed"}

        except Exception as e:
            logger.error(f"SEO optimization failed: {e}")
            return {"success": False, "error": str(e)}

    # =========================================================================
    # RATINGS
    # =========================================================================

    def rate_post(self, slug: str, rating: int) -> Dict[str, Any]:
        """Submit a star rating (1-5) for a post."""
        if not 1 <= rating <= 5:
            return {"success": False, "error": "Rating must be 1-5"}

        posts = self._load_posts()

        for post in posts:
            if post.get("slug") == slug:
                if "rating" not in post:
                    post["rating"] = {"average": 0, "count": 0, "distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}}

                # Update distribution
                post["rating"]["distribution"][str(rating)] += 1
                post["rating"]["count"] += 1

                # Recalculate average
                dist = post["rating"]["distribution"]
                total_votes = post["rating"]["count"]
                weighted_sum = sum(int(k) * v for k, v in dist.items())
                post["rating"]["average"] = round(weighted_sum / total_votes, 1) if total_votes > 0 else 0

                self._save_posts(posts)

                return {
                    "success": True,
                    "rating": post["rating"]
                }

        return {"success": False, "error": "Post not found"}

    def get_rating(self, slug: str) -> Dict[str, Any]:
        """Get rating for a post."""
        post = self.get_post_by_slug(slug)
        if not post:
            return {"success": False, "error": "Post not found"}

        return {
            "success": True,
            "rating": post.get("rating", {"average": 0, "count": 0})
        }

    # =========================================================================
    # STATISTICS
    # =========================================================================

    def get_stats(self) -> Dict[str, Any]:
        """Get blog statistics for dashboard."""
        posts = self._load_posts()

        # Count by status
        by_status = {"published": 0, "draft": 0, "scheduled": 0, "archived": 0}
        for post in posts:
            status = post.get("status", "draft")
            if status in by_status:
                by_status[status] += 1

        # Count by category
        by_category = {}
        for post in posts:
            cat = post.get("category", "Uncategorized")
            by_category[cat] = by_category.get(cat, 0) + 1

        # Social stats
        twitter_shared = sum(1 for p in posts if p.get("social", {}).get("twitterShared"))
        linkedin_shared = sum(1 for p in posts if p.get("social", {}).get("linkedinShared"))

        # SEO stats
        scores = [p.get("seo", {}).get("score", 0) for p in posts if p.get("status") == "published"]
        avg_seo = round(sum(scores) / len(scores), 1) if scores else 0
        above_80 = sum(1 for s in scores if s >= 80)
        need_optimization = sum(1 for s in scores if s < 60)

        # Scheduled posts
        scheduled = [p for p in posts if p.get("status") == "scheduled"]
        scheduled.sort(key=lambda p: p.get("scheduledFor", ""))

        return {
            "total_posts": len(posts),
            "by_status": by_status,
            "by_category": by_category,
            "social_stats": {
                "twitter_shared": twitter_shared,
                "linkedin_shared": linkedin_shared,
            },
            "seo_stats": {
                "avg_score": avg_seo,
                "posts_above_80": above_80,
                "posts_need_optimization": need_optimization
            },
            "scheduled_upcoming": [
                {"slug": p["slug"], "title": p["title"], "scheduledFor": p["scheduledFor"]}
                for p in scheduled[:5]
            ]
        }


# Singleton instance
blog_service = BlogService()
