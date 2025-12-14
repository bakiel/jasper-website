"""
JASPER CRM - SEO Agent System

AI-powered SEO agents using DeepSeek models:
- KeywordResearchAgent: R1 for keyword analysis and research
- ContentOptimizer: V3.2 for SEO scoring and optimization
- TechnicalSEOAgent: V3.2 for technical SEO checks

Integrates with KeywordService for existing keyword data.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from services.deepseek_router import deepseek_router, TaskType
from services.keyword_service import keyword_service

logger = logging.getLogger(__name__)


class SEOScore(str, Enum):
    """SEO content score levels"""
    EXCELLENT = "excellent"   # 90-100
    GOOD = "good"             # 70-89
    NEEDS_WORK = "needs_work" # 50-69
    POOR = "poor"             # 0-49


# =============================================================================
# KEYWORD RESEARCH AGENT (DeepSeek R1)
# =============================================================================

class KeywordResearchAgent:
    """
    AI-powered keyword research using DeepSeek R1.

    Capabilities:
    - Keyword analysis and scoring
    - Competitor keyword gap analysis
    - Keyword clustering and grouping
    - Search intent classification
    - Content opportunity identification
    """

    def __init__(self):
        self.router = deepseek_router
        self.keyword_db = keyword_service
        logger.info("KeywordResearchAgent initialized (DeepSeek R1)")

    async def analyze_keyword(self, keyword: str) -> Dict[str, Any]:
        """
        Deep analysis of a single keyword.
        """
        # Check if we have it in our database
        existing = self.keyword_db.search(query=keyword, limit=1)
        existing_data = existing[0] if existing else None

        # AI analysis
        enriched = await self.keyword_db.enrich_keyword(keyword)

        return {
            "keyword": keyword,
            "in_database": existing_data is not None,
            "existing_data": existing_data,
            "ai_analysis": enriched,
            "analyzed_at": datetime.utcnow().isoformat(),
        }

    async def find_opportunities(
        self,
        topic: str,
        category: str = None,
        target_intent: str = None,
    ) -> Dict[str, Any]:
        """
        Find keyword opportunities for a topic.
        """
        # Get recommendations from keyword service
        recommendations = await self.keyword_db.recommend_for_topic(
            topic=topic,
            category=category,
            count=15,
        )

        # Additional AI analysis for prioritization
        prompt = f"""Prioritize these keywords for a DFI consulting firm:

TOPIC: {topic}
EXISTING KEYWORDS: {[kw['keyword'] for kw in recommendations.get('existing_matches', [])[:10]]}
AI SUGGESTIONS: {recommendations.get('ai_suggestions', {})}

Rank by:
1. Commercial intent (leads to consulting inquiries)
2. Achievable difficulty (can rank within 6 months)
3. Relevance to JASPER's DFI funding services

Provide JSON:
{{
    "priority_keywords": ["<top 5 to target immediately>"],
    "quick_wins": ["<low difficulty, decent volume>"],
    "long_term_targets": ["<high value but harder>"],
    "content_strategy": "<how to use these keywords>",
    "estimated_traffic_potential": "<monthly visits if ranked>"
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=500,
            temperature=0.4,
        )

        prioritization = {}
        if result.get("content"):
            try:
                import json
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                prioritization = json.loads(content.strip())
            except:
                pass

        return {
            "topic": topic,
            "category": category,
            "recommendations": recommendations,
            "prioritization": prioritization,
        }

    async def cluster_keywords(
        self,
        keywords: List[str],
    ) -> Dict[str, Any]:
        """
        Group keywords into semantic clusters for content planning.
        """
        prompt = f"""Cluster these keywords into topic groups for content planning:

KEYWORDS:
{keywords[:30]}

CONTEXT: DFI/infrastructure finance consulting in Africa

Group by semantic similarity and search intent. Provide JSON:
{{
    "clusters": [
        {{
            "name": "<cluster name>",
            "keywords": ["<keywords in this cluster>"],
            "intent": "informational|commercial|transactional",
            "content_type": "pillar-page|blog|landing-page|guide",
            "priority": "high|medium|low"
        }}
    ],
    "unclustered": ["<keywords that don't fit>"],
    "pillar_content_opportunities": ["<main topics for pillar pages>"]
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=800,
            temperature=0.3,
        )

        if result.get("content"):
            try:
                import json
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                return json.loads(content.strip())
            except:
                pass

        return {"clusters": [], "error": "Could not cluster keywords"}


# =============================================================================
# CONTENT OPTIMIZER AGENT (DeepSeek V3.2)
# =============================================================================

class ContentOptimizer:
    """
    AI-powered content SEO optimization using DeepSeek V3.2.

    Capabilities:
    - SEO score calculation
    - Content optimization suggestions
    - Title/meta tag generation
    - Keyword density analysis
    - Readability improvements
    - Schema markup suggestions
    """

    def __init__(self):
        self.router = deepseek_router
        self.keyword_db = keyword_service
        logger.info("ContentOptimizer initialized (DeepSeek V3.2)")

    async def score_content(
        self,
        content: str,
        target_keywords: List[str],
        content_type: str = "blog",
    ) -> Dict[str, Any]:
        """
        Calculate SEO score for content.
        """
        # Basic metrics
        word_count = len(content.split())
        content_lower = content.lower()

        keyword_density = {}
        for kw in target_keywords:
            count = content_lower.count(kw.lower())
            density = (count / word_count) * 100 if word_count > 0 else 0
            keyword_density[kw] = {
                "count": count,
                "density": round(density, 2),
            }

        # AI-powered analysis
        prompt = f"""Score this content for SEO (0-100):

CONTENT ({word_count} words):
{content[:3000]}...

TARGET KEYWORDS: {target_keywords}
CONTENT TYPE: {content_type}

Score based on:
1. Keyword usage (natural, not stuffed)
2. Structure (headings, paragraphs)
3. Readability (clear, professional)
4. Value (helpful for DFI funding seekers)
5. Call-to-action presence

Provide JSON:
{{
    "overall_score": <0-100>,
    "score_breakdown": {{
        "keyword_optimization": <0-100>,
        "content_structure": <0-100>,
        "readability": <0-100>,
        "value_proposition": <0-100>,
        "cta_effectiveness": <0-100>
    }},
    "strengths": ["<what's working well>"],
    "improvements": ["<specific changes to make>"],
    "missing_elements": ["<what should be added>"],
    "suggested_headings": ["<H2 headings to add>"],
    "meta_title": "<optimized title 60 chars>",
    "meta_description": "<optimized description 155 chars>"
}}"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=800,
            temperature=0.3,
        )

        analysis = {
            "word_count": word_count,
            "target_keywords": target_keywords,
            "keyword_density": keyword_density,
        }

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                analysis["ai_analysis"] = json.loads(resp.strip())

                # Determine score level
                score = analysis["ai_analysis"].get("overall_score", 0)
                if score >= 90:
                    analysis["score_level"] = SEOScore.EXCELLENT.value
                elif score >= 70:
                    analysis["score_level"] = SEOScore.GOOD.value
                elif score >= 50:
                    analysis["score_level"] = SEOScore.NEEDS_WORK.value
                else:
                    analysis["score_level"] = SEOScore.POOR.value
            except:
                analysis["ai_analysis"] = {"error": "Could not analyze"}

        return analysis

    async def optimize_content(
        self,
        content: str,
        target_keywords: List[str],
        optimization_level: str = "moderate",
    ) -> Dict[str, Any]:
        """
        Generate optimized version of content.
        """
        prompt = f"""Optimize this content for SEO while maintaining quality:

ORIGINAL CONTENT:
{content[:4000]}

TARGET KEYWORDS: {target_keywords}
OPTIMIZATION LEVEL: {optimization_level} (light/moderate/aggressive)

Guidelines:
- Naturally incorporate keywords (1-2% density)
- Improve structure with clear H2/H3 headings
- Add internal linking opportunities [Link: topic]
- Enhance readability for business professionals
- Keep JASPER's professional DFI consulting voice

Provide JSON:
{{
    "optimized_content": "<full optimized content>",
    "changes_made": ["<list of changes>"],
    "keywords_added": {{"<keyword>": <count>}},
    "new_word_count": <number>,
    "estimated_score_improvement": "<X points>"
}}"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=4000,
            temperature=0.4,
        )

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                return json.loads(resp.strip())
            except:
                # Return raw content if not JSON
                return {
                    "optimized_content": result["content"],
                    "changes_made": ["AI optimization applied"],
                }

        return {"error": "Optimization failed"}

    async def generate_meta_tags(
        self,
        content: str,
        target_keywords: List[str],
        page_type: str = "blog",
    ) -> Dict[str, Any]:
        """
        Generate SEO meta tags for content.
        """
        prompt = f"""Generate SEO meta tags for this content:

CONTENT SUMMARY:
{content[:1500]}

TARGET KEYWORDS: {target_keywords}
PAGE TYPE: {page_type}

Generate optimized meta tags. Provide JSON:
{{
    "title": "<60 chars, keyword-rich, compelling>",
    "description": "<155 chars, includes CTA>",
    "og_title": "<Open Graph title>",
    "og_description": "<Open Graph description>",
    "twitter_title": "<Twitter card title>",
    "twitter_description": "<Twitter card description>",
    "keywords": ["<meta keywords>"],
    "canonical_slug": "<url-friendly-slug>",
    "schema_type": "<Article|BlogPosting|WebPage|FAQPage>"
}}"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=500,
            temperature=0.3,
        )

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                return json.loads(resp.strip())
            except:
                pass

        return {"error": "Could not generate meta tags"}

    async def generate_schema(
        self,
        content_data: Dict[str, Any],
        schema_type: str = "Article",
    ) -> Dict[str, Any]:
        """
        Generate JSON-LD schema markup.
        """
        prompt = f"""Generate JSON-LD schema markup for:

CONTENT DATA:
- Title: {content_data.get('title', '')}
- Description: {content_data.get('description', '')}
- Author: {content_data.get('author', 'JASPER Financial Architecture')}
- Date: {content_data.get('date', datetime.utcnow().isoformat())}
- Category: {content_data.get('category', 'DFI Insights')}

SCHEMA TYPE: {schema_type}

Generate valid JSON-LD. Provide the schema object only (no markdown):"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=600,
            temperature=0.2,
        )

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                return {
                    "schema_type": schema_type,
                    "json_ld": json.loads(resp.strip()),
                }
            except:
                pass

        return {"error": "Could not generate schema"}


# =============================================================================
# TECHNICAL SEO AGENT (DeepSeek V3.2)
# =============================================================================

class TechnicalSEOAgent:
    """
    Technical SEO analysis and recommendations.

    Capabilities:
    - Page structure analysis
    - Internal linking suggestions
    - Site architecture recommendations
    - Performance considerations
    """

    def __init__(self):
        self.router = deepseek_router
        logger.info("TechnicalSEOAgent initialized (DeepSeek V3.2)")

    async def analyze_page_structure(
        self,
        html_content: str = None,
        page_url: str = None,
    ) -> Dict[str, Any]:
        """
        Analyze page HTML structure for SEO issues.
        """
        prompt = f"""Analyze this page for technical SEO issues:

{f"URL: {page_url}" if page_url else ""}
{f"HTML SNIPPET: {html_content[:2000]}" if html_content else ""}

Check for:
1. Heading hierarchy (H1, H2, H3 structure)
2. Image alt text presence
3. Internal/external link balance
4. Schema markup opportunities
5. Mobile-friendliness indicators
6. Page load optimization hints

Provide JSON:
{{
    "issues": [
        {{"severity": "high|medium|low", "issue": "<description>", "fix": "<solution>"}}
    ],
    "opportunities": ["<SEO improvement opportunities>"],
    "score": <technical SEO score 0-100>,
    "priority_fixes": ["<top 3 things to fix first>"]
}}"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=600,
            temperature=0.3,
        )

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                return json.loads(resp.strip())
            except:
                pass

        return {"error": "Could not analyze structure"}

    async def suggest_internal_links(
        self,
        current_content: str,
        available_pages: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Suggest internal linking opportunities.

        Args:
            current_content: The content being edited
            available_pages: List of {title, url, keywords} for existing pages
        """
        prompt = f"""Suggest internal links for this content:

CURRENT CONTENT:
{current_content[:2000]}

AVAILABLE PAGES TO LINK TO:
{available_pages[:20]}

Identify natural linking opportunities. Provide JSON:
{{
    "suggested_links": [
        {{
            "anchor_text": "<text to make link>",
            "target_url": "<page to link to>",
            "context": "<sentence where link fits>",
            "relevance": "high|medium"
        }}
    ],
    "pillar_page_opportunity": "<should this link to/from a pillar page?>",
    "link_density_recommendation": "<how many internal links to add>"
}}"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=500,
            temperature=0.3,
        )

        if result.get("content"):
            try:
                import json
                resp = result["content"]
                if "```json" in resp:
                    resp = resp.split("```json")[1].split("```")[0]
                elif "```" in resp:
                    resp = resp.split("```")[1].split("```")[0]
                return json.loads(resp.strip())
            except:
                pass

        return {"error": "Could not suggest links"}


# =============================================================================
# SINGLETON INSTANCES
# =============================================================================

keyword_research_agent = KeywordResearchAgent()
content_optimizer = ContentOptimizer()
technical_seo_agent = TechnicalSEOAgent()
