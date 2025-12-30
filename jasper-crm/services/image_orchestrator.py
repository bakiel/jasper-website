"""
JASPER CRM - Image Orchestrator

Autonomous image generation system that:
1. Monitors for posts without hero images
2. Detects infographic opportunities in content
3. Generates images using Nano Banana Pro
4. Manages image quality and regeneration

Runs on APScheduler - Pure Python Architecture (no n8n/Zapier)
"""

import json
import re
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# Data paths
BLOG_DATA_PATH = Path(__file__).parent.parent / "data" / "blog_posts.json"
ORCHESTRATOR_LOG_PATH = Path(__file__).parent.parent / "data" / "image_orchestrator_log.json"


@dataclass
class InfographicOpportunity:
    """Detected opportunity for infographic generation."""
    article_slug: str
    opportunity_type: str  # numbered_list, comparison, statistics, process, timeline
    confidence: float  # 0-1
    detected_elements: List[str]
    suggested_title: str


# Infographic detection patterns
INFOGRAPHIC_PATTERNS = {
    "numbered_list": {
        "patterns": [
            r"\b(\d+)\s+(steps?|ways?|tips?|strategies|practices|factors|reasons|benefits|advantages)\b",
            r"\b(top|best|essential|key|critical|important)\s+(\d+)\b",
            r"\bhow\s+to\b.*\bin\s+(\d+)\s+steps?\b",
        ],
        "min_confidence": 0.7,
        "title_template": "{count} Key {topic}"
    },
    "comparison": {
        "patterns": [
            r"\bvs\.?\b|\bversus\b",
            r"\bcompared?\s+to\b",
            r"\bdifference\s+between\b",
            r"\bpros\s+and\s+cons\b",
            r"\badvantages?\s+and\s+disadvantages?\b",
        ],
        "min_confidence": 0.6,
        "title_template": "{topic} Comparison"
    },
    "statistics": {
        "patterns": [
            r"\b\d+(\.\d+)?%",  # Percentages
            r"\$\d+[\d,]*(\.\d+)?\s*(million|billion|m|b|mn|bn)?\b",  # Dollar amounts
            r"\bR\d+[\d,]*(\.\d+)?\s*(million|billion|m|b|mn|bn)?\b",  # Rand amounts
            r"\b\d+[\d,]*\s*(million|billion)\b",  # Large numbers
        ],
        "min_confidence": 0.5,
        "title_template": "{topic} by the Numbers"
    },
    "process": {
        "patterns": [
            r"\bprocess\b.*\b(overview|steps?|stages?|phases?)\b",
            r"\bworkflow\b",
            r"\bpipeline\b",
            r"\bframework\b",
            r"\bmethodology\b",
            r"\bstep\s+\d+\b",
        ],
        "min_confidence": 0.6,
        "title_template": "{topic} Process Flow"
    },
    "timeline": {
        "patterns": [
            r"\btimeline\b",
            r"\b(20\d{2})\b.*\b(20\d{2})\b",  # Year ranges
            r"\bphase\s+\d+\b",
            r"\bq[1-4]\s+20\d{2}\b",  # Quarterly references
            r"\broadmap\b",
        ],
        "min_confidence": 0.6,
        "title_template": "{topic} Timeline"
    }
}


def load_blog_posts() -> List[Dict[str, Any]]:
    """Load blog posts from JSON file."""
    try:
        if BLOG_DATA_PATH.exists():
            with open(BLOG_DATA_PATH, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Failed to load blog posts: {e}")
        return []


def save_blog_posts(posts: List[Dict[str, Any]]) -> bool:
    """Save blog posts to JSON file."""
    try:
        with open(BLOG_DATA_PATH, 'w') as f:
            json.dump(posts, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save blog posts: {e}")
        return False


def load_orchestrator_log() -> Dict[str, Any]:
    """Load orchestrator activity log."""
    try:
        if ORCHESTRATOR_LOG_PATH.exists():
            with open(ORCHESTRATOR_LOG_PATH, 'r') as f:
                return json.load(f)
        return {"runs": [], "images_generated": 0, "infographics_generated": 0}
    except Exception:
        return {"runs": [], "images_generated": 0, "infographics_generated": 0}


def save_orchestrator_log(log: Dict[str, Any]) -> None:
    """Save orchestrator activity log."""
    try:
        ORCHESTRATOR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        # Keep only last 100 runs
        log["runs"] = log.get("runs", [])[-100:]
        with open(ORCHESTRATOR_LOG_PATH, 'w') as f:
            json.dump(log, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save orchestrator log: {e}")


def detect_infographic_opportunity(post: Dict[str, Any]) -> Optional[InfographicOpportunity]:
    """
    Analyze article content to detect infographic opportunities.

    Returns InfographicOpportunity if article would benefit from an infographic.
    """
    content = post.get("content", "")
    title = post.get("title", "")
    excerpt = post.get("excerpt", "")

    # Combine text for analysis
    full_text = f"{title} {excerpt} {content}".lower()

    best_opportunity = None
    best_confidence = 0.0

    for opp_type, config in INFOGRAPHIC_PATTERNS.items():
        patterns = config["patterns"]
        min_confidence = config["min_confidence"]

        matches = []
        for pattern in patterns:
            found = re.findall(pattern, full_text, re.IGNORECASE)
            if found:
                matches.extend([str(m) if isinstance(m, str) else str(m[0]) for m in found])

        if matches:
            # Calculate confidence based on number of matches
            match_count = len(matches)
            confidence = min(0.95, min_confidence + (match_count * 0.05))

            if confidence > best_confidence and confidence >= min_confidence:
                best_confidence = confidence

                # Extract topic from title
                topic = title.split(":")[0] if ":" in title else title[:30]

                # Build suggested title
                if opp_type == "numbered_list" and matches:
                    # Try to extract the number
                    numbers = re.findall(r'\d+', matches[0])
                    count = numbers[0] if numbers else "Key"
                    suggested_title = f"{count} {topic} Insights"
                else:
                    suggested_title = config["title_template"].format(
                        topic=topic,
                        count=len(matches)
                    )

                best_opportunity = InfographicOpportunity(
                    article_slug=post.get("slug", ""),
                    opportunity_type=opp_type,
                    confidence=confidence,
                    detected_elements=matches[:5],  # Top 5 matches
                    suggested_title=suggested_title
                )

    return best_opportunity


class ImageOrchestrator:
    """
    Autonomous image generation orchestrator.

    Monitors blog posts and generates images automatically:
    - Hero images for posts without them
    - Infographics for qualifying content
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_running = False
        self._last_run: Optional[datetime] = None
        self._stats = {
            "total_runs": 0,
            "hero_images_generated": 0,
            "infographics_generated": 0,
            "errors": 0
        }

    def start(self, check_interval_minutes: int = 10):
        """
        Start the image orchestrator.

        Args:
            check_interval_minutes: How often to check for missing images (default: 10 min)
        """
        if self._is_running:
            logger.warning("Image Orchestrator already running")
            return

        # Add job to check for missing images
        self.scheduler.add_job(
            self._orchestrate_images,
            trigger=IntervalTrigger(minutes=check_interval_minutes),
            id="image_orchestrator",
            name="Autonomous Image Generation",
            replace_existing=True,
        )

        self.scheduler.start()
        self._is_running = True
        logger.info(f"Image Orchestrator started - checking every {check_interval_minutes} minutes")

    def stop(self):
        """Stop the image orchestrator."""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            logger.info("Image Orchestrator stopped")

    def get_status(self) -> Dict[str, Any]:
        """Get orchestrator status and statistics."""
        return {
            "running": self._is_running,
            "last_run": self._last_run.isoformat() if self._last_run else None,
            "stats": self._stats,
            "next_run": str(self.scheduler.get_jobs()[0].next_run_time) if self._is_running and self.scheduler.get_jobs() else None
        }

    async def _orchestrate_images(self):
        """
        Main orchestration loop - called by scheduler.

        1. Find posts without hero images
        2. Detect infographic opportunities
        3. Generate images as needed
        """
        run_start = datetime.utcnow()
        self._last_run = run_start
        self._stats["total_runs"] += 1

        run_log = {
            "timestamp": run_start.isoformat(),
            "hero_images": [],
            "infographics": [],
            "errors": []
        }

        try:
            posts = load_blog_posts()

            # Only process published posts
            published_posts = [p for p in posts if p.get("status") == "published"]

            logger.info(f"Image Orchestrator scanning {len(published_posts)} published posts")

            # Import image service here to avoid circular imports
            from services.ai_image_service import generate_article_images

            for post in published_posts:
                slug = post.get("slug", "")

                # Check if post needs hero image
                hero_image = post.get("heroImage", "")
                needs_hero = not hero_image or hero_image == "/images/blog/default.jpg"

                # Check if post could use an infographic
                infographic_image = post.get("infographicImage")
                infographic_opp = None

                if not infographic_image:
                    infographic_opp = detect_infographic_opportunity(post)

                # Generate hero image if needed
                if needs_hero:
                    logger.info(f"Generating hero image for: {slug}")
                    try:
                        result = await generate_article_images(
                            title=post.get("title", ""),
                            excerpt=post.get("excerpt", ""),
                            content=post.get("content", "")[:2000],  # Limit content
                            category=post.get("category", "DFI Insights"),
                            slug=slug,
                            max_images=1
                        )

                        if result.get("success") and result.get("images"):
                            hero = result["images"][0]
                            post["heroImage"] = f"/generated-images/{hero['id']}.jpg"
                            post["imageGeneratedAt"] = datetime.utcnow().isoformat() + "Z"
                            post["imageQualityScore"] = hero.get("quality_score", 0)

                            self._stats["hero_images_generated"] += 1
                            run_log["hero_images"].append({
                                "slug": slug,
                                "image": post["heroImage"],
                                "quality": hero.get("quality_score", 0)
                            })
                            logger.info(f"Generated hero image for {slug}: {post['heroImage']}")
                    except Exception as e:
                        error_msg = f"Hero image error for {slug}: {e}"
                        logger.error(error_msg)
                        run_log["errors"].append(error_msg)
                        self._stats["errors"] += 1

                # Generate infographic if opportunity detected (confidence > 0.7)
                if infographic_opp and infographic_opp.confidence >= 0.7:
                    logger.info(f"Generating infographic for: {slug} ({infographic_opp.opportunity_type})")
                    try:
                        result = await generate_article_images(
                            title=infographic_opp.suggested_title,
                            excerpt=f"Infographic: {infographic_opp.opportunity_type}",
                            content=", ".join(infographic_opp.detected_elements),
                            category=post.get("category", "DFI Insights"),
                            slug=f"{slug}_infographic",
                            max_images=1,
                            image_type="infographic"
                        )

                        if result.get("success") and result.get("images"):
                            infographic = result["images"][0]
                            post["infographicImage"] = f"/generated-images/{infographic['id']}.jpg"
                            post["infographicType"] = infographic_opp.opportunity_type
                            post["infographicGeneratedAt"] = datetime.utcnow().isoformat() + "Z"

                            self._stats["infographics_generated"] += 1
                            run_log["infographics"].append({
                                "slug": slug,
                                "type": infographic_opp.opportunity_type,
                                "confidence": infographic_opp.confidence,
                                "image": post["infographicImage"]
                            })
                            logger.info(f"Generated infographic for {slug}: {post['infographicImage']}")
                    except Exception as e:
                        error_msg = f"Infographic error for {slug}: {e}"
                        logger.error(error_msg)
                        run_log["errors"].append(error_msg)
                        self._stats["errors"] += 1

            # Save updated posts
            if run_log["hero_images"] or run_log["infographics"]:
                save_blog_posts(posts)

            # Update orchestrator log
            orch_log = load_orchestrator_log()
            orch_log["runs"].append(run_log)
            orch_log["images_generated"] = self._stats["hero_images_generated"]
            orch_log["infographics_generated"] = self._stats["infographics_generated"]
            orch_log["last_run"] = run_start.isoformat()
            save_orchestrator_log(orch_log)

            run_duration = (datetime.utcnow() - run_start).total_seconds()
            logger.info(f"Image Orchestrator run complete in {run_duration:.1f}s - "
                       f"Hero: {len(run_log['hero_images'])}, Infographics: {len(run_log['infographics'])}")

        except Exception as e:
            logger.error(f"Image Orchestrator error: {e}")
            self._stats["errors"] += 1

    async def generate_for_post(self, slug: str, force_hero: bool = False, force_infographic: bool = False) -> Dict[str, Any]:
        """
        Generate images for a specific post on demand.

        Args:
            slug: Post slug
            force_hero: Regenerate hero even if one exists
            force_infographic: Generate infographic even if confidence is low
        """
        posts = load_blog_posts()
        post = next((p for p in posts if p.get("slug") == slug), None)

        if not post:
            return {"success": False, "error": f"Post not found: {slug}"}

        result = {
            "success": True,
            "slug": slug,
            "hero_image": None,
            "infographic": None
        }

        from services.ai_image_service import generate_article_images

        # Generate hero if needed or forced
        hero_image = post.get("heroImage", "")
        needs_hero = force_hero or not hero_image or hero_image == "/images/blog/default.jpg"

        if needs_hero:
            try:
                img_result = await generate_article_images(
                    title=post.get("title", ""),
                    excerpt=post.get("excerpt", ""),
                    content=post.get("content", "")[:2000],
                    category=post.get("category", "DFI Insights"),
                    slug=slug,
                    max_images=1
                )

                if img_result.get("success") and img_result.get("images"):
                    hero = img_result["images"][0]
                    post["heroImage"] = f"/generated-images/{hero['id']}.jpg"
                    post["imageGeneratedAt"] = datetime.utcnow().isoformat() + "Z"
                    result["hero_image"] = post["heroImage"]
            except Exception as e:
                result["hero_error"] = str(e)

        # Check for infographic opportunity
        infographic_opp = detect_infographic_opportunity(post)

        if infographic_opp and (force_infographic or infographic_opp.confidence >= 0.7):
            try:
                img_result = await generate_article_images(
                    title=infographic_opp.suggested_title,
                    excerpt=f"Infographic: {infographic_opp.opportunity_type}",
                    content=", ".join(infographic_opp.detected_elements),
                    category=post.get("category", "DFI Insights"),
                    slug=f"{slug}_infographic",
                    max_images=1,
                    image_type="infographic"
                )

                if img_result.get("success") and img_result.get("images"):
                    infographic = img_result["images"][0]
                    post["infographicImage"] = f"/generated-images/{infographic['id']}.jpg"
                    post["infographicType"] = infographic_opp.opportunity_type
                    result["infographic"] = {
                        "image": post["infographicImage"],
                        "type": infographic_opp.opportunity_type,
                        "confidence": infographic_opp.confidence
                    }
            except Exception as e:
                result["infographic_error"] = str(e)
        elif infographic_opp:
            result["infographic_opportunity"] = asdict(infographic_opp)

        # Save updated post
        save_blog_posts(posts)

        return result


# Singleton instance
image_orchestrator = ImageOrchestrator()
