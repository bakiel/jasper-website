"""
JASPER CRM - Editor-in-Chief Orchestrator

The "Newspaper Editor" - oversees all content creation and quality.
Powered by Gemini 3.0 Flash for intelligent assessment and decision-making.

Responsibilities:
1. HUD Dashboard - Complete view of all articles and their status
2. Quality Orchestration - Dispatches specialist agents to fix gaps
3. Performance Tracking - Monitors article metrics and accomplishments
4. Autonomous Operation - Runs on schedule to ensure excellence
5. AI Assessment - Uses Gemini 3.0 Flash for intelligent content analysis

This is the BRAIN that makes articles perfect, not just checks them.

Runs on APScheduler - Pure Python Architecture (no n8n/Zapier)
"""

import os
import json
import logging
import re
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Google AI SDK for Gemini 3.0 Flash
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

logger = logging.getLogger(__name__)

# Initialize Gemini client
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
gemini_client = genai.Client(api_key=GOOGLE_API_KEY) if GEMINI_AVAILABLE and GOOGLE_API_KEY else None

# Data paths
BLOG_DATA_PATH = Path(__file__).parent.parent / "data" / "blog_posts.json"
EDITOR_LOG_PATH = Path(__file__).parent.parent / "data" / "editor_in_chief_log.json"
ACCOMPLISHMENTS_PATH = Path(__file__).parent.parent / "data" / "editor_accomplishments.json"


class ArticleStatus(Enum):
    """Article readiness status."""
    DRAFT = "draft"
    NEEDS_WORK = "needs_work"
    READY = "ready"
    PUBLISHED = "published"
    FEATURED = "featured"


@dataclass
class ArticleHealthReport:
    """Health assessment for a single article."""
    slug: str
    title: str
    status: str

    # Content Quality (0-100)
    content_score: int
    content_issues: List[str]

    # Image Status
    has_hero_image: bool
    hero_image_quality: Optional[int]
    has_infographic: bool
    infographic_opportunity: Optional[str]

    # SEO Status
    seo_score: int
    seo_issues: List[str]

    # Social Status
    has_social_hooks: bool
    twitter_shared: bool
    linkedin_shared: bool

    # Performance (if published)
    views: int
    avg_time_on_page: int  # seconds

    # Overall
    overall_health: int  # 0-100
    recommended_actions: List[str]


@dataclass
class EditorAccomplishment:
    """Record of an action taken by the Editor."""
    timestamp: str
    article_slug: str
    action_type: str  # image_generated, seo_improved, content_enhanced, etc.
    details: str
    improvement_score: int  # How much the article improved (0-100)


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


def load_accomplishments() -> List[Dict[str, Any]]:
    """Load editor accomplishments log."""
    try:
        if ACCOMPLISHMENTS_PATH.exists():
            with open(ACCOMPLISHMENTS_PATH, 'r') as f:
                return json.load(f)
        return []
    except Exception:
        return []


def save_accomplishment(accomplishment: EditorAccomplishment) -> None:
    """Save a new accomplishment."""
    try:
        accomplishments = load_accomplishments()
        accomplishments.append(asdict(accomplishment))
        # Keep last 500 accomplishments
        accomplishments = accomplishments[-500:]

        ACCOMPLISHMENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(ACCOMPLISHMENTS_PATH, 'w') as f:
            json.dump(accomplishments, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save accomplishment: {e}")


# =============================================================================
# GEMINI 3.0 FLASH - AI-POWERED ASSESSMENT FUNCTIONS
# =============================================================================

async def ai_assess_article_quality(post: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use Gemini 3.0 Flash to assess article quality holistically.

    Returns AI-powered quality scores and specific recommendations.
    """
    if not gemini_client:
        return {"ai_available": False, "fallback": True}

    title = post.get("title", "")
    excerpt = post.get("excerpt", "")
    content = post.get("content", "")[:3000]  # Limit content length
    category = post.get("category", "")
    keywords = post.get("keywords", [])

    prompt = f"""You are the Editor-in-Chief of JASPER, a DFI-focused financial advisory blog.
Assess this article for publication quality.

ARTICLE:
Title: {title}
Category: {category}
Keywords: {', '.join(keywords) if keywords else 'None'}
Excerpt: {excerpt}
Content: {content}...

ASSESSMENT CRITERIA (score 0-100 each):
1. CONTENT_DEPTH - Is it comprehensive for DFI professionals? Does it provide actionable insights?
2. SEO_QUALITY - Title optimization, keyword usage, meta description quality
3. READABILITY - Structure, headings, paragraph length, flow
4. AUTHORITY - Does it demonstrate expertise? Are claims supported?
5. ENGAGEMENT - Hook quality, storytelling, call-to-action

INFOGRAPHIC OPPORTUNITY:
Analyze if this article would benefit from an infographic. Look for:
- Numbered lists (X steps, X tips, X factors)
- Statistics or percentages that could be visualized
- Comparisons between options
- Process flows or timelines
- Technical data that's hard to digest as text

Return JSON only:
{{
    "content_depth": 0-100,
    "seo_quality": 0-100,
    "readability": 0-100,
    "authority": 0-100,
    "engagement": 0-100,
    "overall_score": 0-100,
    "infographic_opportunity": {{
        "detected": true/false,
        "type": "numbered_list|statistics|comparison|process|timeline|none",
        "confidence": 0-100,
        "suggested_title": "...",
        "data_points": ["point 1", "point 2", ...]
    }},
    "top_issues": ["issue 1", "issue 2", "issue 3"],
    "recommendations": ["rec 1", "rec 2", "rec 3"]
}}"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview",  # Gemini 3.0 Flash
            contents=prompt
        )

        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())
        result["ai_available"] = True
        result["assessed_at"] = datetime.utcnow().isoformat()
        return result

    except Exception as e:
        logger.error(f"AI assessment error: {e}")
        return {"ai_available": False, "error": str(e)}


async def ai_detect_infographic_opportunity(post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Use Gemini 3.0 Flash to detect infographic opportunities with high accuracy.

    This is more intelligent than regex pattern matching - it understands context.
    """
    if not gemini_client:
        return None

    title = post.get("title", "")
    content = post.get("content", "")[:4000]

    prompt = f"""Analyze this article for infographic opportunities.

ARTICLE TITLE: {title}

CONTENT:
{content}

TASK: Determine if this article contains content that would be SIGNIFICANTLY enhanced by an infographic.

INFOGRAPHIC TYPES:
1. numbered_list - Article discusses X steps, X tips, X factors, X benefits
2. statistics - Article contains important percentages, financial figures, metrics
3. comparison - Article compares options, pros/cons, before/after
4. process - Article explains a workflow, pipeline, methodology
5. timeline - Article discusses phases, roadmap, historical progression

CRITERIA FOR RECOMMENDATION:
- HIGH confidence (80%+): Clear structured data that MUST be visualized
- MEDIUM confidence (60-79%): Would benefit from visualization
- LOW confidence (<60%): Text format is sufficient

Return JSON only:
{{
    "should_create_infographic": true/false,
    "type": "numbered_list|statistics|comparison|process|timeline",
    "confidence": 0-100,
    "title": "Suggested infographic title",
    "data_points": [
        "Key point 1 to visualize",
        "Key point 2 to visualize",
        "Key point 3 to visualize"
    ],
    "reasoning": "Why this would/wouldn't benefit from an infographic"
}}"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())

        if result.get("should_create_infographic") and result.get("confidence", 0) >= 70:
            return result
        return None

    except Exception as e:
        logger.error(f"AI infographic detection error: {e}")
        return None


async def ai_generate_improvement_plan(post: Dict[str, Any], health_report: 'ArticleHealthReport') -> List[str]:
    """
    Use Gemini 3.0 Flash to generate a prioritized improvement plan.
    """
    if not gemini_client:
        return health_report.recommended_actions

    prompt = f"""As Editor-in-Chief, create a prioritized improvement plan for this article.

ARTICLE: {post.get('title', '')}
CATEGORY: {post.get('category', '')}

CURRENT STATUS:
- Content Score: {health_report.content_score}/100
- SEO Score: {health_report.seo_score}/100
- Has Hero Image: {health_report.has_hero_image}
- Has Infographic: {health_report.has_infographic}
- Overall Health: {health_report.overall_health}/100

DETECTED ISSUES:
- Content: {', '.join(health_report.content_issues) if health_report.content_issues else 'None'}
- SEO: {', '.join(health_report.seo_issues) if health_report.seo_issues else 'None'}

Return a JSON array of 3-5 prioritized actions:
["Action 1 (highest priority)", "Action 2", "Action 3"]

Focus on actions that will have the BIGGEST impact on article quality.
Consider: images, SEO, content depth, social sharing."""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        actions = json.loads(text.strip())
        return actions if isinstance(actions, list) else health_report.recommended_actions

    except Exception as e:
        logger.error(f"AI improvement plan error: {e}")
        return health_report.recommended_actions


def assess_article_health(post: Dict[str, Any]) -> ArticleHealthReport:
    """
    Comprehensive health assessment of an article.

    This is what the Editor sees on the HUD for each article.
    """
    slug = post.get("slug", "")
    title = post.get("title", "")
    status = post.get("status", "draft")
    content = post.get("content", "")
    excerpt = post.get("excerpt", "")

    # --- Content Quality Assessment ---
    content_issues = []
    content_score = 100

    word_count = len(content.split()) if content else 0
    if word_count < 500:
        content_issues.append(f"Content too short ({word_count} words, need 500+)")
        content_score -= 30
    elif word_count < 800:
        content_issues.append(f"Content could be longer ({word_count} words)")
        content_score -= 10

    if not excerpt or len(excerpt) < 50:
        content_issues.append("Excerpt missing or too short")
        content_score -= 15

    # Check for subheadings
    if "##" not in content and "<h2" not in content.lower():
        content_issues.append("No subheadings (##) - improves readability")
        content_score -= 10

    # --- Image Assessment ---
    hero_image = post.get("heroImage", "")
    has_hero = bool(hero_image) and hero_image != "/images/blog/default.jpg"
    hero_quality = post.get("imageQualityScore", 0) if has_hero else None

    infographic = post.get("infographicImage")
    has_infographic = bool(infographic)

    # Check for infographic opportunity (simplified version)
    infographic_opp = None
    content_lower = content.lower()
    if any(pattern in content_lower for pattern in ["steps", "tips", "ways to", "benefits", "advantages"]):
        if not has_infographic:
            infographic_opp = "numbered_list"
    elif "%" in content or "million" in content_lower or "billion" in content_lower:
        if not has_infographic:
            infographic_opp = "statistics"

    # --- SEO Assessment ---
    seo_issues = []
    seo_score = 100

    meta_title = post.get("seoTitle", "") or title
    meta_desc = post.get("seoDescription", "") or excerpt

    if len(meta_title) < 30:
        seo_issues.append("SEO title too short (need 30-60 chars)")
        seo_score -= 15
    elif len(meta_title) > 60:
        seo_issues.append("SEO title too long (max 60 chars)")
        seo_score -= 10

    if len(meta_desc) < 120:
        seo_issues.append("Meta description too short (need 120-160 chars)")
        seo_score -= 15
    elif len(meta_desc) > 160:
        seo_issues.append("Meta description too long (max 160 chars)")
        seo_score -= 10

    keywords = post.get("keywords", [])
    if not keywords or len(keywords) < 3:
        seo_issues.append("Need more keywords (minimum 3)")
        seo_score -= 20

    # Check keyword in title
    if keywords:
        primary_keyword = keywords[0].lower() if keywords else ""
        if primary_keyword and primary_keyword not in title.lower():
            seo_issues.append(f"Primary keyword '{keywords[0]}' not in title")
            seo_score -= 15

    # --- Social Assessment ---
    social_hooks = post.get("socialHooks", {})
    has_social = bool(social_hooks.get("twitter")) or bool(social_hooks.get("linkedin"))
    twitter_shared = bool(post.get("twitterSharedAt"))
    linkedin_shared = bool(post.get("linkedinSharedAt"))

    # --- Performance (mock for now - would come from analytics) ---
    views = post.get("views", 0)
    avg_time = post.get("avgTimeOnPage", 0)

    # --- Calculate Overall Health ---
    overall = content_score * 0.3 + seo_score * 0.25

    if has_hero:
        overall += 20
        if hero_quality and hero_quality >= 85:
            overall += 5

    if has_infographic:
        overall += 10
    elif infographic_opp:
        overall -= 5  # Missed opportunity

    if has_social:
        overall += 10

    overall = max(0, min(100, int(overall)))

    # --- Recommended Actions ---
    actions = []

    if not has_hero:
        actions.append("URGENT: Generate hero image")
    elif hero_quality and hero_quality < 80:
        actions.append("Regenerate hero image (quality score low)")

    if infographic_opp and not has_infographic:
        actions.append(f"Generate infographic ({infographic_opp} detected)")

    if content_issues:
        actions.append(f"Improve content: {content_issues[0]}")

    if seo_issues:
        actions.append(f"Fix SEO: {seo_issues[0]}")

    if not has_social:
        actions.append("Add social media hooks")

    if status == "published" and not twitter_shared:
        actions.append("Share to Twitter")

    if status == "published" and not linkedin_shared:
        actions.append("Share to LinkedIn")

    return ArticleHealthReport(
        slug=slug,
        title=title[:60],
        status=status,
        content_score=max(0, content_score),
        content_issues=content_issues,
        has_hero_image=has_hero,
        hero_image_quality=hero_quality,
        has_infographic=has_infographic,
        infographic_opportunity=infographic_opp,
        seo_score=max(0, seo_score),
        seo_issues=seo_issues,
        has_social_hooks=has_social,
        twitter_shared=twitter_shared,
        linkedin_shared=linkedin_shared,
        views=views,
        avg_time_on_page=avg_time,
        overall_health=overall,
        recommended_actions=actions[:5]  # Top 5 actions
    )


class EditorInChief:
    """
    The Editor-in-Chief - runs the whole newspaper.

    - Maintains HUD view of all articles
    - Dispatches specialist agents
    - Tracks accomplishments
    - Ensures publication excellence
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_running = False
        self._last_review: Optional[datetime] = None
        self._stats = {
            "total_reviews": 0,
            "articles_improved": 0,
            "images_generated": 0,
            "seo_fixes": 0,
            "social_shares": 0
        }

    def start(self, review_interval_minutes: int = 30):
        """
        Start the Editor-in-Chief.

        Args:
            review_interval_minutes: How often to review all articles (default: 30 min)
        """
        if self._is_running:
            logger.warning("Editor-in-Chief already running")
            return

        # Main review job
        self.scheduler.add_job(
            self._editorial_review,
            trigger=IntervalTrigger(minutes=review_interval_minutes),
            id="editorial_review",
            name="Editor-in-Chief Review Cycle",
            replace_existing=True,
        )

        self.scheduler.start()
        self._is_running = True
        logger.info(f"Editor-in-Chief started - reviewing every {review_interval_minutes} minutes")

    def stop(self):
        """Stop the Editor-in-Chief."""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            logger.info("Editor-in-Chief stopped")

    def get_status(self) -> Dict[str, Any]:
        """Get Editor status and statistics."""
        return {
            "running": self._is_running,
            "last_review": self._last_review.isoformat() if self._last_review else None,
            "stats": self._stats,
            "next_review": str(self.scheduler.get_jobs()[0].next_run_time) if self._is_running and self.scheduler.get_jobs() else None
        }

    def get_hud(self) -> Dict[str, Any]:
        """
        Get the Editor's HUD - complete overview of all articles.

        This is what the Editor sees on their dashboard.
        """
        posts = load_blog_posts()

        # Assess all articles
        reports = [assess_article_health(post) for post in posts]

        # Sort by overall health (worst first - needs attention)
        reports.sort(key=lambda r: r.overall_health)

        # Calculate summary stats
        published = [r for r in reports if r.status == "published"]
        drafts = [r for r in reports if r.status == "draft"]
        needs_work = [r for r in reports if r.overall_health < 70]

        avg_health = sum(r.overall_health for r in reports) / len(reports) if reports else 0

        # Articles needing urgent attention
        urgent = [r for r in reports if not r.has_hero_image or r.overall_health < 50]

        # Recent accomplishments
        accomplishments = load_accomplishments()[-20:]  # Last 20

        return {
            "summary": {
                "total_articles": len(reports),
                "published": len(published),
                "drafts": len(drafts),
                "needs_attention": len(needs_work),
                "urgent_issues": len(urgent),
                "average_health": round(avg_health, 1),
                "last_review": self._last_review.isoformat() if self._last_review else None
            },
            "health_distribution": {
                "excellent": len([r for r in reports if r.overall_health >= 90]),
                "good": len([r for r in reports if 70 <= r.overall_health < 90]),
                "needs_work": len([r for r in reports if 50 <= r.overall_health < 70]),
                "poor": len([r for r in reports if r.overall_health < 50])
            },
            "image_status": {
                "with_hero": len([r for r in reports if r.has_hero_image]),
                "without_hero": len([r for r in reports if not r.has_hero_image]),
                "with_infographic": len([r for r in reports if r.has_infographic]),
                "infographic_opportunities": len([r for r in reports if r.infographic_opportunity])
            },
            "seo_status": {
                "excellent_seo": len([r for r in reports if r.seo_score >= 90]),
                "needs_seo_work": len([r for r in reports if r.seo_score < 70])
            },
            "social_status": {
                "twitter_shared": len([r for r in published if r.twitter_shared]),
                "linkedin_shared": len([r for r in published if r.linkedin_shared]),
                "not_shared": len([r for r in published if not r.twitter_shared and not r.linkedin_shared])
            },
            "urgent_attention": [asdict(r) for r in urgent[:5]],  # Top 5 urgent
            "all_articles": [asdict(r) for r in reports],
            "recent_accomplishments": accomplishments,
            "editor_stats": self._stats
        }

    async def _editorial_review(self):
        """
        Main editorial review cycle powered by Gemini 3.0 Flash.

        1. Assess all articles with AI
        2. Detect infographic opportunities intelligently
        3. Dispatch specialist agents
        4. Log accomplishments
        """
        self._last_review = datetime.utcnow()
        self._stats["total_reviews"] += 1

        logger.info("Editor-in-Chief starting AI-powered review cycle...")

        posts = load_blog_posts()
        published_posts = [p for p in posts if p.get("status") == "published"]

        for post in published_posts:
            slug = post.get("slug", "")
            report = assess_article_health(post)

            # Priority 1: Missing hero images
            if not report.has_hero_image:
                logger.info(f"[Editor] {slug}: Missing hero image - dispatching Image Orchestrator")
                await self._dispatch_image_generation(post, "hero")

            # Priority 2: AI-powered infographic detection (more intelligent than regex)
            elif not report.has_infographic:
                # Use Gemini 3.0 Flash for smart detection
                infographic_opp = await ai_detect_infographic_opportunity(post)

                if infographic_opp and infographic_opp.get("confidence", 0) >= 70:
                    logger.info(f"[Editor] {slug}: AI detected infographic opportunity "
                               f"(type={infographic_opp.get('type')}, confidence={infographic_opp.get('confidence')}%)")
                    await self._dispatch_infographic_generation(
                        post=post,
                        infographic_type=infographic_opp.get("type", "numbered_list"),
                        title=infographic_opp.get("title", f"{post.get('title', '')} - Key Points"),
                        data_points=infographic_opp.get("data_points", [])
                    )

            # Priority 3: SEO issues (log for now, future: dispatch SEO agent)
            if report.seo_score < 70:
                logger.info(f"[Editor] {slug}: SEO needs work (score={report.seo_score}): {report.seo_issues[:2]}")

            # Priority 4: Social sharing (future: dispatch Social agent)
            if not report.twitter_shared and report.overall_health >= 80:
                logger.info(f"[Editor] {slug}: Ready for Twitter sharing (health={report.overall_health})")

        logger.info(f"Editor-in-Chief AI review complete - {len(published_posts)} articles reviewed")

    async def _dispatch_infographic_generation(
        self,
        post: Dict[str, Any],
        infographic_type: str,
        title: str,
        data_points: List[str]
    ):
        """
        Dispatch infographic generation using AI-detected parameters.

        Uses the specialized generate_infographic function for data visualization.
        """
        slug = post.get("slug", "")
        category = post.get("category", "DFI Insights")

        try:
            from services.ai_image_service import generate_infographic

            result = await generate_infographic(
                title=title,
                infographic_type=infographic_type,
                data_points=data_points,
                category=category,
                slug=slug
            )

            if result:
                # Update the post with infographic
                posts = load_blog_posts()
                post_to_update = next((p for p in posts if p.get("slug") == slug), None)

                if post_to_update:
                    post_to_update["infographicImage"] = f"/generated-images/{result.id}.jpg"
                    post_to_update["infographicType"] = infographic_type
                    post_to_update["infographicTitle"] = title
                    post_to_update["infographicGeneratedAt"] = datetime.utcnow().isoformat() + "Z"
                    save_blog_posts(posts)

                self._stats["images_generated"] += 1
                self._stats["articles_improved"] += 1

                save_accomplishment(EditorAccomplishment(
                    timestamp=datetime.utcnow().isoformat(),
                    article_slug=slug,
                    action_type="infographic_generated",
                    details=f"AI-generated {infographic_type} infographic: {title}",
                    improvement_score=20
                ))
                logger.info(f"[Editor] Generated infographic for {slug}: {result.id}")
            else:
                logger.warning(f"[Editor] Infographic generation failed for {slug}")

        except Exception as e:
            logger.error(f"[Editor] Infographic dispatch error for {slug}: {e}")

    async def _dispatch_image_generation(self, post: Dict[str, Any], image_type: str):
        """Dispatch Image Orchestrator to generate hero images."""
        slug = post.get("slug", "")

        try:
            from services.image_orchestrator import image_orchestrator

            if image_type == "hero":
                result = await image_orchestrator.generate_for_post(slug, force_hero=True)
                if result.get("hero_image"):
                    self._stats["images_generated"] += 1
                    self._stats["articles_improved"] += 1

                    save_accomplishment(EditorAccomplishment(
                        timestamp=datetime.utcnow().isoformat(),
                        article_slug=slug,
                        action_type="hero_image_generated",
                        details=f"Generated hero image: {result['hero_image']}",
                        improvement_score=20
                    ))
                    logger.info(f"Editor: Generated hero image for {slug}")

            elif image_type == "infographic":
                result = await image_orchestrator.generate_for_post(slug, force_infographic=True)
                if result.get("infographic"):
                    self._stats["images_generated"] += 1

                    save_accomplishment(EditorAccomplishment(
                        timestamp=datetime.utcnow().isoformat(),
                        article_slug=slug,
                        action_type="infographic_generated",
                        details=f"Generated infographic: {result['infographic']}",
                        improvement_score=15
                    ))
                    logger.info(f"Editor: Generated infographic for {slug}")

        except Exception as e:
            logger.error(f"Editor failed to generate {image_type} for {slug}: {e}")

    async def improve_article(self, slug: str) -> Dict[str, Any]:
        """
        On-demand improvement of a specific article.

        The Editor reviews and improves one article immediately.
        """
        posts = load_blog_posts()
        post = next((p for p in posts if p.get("slug") == slug), None)

        if not post:
            return {"success": False, "error": f"Article not found: {slug}"}

        report = assess_article_health(post)
        improvements = []

        # Execute recommended actions
        for action in report.recommended_actions:
            if "hero image" in action.lower():
                await self._dispatch_image_generation(post, "hero")
                improvements.append("Generated hero image")

            elif "infographic" in action.lower():
                await self._dispatch_image_generation(post, "infographic")
                improvements.append("Generated infographic")

        # Re-assess after improvements
        posts = load_blog_posts()  # Reload
        post = next((p for p in posts if p.get("slug") == slug), None)
        new_report = assess_article_health(post)

        return {
            "success": True,
            "slug": slug,
            "before_health": report.overall_health,
            "after_health": new_report.overall_health,
            "improvements_made": improvements,
            "remaining_actions": new_report.recommended_actions
        }


# Singleton instance
editor_in_chief = EditorInChief()
