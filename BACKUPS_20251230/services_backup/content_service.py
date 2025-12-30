"""
JASPER CRM - Content Generation Service

Connects CRM insights to blog/content marketing via DeepSeek V3.2.
Works with the AgenticBrain to generate SEO-optimized content.

Features:
- AI-powered blog post generation
- SEO keyword optimization via KeywordService
- CRM insight-driven content suggestions
- Auto-publish to JASPER blog API
- Integration with SEO agents for optimization
"""

import os
import random
import httpx
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from services.keyword_service import keyword_service

logger = logging.getLogger(__name__)


class ContentService:
    """
    AI-powered content generation service.

    Uses DeepSeek V3.2 for long-form content generation and
    integrates with the blog API for publishing.

    Now powered by KeywordService for enhanced SEO capabilities.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = "deepseek/deepseek-chat"  # V3.2 - best for long-form
        self.base_url = "https://openrouter.ai/api/v1"

        # Blog API config
        self.blog_api_url = os.getenv("BLOG_API_URL", "http://localhost:3000/api/blog")
        self.blog_api_key = os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key")

        # Use KeywordService for SEO keywords
        self.keyword_service = keyword_service
        self.seo_keywords = self._load_keywords_from_service()

        logger.info(f"ContentService initialized with {len(self.seo_keywords)} SEO keywords from KeywordService")

    def _load_keywords_from_service(self) -> List[Dict[str, Any]]:
        """Load SEO keywords from KeywordService."""
        return self.keyword_service.keywords

    async def generate_blog_post(
        self,
        topic: str,
        category: str,
        seo_keywords: List[str] = None,
        lead_context: Dict[str, Any] = None,
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate a complete blog post using DeepSeek V3.2.

        Args:
            topic: The blog post topic/title
            category: Blog category (dfi-insights, financial-modeling, etc.)
            seo_keywords: Target SEO keywords
            lead_context: Optional CRM context for personalization
            tone: Writing tone (professional, educational, thought-leadership)

        Returns:
            Dict with title, content, excerpt, seoTitle, seoDescription, tags
        """
        if not self.api_key:
            return {"error": "OPENROUTER_API_KEY not configured"}

        # Auto-select SEO keywords if not provided
        if not seo_keywords:
            seo_keywords = self._select_seo_keywords(topic, category)

        system_prompt = self._build_content_system_prompt(category, tone)
        user_prompt = self._build_content_user_prompt(topic, seo_keywords, lead_context)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER Content Service",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 4000,
                    },
                    timeout=120.0,  # Long-form content takes time
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]

                    # Parse the generated content
                    parsed = self._parse_blog_content(content, topic, seo_keywords)
                    parsed["model"] = self.model
                    parsed["generated_at"] = datetime.utcnow().isoformat()

                    return parsed
                else:
                    return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Content generation failed: {e}")
            return {"error": str(e)}

    # Category mapping from internal names to Blog API format
    CATEGORY_MAP = {
        "dfi-insights": "DFI Insights",
        "financial-modeling": "Financial Modelling",
        "financial-modelling": "Financial Modelling",
        "sector-analysis": "Sector Analysis",
        "case-studies": "Case Studies",
        "industry-news": "Industry News",
        "infrastructure-finance": "DFI Insights",
        # Fallback for any other category
    }

    async def publish_blog_post(
        self,
        title: str,
        content: str,
        category: str,
        tags: List[str] = None,
        seo_title: str = None,
        seo_description: str = None,
        publish_immediately: bool = False
    ) -> Dict[str, Any]:
        """
        Publish a blog post via the JASPER blog API.

        Args:
            title: Blog post title
            content: HTML/Markdown content
            category: Blog category
            tags: List of tags
            seo_title: SEO-optimized title
            seo_description: Meta description
            publish_immediately: Whether to publish or save as draft

        Returns:
            API response with post ID and status
        """
        # Map category to Blog API format
        blog_category = self.CATEGORY_MAP.get(category.lower(), "DFI Insights")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.blog_api_url}/auto-post",
                    headers={
                        "X-AI-API-Key": self.blog_api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "title": title,
                        "content": content,
                        "category": blog_category,
                        "tags": tags or [],
                        "seoTitle": seo_title or title,
                        "seoDescription": seo_description or "",
                        "publishImmediately": publish_immediately
                    },
                    timeout=30.0
                )

                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "data": response.json(),
                        "published": publish_immediately
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "detail": response.text
                    }

        except Exception as e:
            logger.error(f"Blog publish failed: {e}")
            return {"success": False, "error": str(e)}

    async def generate_and_publish(
        self,
        topic: str,
        category: str,
        seo_keywords: List[str] = None,
        lead_context: Dict[str, Any] = None,
        publish_immediately: bool = False
    ) -> Dict[str, Any]:
        """
        Generate and publish a blog post in one call.

        This is the main method called by the AgenticBrain's create_blog_post tool.
        """
        # Generate content
        generated = await self.generate_blog_post(
            topic=topic,
            category=category,
            seo_keywords=seo_keywords,
            lead_context=lead_context
        )

        if "error" in generated:
            return generated

        # Publish
        result = await self.publish_blog_post(
            title=generated.get("title", topic),
            content=generated.get("content", ""),
            category=category,
            tags=generated.get("tags", seo_keywords),
            seo_title=generated.get("seoTitle"),
            seo_description=generated.get("seoDescription"),
            publish_immediately=publish_immediately
        )

        result["generated"] = generated
        return result

    def suggest_content_from_crm(
        self,
        lead_data: Dict[str, Any] = None,
        recent_leads_sectors: List[str] = None,
        trending_questions: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Suggest blog topics based on CRM insights.

        Analyzes lead patterns to suggest relevant content.
        """
        suggestions = []

        # Sector-based suggestions
        if recent_leads_sectors:
            sector_counts = {}
            for sector in recent_leads_sectors:
                sector_counts[sector] = sector_counts.get(sector, 0) + 1

            top_sectors = sorted(sector_counts.items(), key=lambda x: x[1], reverse=True)[:3]

            for sector, count in top_sectors:
                suggestions.append({
                    "topic": f"How DFIs Are Funding {sector.title()} Projects in South Africa",
                    "category": "dfi-insights",
                    "reasoning": f"High lead volume from {sector} sector ({count} recent leads)",
                    "priority": "high" if count > 5 else "medium"
                })

        # Question-based suggestions
        if trending_questions:
            for question in trending_questions[:3]:
                suggestions.append({
                    "topic": question,
                    "category": "financial-modeling",
                    "reasoning": "Common question from leads",
                    "priority": "medium"
                })

        # SEO opportunity suggestions
        high_volume_keywords = [
            kw for kw in self.seo_keywords
            if kw.get("volume", 0) > 1000 and kw.get("difficulty", 100) < 40
        ]

        if high_volume_keywords:
            selected = random.sample(high_volume_keywords, min(2, len(high_volume_keywords)))
            for kw in selected:
                suggestions.append({
                    "topic": f"Complete Guide to {kw['keyword'].title()}",
                    "category": kw.get("category", "infrastructure-finance"),
                    "reasoning": f"High volume ({kw['volume']}) low difficulty ({kw['difficulty']}) keyword",
                    "priority": "high",
                    "seo_keywords": [kw["keyword"]]
                })

        return suggestions

    def _select_seo_keywords(self, topic: str, category: str) -> List[str]:
        """Auto-select relevant SEO keywords for a topic."""
        topic_lower = topic.lower()

        # Find keywords that match the topic
        relevant = []
        for kw in self.seo_keywords:
            keyword = kw.get("keyword", "").lower()
            if any(word in keyword for word in topic_lower.split()):
                relevant.append(kw)
            elif kw.get("category", "").lower() == category.lower():
                relevant.append(kw)

        # Sort by volume/difficulty ratio
        relevant.sort(key=lambda x: x.get("volume", 0) / max(x.get("difficulty", 50), 1), reverse=True)

        # Return top 5 keyword strings
        return [kw["keyword"] for kw in relevant[:5]]

    def _build_content_system_prompt(self, category: str, tone: str) -> str:
        """Build the system prompt for content generation."""
        category_contexts = {
            "dfi-insights": "Development Finance Institutions (DFIs) like IDC, DBSA, IFC, and AfDB",
            "financial-modeling": "Financial modeling for infrastructure and project finance",
            "infrastructure-finance": "Infrastructure project financing in Africa",
            "case-studies": "Real-world project finance case studies",
            "industry-news": "Latest developments in development finance",
        }

        context = category_contexts.get(category, "financial services and consulting")

        return f"""You are a senior content writer for JASPER Financial Architecture, a boutique consulting firm specializing in {context}.

WRITING STYLE:
- Tone: {tone}
- Target audience: CFOs, project developers, government officials seeking DFI funding
- Length: 1500-2500 words
- Include: Practical insights, data points, actionable advice
- Avoid: Generic fluff, obvious statements, excessive jargon

JASPER CONTEXT:
- We help clients access R10M-R2B+ in DFI funding
- Our JASPER™ financial modeling system is proprietary
- Focus on South African and African markets
- Key DFIs: IDC, DBSA, PIC, AfDB, IFC, Land Bank

OUTPUT FORMAT:
Return the blog post with these sections clearly marked:
[TITLE]: SEO-optimized title (60 chars max)
[SEO_TITLE]: Meta title for search (60 chars max)
[SEO_DESCRIPTION]: Meta description (155 chars max)
[EXCERPT]: 2-sentence summary
[CONTENT]: Full article in markdown format
[TAGS]: Comma-separated tags

Write comprehensive, valuable content that positions JASPER as thought leaders."""

    def _build_content_user_prompt(
        self,
        topic: str,
        seo_keywords: List[str],
        lead_context: Dict[str, Any] = None
    ) -> str:
        """Build the user prompt for content generation."""
        prompt_parts = [
            f"Write a comprehensive blog post about: {topic}",
            f"\nTarget SEO keywords to include naturally: {', '.join(seo_keywords)}" if seo_keywords else "",
        ]

        if lead_context:
            prompt_parts.append(f"\nContext from CRM: This topic is relevant because leads in the {lead_context.get('sector', 'infrastructure')} sector have been asking about {lead_context.get('common_question', 'funding options')}.")

        prompt_parts.append("\nEnsure the content is actionable and includes specific examples relevant to South African and African markets.")

        return "\n".join(prompt_parts)

    def _parse_blog_content(
        self,
        raw_content: str,
        default_title: str,
        seo_keywords: List[str]
    ) -> Dict[str, Any]:
        """Parse the structured output from DeepSeek V3.2."""
        result = {
            "title": default_title,
            "seoTitle": default_title[:60],
            "seoDescription": "",
            "excerpt": "",
            "content": raw_content,
            "tags": seo_keywords or []
        }

        # Parse sections from the response
        sections = {
            "[TITLE]:": "title",
            "[SEO_TITLE]:": "seoTitle",
            "[SEO_DESCRIPTION]:": "seoDescription",
            "[EXCERPT]:": "excerpt",
            "[CONTENT]:": "content",
            "[TAGS]:": "tags"
        }

        for marker, key in sections.items():
            if marker in raw_content:
                start = raw_content.find(marker) + len(marker)
                # Find the next section marker or end
                end = len(raw_content)
                for next_marker in sections.keys():
                    if next_marker != marker and next_marker in raw_content[start:]:
                        potential_end = raw_content.find(next_marker, start)
                        if potential_end < end:
                            end = potential_end

                value = raw_content[start:end].strip()

                if key == "tags":
                    result[key] = [t.strip() for t in value.split(",")]
                else:
                    result[key] = value

        return result


# Singleton instance
content_service = ContentService()
