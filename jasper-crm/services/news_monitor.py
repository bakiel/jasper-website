"""
JASPER News Monitor Service
Monitors DFI announcements, policy changes, and sector news for SEO content opportunities.
Auto-generates and publishes timely content to capture search traffic.
"""

import os
import re
import json
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
import httpx
import feedparser
from services.logging_service import get_logger

logger = get_logger(__name__)


class NewsCategory(str, Enum):
    DFI_ANNOUNCEMENT = "dfi_announcement"
    POLICY_CHANGE = "policy_change"
    MAJOR_DEAL = "major_deal"
    SECTOR_NEWS = "sector_news"
    FUNDING_WINDOW = "funding_window"


@dataclass
class NewsItem:
    """A news item detected from RSS feeds"""
    id: str
    title: str
    summary: str
    link: str
    source: str
    category: NewsCategory
    published_at: datetime
    relevance_score: float = 0.0
    keywords: List[str] = field(default_factory=list)
    processed: bool = False
    content_generated: bool = False
    blog_post_id: Optional[str] = None


# RSS Feed Sources for JASPER
NEWS_SOURCES = {
    # DFI News
    "ifc": {
        "name": "IFC Press Releases",
        "url": "https://pressroom.ifc.org/all/pages/RSSFeedsMgmt.aspx?RID=RSS_IFC_PRESSRELEASES",
        "category": NewsCategory.DFI_ANNOUNCEMENT,
        "keywords": ["africa", "infrastructure", "climate", "investment", "fund", "financing"]
    },
    "afdb": {
        "name": "African Development Bank",
        "url": "https://www.afdb.org/en/news-and-events/rss-feeds",
        "category": NewsCategory.DFI_ANNOUNCEMENT,
        "keywords": ["south africa", "infrastructure", "energy", "agriculture", "financing"]
    },
    "worldbank": {
        "name": "World Bank Africa",
        "url": "https://www.worldbank.org/en/news/rss/africa",
        "category": NewsCategory.DFI_ANNOUNCEMENT,
        "keywords": ["south africa", "infrastructure", "development", "financing"]
    },

    # Sector News - Energy
    "esi_africa": {
        "name": "ESI Africa",
        "url": "https://www.esi-africa.com/feed/",
        "category": NewsCategory.SECTOR_NEWS,
        "keywords": ["renewable", "energy", "solar", "wind", "IPP", "REIPPP", "eskom"]
    },
    "engineering_news": {
        "name": "Engineering News",
        "url": "https://www.engineeringnews.co.za/rss/",
        "category": NewsCategory.SECTOR_NEWS,
        "keywords": ["infrastructure", "mining", "energy", "manufacturing", "construction"]
    },

    # Policy / Government
    "sa_gov_news": {
        "name": "SA Government News",
        "url": "https://www.gov.za/rss/news",
        "category": NewsCategory.POLICY_CHANGE,
        "keywords": ["budget", "infrastructure", "investment", "energy", "agriculture", "treasury"]
    },

    # Agriculture
    "farmers_weekly": {
        "name": "Farmer's Weekly",
        "url": "https://www.farmersweekly.co.za/feed/",
        "category": NewsCategory.SECTOR_NEWS,
        "keywords": ["agriculture", "farming", "agri", "land", "irrigation", "export"]
    },

    # General Business
    "biznews": {
        "name": "BizNews",
        "url": "https://www.biznews.com/feed",
        "category": NewsCategory.SECTOR_NEWS,
        "keywords": ["investment", "funding", "IPO", "deal", "acquisition", "infrastructure"]
    },
}

# Keywords that indicate high-value content opportunities
HIGH_VALUE_KEYWORDS = [
    # DFI specific
    "ifc", "world bank", "afdb", "african development bank", "idc", "dbsa",
    "development finance", "dfi", "climate fund", "green fund",

    # Funding related
    "funding", "investment", "capital", "financing", "grant", "loan",
    "million", "billion", "fund launch", "fund announcement",

    # Sector specific
    "renewable energy", "solar", "wind", "reippp", "ipp",
    "infrastructure", "agriculture", "agri-processing", "manufacturing",

    # South Africa specific
    "south africa", "treasury", "budget", "policy", "tariff",

    # Actions
    "announces", "launches", "opens", "deadline", "application", "bid"
]


class NewsMonitorService:
    """
    Monitors news sources for JASPER-relevant content opportunities.
    Automatically generates SEO-optimized content for timely topics.
    """

    def __init__(self):
        self.sources = NEWS_SOURCES
        self.processed_items: Dict[str, NewsItem] = {}
        self.blog_api_url = os.getenv("BLOG_API_URL", "https://api.jasperfinance.org/api/blog")
        self.blog_api_key = os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key")
        self.content_api_url = "http://localhost:8001/api/v1/content"
        self._running = False
        self._check_interval = 3600  # 1 hour default

    def _generate_item_id(self, link: str, title: str) -> str:
        """Generate unique ID for news item"""
        content = f"{link}:{title}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def _calculate_relevance(self, title: str, summary: str, source_keywords: List[str]) -> float:
        """Calculate relevance score (0-100) based on keyword matching"""
        text = f"{title} {summary}".lower()

        score = 0.0
        matched_keywords = []

        # Check high-value keywords (weight: 10 each)
        for kw in HIGH_VALUE_KEYWORDS:
            if kw.lower() in text:
                score += 10
                matched_keywords.append(kw)

        # Check source-specific keywords (weight: 5 each)
        for kw in source_keywords:
            if kw.lower() in text:
                score += 5
                matched_keywords.append(kw)

        # Bonus for multiple DFI mentions
        dfi_count = sum(1 for dfi in ["ifc", "afdb", "idc", "dbsa", "world bank"] if dfi in text)
        if dfi_count > 1:
            score += 15

        # Bonus for funding amounts
        if re.search(r'\$?\d+\s*(million|billion|m|bn)', text, re.I):
            score += 20

        # Cap at 100
        return min(score, 100.0), matched_keywords

    async def fetch_feed(self, source_id: str, source_config: dict) -> List[NewsItem]:
        """Fetch and parse RSS feed"""
        items = []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(source_config["url"])
                if response.status_code != 200:
                    logger.warning(f"Failed to fetch {source_id}: {response.status_code}")
                    return items

                feed = feedparser.parse(response.text)

                for entry in feed.entries[:20]:  # Last 20 items
                    title = entry.get("title", "")
                    summary = entry.get("summary", entry.get("description", ""))
                    link = entry.get("link", "")

                    # Parse published date
                    published = entry.get("published_parsed") or entry.get("updated_parsed")
                    if published:
                        published_at = datetime(*published[:6])
                    else:
                        published_at = datetime.now()

                    # Skip old news (> 7 days)
                    if datetime.now() - published_at > timedelta(days=7):
                        continue

                    # Calculate relevance
                    relevance, keywords = self._calculate_relevance(
                        title, summary, source_config.get("keywords", [])
                    )

                    # Only include if relevance > 30
                    if relevance >= 30:
                        item_id = self._generate_item_id(link, title)

                        item = NewsItem(
                            id=item_id,
                            title=title,
                            summary=summary[:500],
                            link=link,
                            source=source_config["name"],
                            category=source_config["category"],
                            published_at=published_at,
                            relevance_score=relevance,
                            keywords=keywords
                        )
                        items.append(item)

                logger.info(f"Fetched {len(items)} relevant items from {source_id}")

        except Exception as e:
            logger.error(f"Error fetching {source_id}: {e}")

        return items

    async def scan_all_sources(self) -> List[NewsItem]:
        """Scan all configured news sources"""
        all_items = []

        tasks = [
            self.fetch_feed(source_id, config)
            for source_id, config in self.sources.items()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_items.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Feed fetch error: {result}")

        # Sort by relevance
        all_items.sort(key=lambda x: x.relevance_score, reverse=True)

        # Filter out already processed
        new_items = [
            item for item in all_items
            if item.id not in self.processed_items
        ]

        logger.info(f"Found {len(new_items)} new relevant news items")
        return new_items

    async def generate_content_for_news(self, item: NewsItem) -> Optional[Dict]:
        """Generate SEO-optimized content for a news item"""

        # Build prompt for content generation
        prompt = f"""Write a professional blog post about this news for JASPER Finance audience.

NEWS: {item.title}
SUMMARY: {item.summary}
SOURCE: {item.source}

REQUIREMENTS:
1. Title format: "[Topic]: What Your Project Needs to Know" or "How [News] Affects DFI Funding Applications"
2. Include practical implications for businesses seeking funding
3. Explain what this means for financial modelling
4. Include specific requirements or criteria if mentioned
5. Add a clear CTA for JASPER's services
6. Target keywords: {', '.join(item.keywords[:5])}

TONE: Professional, authoritative, helpful
LENGTH: 800-1200 words
"""

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.content_api_url}/generate-seo-optimized",
                    json={
                        "topic": item.title,
                        "category": self._map_category(item.category),
                        "target_keywords": item.keywords[:5],
                        "custom_prompt": prompt,
                        "auto_publish": False  # Review first
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Generated content for: {item.title[:50]}...")
                    return result
                else:
                    logger.error(f"Content generation failed: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return None

    def _map_category(self, news_category: NewsCategory) -> str:
        """Map news category to blog category"""
        mapping = {
            NewsCategory.DFI_ANNOUNCEMENT: "DFI Insights",
            NewsCategory.POLICY_CHANGE: "Industry News",
            NewsCategory.MAJOR_DEAL: "Case Studies",
            NewsCategory.SECTOR_NEWS: "Sector Analysis",
            NewsCategory.FUNDING_WINDOW: "DFI Insights",
        }
        return mapping.get(news_category, "Industry News")

    async def publish_content(self, content: Dict, item: NewsItem) -> Optional[str]:
        """Publish content to blog API"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.blog_api_url}/auto-post",
                    headers={
                        "X-AI-API-Key": self.blog_api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "title": content.get("title", item.title),
                        "content": content.get("content", ""),
                        "excerpt": content.get("excerpt", item.summary[:200]),
                        "category": self._map_category(item.category),
                        "tags": item.keywords[:5] + ["current-events", "timely"],
                        "seoTitle": content.get("seo_title"),
                        "seoDescription": content.get("seo_description"),
                        "publishImmediately": False,  # Save as draft for review
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    post_id = result.get("post", {}).get("id")
                    logger.info(f"Published draft: {post_id}")
                    return post_id
                else:
                    logger.error(f"Publish failed: {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error publishing: {e}")
            return None

    async def process_news_item(self, item: NewsItem) -> bool:
        """Process a single news item: generate content and publish"""

        # Skip if already processed
        if item.id in self.processed_items:
            return False

        logger.info(f"Processing: {item.title[:60]}... (relevance: {item.relevance_score})")

        # Generate content
        content = await self.generate_content_for_news(item)
        if not content:
            item.processed = True
            self.processed_items[item.id] = item
            return False

        # Publish to blog
        post_id = await self.publish_content(content, item)

        item.processed = True
        item.content_generated = content is not None
        item.blog_post_id = post_id
        self.processed_items[item.id] = item

        return post_id is not None

    async def run_scan_cycle(self, max_posts: int = 3) -> Dict[str, Any]:
        """Run a complete scan cycle"""
        logger.info("Starting news scan cycle...")

        # Scan all sources
        items = await self.scan_all_sources()

        # Process top items (by relevance)
        processed_count = 0
        results = []

        for item in items[:max_posts]:
            if item.relevance_score >= 50:  # Only high-relevance items
                success = await self.process_news_item(item)
                if success:
                    processed_count += 1
                    results.append({
                        "title": item.title,
                        "source": item.source,
                        "relevance": item.relevance_score,
                        "post_id": item.blog_post_id
                    })

        summary = {
            "scan_time": datetime.now().isoformat(),
            "items_found": len(items),
            "items_processed": processed_count,
            "results": results
        }

        logger.info(f"Scan complete: {processed_count} posts generated from {len(items)} items")
        return summary

    def get_status(self) -> Dict[str, Any]:
        """Get current monitor status"""
        return {
            "running": self._running,
            "sources_count": len(self.sources),
            "processed_items": len(self.processed_items),
            "check_interval_hours": self._check_interval / 3600,
            "sources": list(self.sources.keys())
        }

    def get_recent_items(self, limit: int = 10) -> List[Dict]:
        """Get recently processed items"""
        items = sorted(
            self.processed_items.values(),
            key=lambda x: x.published_at,
            reverse=True
        )[:limit]

        return [asdict(item) for item in items]


# Singleton instance
news_monitor = NewsMonitorService()
