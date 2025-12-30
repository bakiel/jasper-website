"""
JASPER Auto Publisher Agent
Automatically generates, optimizes, and publishes blog articles.

Process:
1. Generate article with AI
2. Check SEO score
3. If below 70%, use AI to optimize content (up to 3 times)
4. If reaches 70%+, auto-publish
5. Log results

Schedule: Can be run via cron or APScheduler
"""

import asyncio
import logging
import random
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Topic pool for auto-generation
TOPIC_POOL = [
    {
        "topic": "Container Farming: A New Frontier for DFI Investment in African Food Security",
        "category": "Agri-Industrial",
        "keywords": ["container farming", "DFI funding", "food security", "hydroponics", "SDG alignment"]
    },
    {
        "topic": "How DFIs Are Financing Renewable Energy Projects in Sub-Saharan Africa",
        "category": "Renewable Energy",
        "keywords": ["renewable energy", "DFI funding", "solar power", "wind energy", "Africa"]
    },
    {
        "topic": "Data Centre Investment in Africa: A DFI Perspective",
        "category": "Data Centres",
        "keywords": ["data centres", "DFI investment", "digital infrastructure", "Africa"]
    },
    {
        "topic": "Climate Finance Opportunities for African Infrastructure",
        "category": "Climate Finance",
        "keywords": ["climate finance", "green bonds", "sustainable infrastructure", "Africa"]
    },
    {
        "topic": "Understanding IDC Funding Requirements for South African Projects",
        "category": "DFI Insights",
        "keywords": ["IDC", "funding requirements", "South Africa", "project finance"]
    },
    {
        "topic": "Blended Finance Structures: Combining DFI Loans with Commercial Capital",
        "category": "DFI Insights",
        "keywords": ["blended finance", "DFI", "commercial capital", "project structuring"]
    },
    {
        "topic": "AgriTech Investments: Why DFIs Are Betting on Smart Farming in Africa",
        "category": "Agri-Industrial",
        "keywords": ["agritech", "smart farming", "food security", "DFI investment"]
    },
    {
        "topic": "Private Equity in African Infrastructure: Trends for 2025",
        "category": "Private Equity",
        "keywords": ["private equity", "infrastructure", "Africa", "investment trends"]
    },
]

MIN_SEO_SCORE = 70
MAX_OPTIMIZATION_ATTEMPTS = 3


class AutoPublisher:
    """Automated blog generation and publishing agent with AI SEO optimization."""
    
    def __init__(self):
        # Import here to avoid circular imports
        from services.blog_service import blog_service
        from services.seo_scorer import seo_scorer
        
        self.blog_service = blog_service
        self.seo_scorer = seo_scorer
        self.published_topics = set()
    
    async def run(self, topic_override: Dict = None) -> Dict[str, Any]:
        """
        Main entry point - generate and publish one article.
        
        Args:
            topic_override: Optional specific topic to use instead of random
        
        Returns:
            Result dict with success status and details
        """
        try:
            # Select topic
            if topic_override:
                topic_config = topic_override
            else:
                topic_config = self._select_topic()
            
            if not topic_config:
                return {"success": False, "error": "No available topics"}
            
            logger.info(f"Auto-publishing: {topic_config['topic']}")
            
            # Step 1: Generate article
            result = await self.blog_service.generate_post(
                topic=topic_config["topic"],
                category=topic_config["category"],
                keywords=topic_config["keywords"],
                tone="professional",
                target_audience="DFI investment officers and project sponsors"
            )
            
            if not result.get("success"):
                return {"success": False, "error": f"Generation failed: {result.get('error')}"}
            
            post = result["post"]
            slug = post.get("slug")
            seo_score = post.get("seo", {}).get("score", 0)
            focus_keyword = topic_config["keywords"][0] if topic_config["keywords"] else None
            
            logger.info(f"Generated: {slug} (Initial SEO: {seo_score}%)")
            
            # Step 2: AI-powered SEO Optimization if needed
            attempts = 0
            optimization_log = []
            
            while seo_score < MIN_SEO_SCORE and attempts < MAX_OPTIMIZATION_ATTEMPTS:
                attempts += 1
                old_score = seo_score
                logger.info(f"AI SEO optimization (attempt {attempts}/{MAX_OPTIMIZATION_ATTEMPTS})...")
                
                # Use AI-powered content optimizer
                opt_result = await self.blog_service.optimize_seo(
                    slug=slug,
                    focus_keyword=focus_keyword,
                    user_id="auto_publisher"
                )
                
                if opt_result.get("success"):
                    seo_score = opt_result.get("new_score", seo_score)
                    optimization_log.append({
                        "attempt": attempts,
                        "old_score": old_score,
                        "new_score": seo_score,
                        "improvements": opt_result.get("improvements", [])
                    })
                    logger.info(f"After AI optimization: SEO {old_score}% -> {seo_score}%")
                else:
                    logger.warning(f"Optimization attempt {attempts} failed: {opt_result.get('error')}")
                    optimization_log.append({
                        "attempt": attempts,
                        "error": opt_result.get("error", "Unknown error")
                    })
                
                if seo_score >= MIN_SEO_SCORE:
                    break
            
            # Step 3: Publish based on final score
            final_status = "pending"
            publish_method = ""
            
            if seo_score >= MIN_SEO_SCORE:
                # Quality threshold met - normal publish
                pub_result = await self.blog_service.publish_post(slug, auto_share=False)
                publish_method = "standard"
                
                if pub_result and pub_result.get("status") == "published":
                    final_status = "published"
                    self.published_topics.add(topic_config["topic"])
                else:
                    final_status = "publish_failed"
            else:
                # Below threshold after max attempts - force publish with warning
                logger.warning(f"SEO {seo_score}% still below {MIN_SEO_SCORE}% after {attempts} optimizations - force publishing")
                pub_result = await self.blog_service.publish_post(slug, force=True)
                publish_method = "forced"
                
                if pub_result and pub_result.get("status") == "published":
                    final_status = "published_forced"
                    self.published_topics.add(topic_config["topic"])
                else:
                    final_status = "publish_failed"
            
            return {
                "success": final_status in ["published", "published_forced"],
                "slug": slug,
                "title": post.get("title"),
                "category": topic_config["category"],
                "seo_score": seo_score,
                "min_required": MIN_SEO_SCORE,
                "optimization_attempts": attempts,
                "optimization_log": optimization_log,
                "status": final_status,
                "publish_method": publish_method,
                "url": f"https://jasperfinance.org/insights/{slug}",
                "timestamp": datetime.utcnow().isoformat()
            }
                
        except Exception as e:
            logger.error(f"Auto-publish failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _select_topic(self) -> Optional[Dict]:
        """Select a random topic that hasn't been published recently."""
        available = [t for t in TOPIC_POOL if t["topic"] not in self.published_topics]
        if not available:
            # Reset if all topics used
            self.published_topics.clear()
            available = TOPIC_POOL
        return random.choice(available) if available else None


# Singleton
auto_publisher = AutoPublisher()


async def publish_one_article(topic: Dict = None) -> Dict[str, Any]:
    """Convenience function to publish one article."""
    return await auto_publisher.run(topic)


if __name__ == "__main__":
    # Test run
    import asyncio
    result = asyncio.run(publish_one_article())
    print(result)
