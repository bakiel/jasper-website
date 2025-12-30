"""
JASPER CRM - AI Content Generation Service

Generates blog articles, content, and SEO metadata using Gemini.
"""

import os
import httpx
import logging
import re
from typing import Optional, Dict, Any, List
from datetime import datetime

from models.content import (
    ArticleType, ContentTone, ArticleOutline, SEOData
)

logger = logging.getLogger("jasper-content-gen")


class ContentGenerationService:
    """AI content generation service using Google Gemini."""

    def __init__(self):
        self.gemini_key = os.getenv("GOOGLE_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=120.0)

        # Tone descriptors for prompts
        self.tone_descriptors = {
            ContentTone.PROFESSIONAL: "formal, professional, business-appropriate",
            ContentTone.CASUAL: "friendly, conversational, approachable",
            ContentTone.AUTHORITATIVE: "expert, authoritative, confident",
            ContentTone.FRIENDLY: "warm, engaging, personable",
            ContentTone.TECHNICAL: "technical, precise, detailed",
            ContentTone.INSPIRING: "motivational, inspiring, uplifting",
        }

        # Article type contexts
        self.type_contexts = {
            ArticleType.BLOG: "engaging blog post",
            ArticleType.NEWS: "news article or press release",
            ArticleType.GUIDE: "comprehensive how-to guide",
            ArticleType.CASE_STUDY: "detailed case study with results",
            ArticleType.ANNOUNCEMENT: "company announcement",
            ArticleType.THOUGHT_LEADERSHIP: "thought leadership piece with insights",
        }

    async def generate_article_outline(
        self,
        topic: str,
        article_type: ArticleType = ArticleType.BLOG,
        tone: ContentTone = ContentTone.PROFESSIONAL,
        keywords: List[str] = [],
        target_length: int = 1500,
    ) -> ArticleOutline:
        """
        Generate an article outline for review before full generation.
        """
        if not self.gemini_key:
            return self._fallback_outline(topic, article_type, keywords)

        type_context = self.type_contexts.get(article_type, "blog post")
        tone_desc = self.tone_descriptors.get(tone, "professional")

        prompt = f"""Create an outline for a {type_context} about: {topic}

Tone: {tone_desc}
Target length: approximately {target_length} words
{f"Keywords to include: {', '.join(keywords)}" if keywords else ""}

Provide a JSON response with:
{{
  "title": "Compelling title",
  "subtitle": "Optional subtitle",
  "sections": [
    {{"heading": "Section title", "description": "Brief description of content"}},
    ...
  ],
  "estimated_length": {target_length},
  "suggested_keywords": ["keyword1", "keyword2"],
  "hero_image_prompt": "Description for hero image generation"
}}

Respond with ONLY valid JSON."""

        try:
            response = await self.client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )
            response.raise_for_status()
            data = response.json()

            import json
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "text" in part:
                        text = part["text"].strip()
                        # Extract JSON
                        if text.startswith("{"):
                            parsed = json.loads(text)
                        elif "```json" in text:
                            json_str = text.split("```json")[1].split("```")[0].strip()
                            parsed = json.loads(json_str)
                        elif "```" in text:
                            json_str = text.split("```")[1].split("```")[0].strip()
                            parsed = json.loads(json_str)
                        else:
                            continue

                        return ArticleOutline(
                            title=parsed.get("title", topic),
                            subtitle=parsed.get("subtitle"),
                            sections=parsed.get("sections", []),
                            estimated_length=parsed.get("estimated_length", target_length),
                            suggested_keywords=parsed.get("suggested_keywords", keywords),
                            hero_image_prompt=parsed.get("hero_image_prompt")
                        )

            return self._fallback_outline(topic, article_type, keywords)

        except Exception as e:
            logger.error(f"Outline generation error: {e}")
            return self._fallback_outline(topic, article_type, keywords)

    async def generate_full_article(
        self,
        topic: str,
        article_type: ArticleType = ArticleType.BLOG,
        tone: ContentTone = ContentTone.PROFESSIONAL,
        keywords: List[str] = [],
        target_length: int = 1500,
        outline: Optional[ArticleOutline] = None,
    ) -> Dict[str, Any]:
        """
        Generate a complete article with title, content, and SEO.
        """
        if not self.gemini_key:
            return self._fallback_article(topic, article_type)

        type_context = self.type_contexts.get(article_type, "blog post")
        tone_desc = self.tone_descriptors.get(tone, "professional")

        outline_text = ""
        if outline:
            sections = [f"- {s['heading']}: {s.get('description', '')}" for s in outline.sections]
            outline_text = f"\n\nFollow this outline:\n" + "\n".join(sections)

        prompt = f"""Write a complete {type_context} about: {topic}

Tone: {tone_desc}
Target length: approximately {target_length} words
{f"Keywords to naturally incorporate: {', '.join(keywords)}" if keywords else ""}
{outline_text}

The article is for JASPER Financial Architecture (jasperfinance.org), a South African financial consulting firm.

Write the article in Markdown format with:
1. A compelling title (H1)
2. An engaging introduction
3. Well-structured sections with headers (H2, H3)
4. Practical insights and examples
5. A strong conclusion

After the article, provide SEO metadata as JSON:

---SEO---
{{
  "meta_title": "SEO-optimized title (60 chars max)",
  "meta_description": "Compelling meta description (160 chars max)",
  "keywords": ["keyword1", "keyword2", ...],
  "excerpt": "Brief article excerpt for previews"
}}"""

        try:
            response = await self.client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )
            response.raise_for_status()
            data = response.json()

            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "text" in part:
                        text = part["text"].strip()
                        return self._parse_article_response(text, topic)

            return self._fallback_article(topic, article_type)

        except Exception as e:
            logger.error(f"Article generation error: {e}")
            return self._fallback_article(topic, article_type)

    def _parse_article_response(self, text: str, topic: str) -> Dict[str, Any]:
        """Parse the generated article and SEO data."""
        import json

        # Split content and SEO
        content = text
        seo_data = {}

        if "---SEO---" in text:
            parts = text.split("---SEO---")
            content = parts[0].strip()
            if len(parts) > 1:
                seo_text = parts[1].strip()
                # Try to parse JSON
                try:
                    if seo_text.startswith("{"):
                        seo_data = json.loads(seo_text)
                    elif "```json" in seo_text:
                        json_str = seo_text.split("```json")[1].split("```")[0].strip()
                        seo_data = json.loads(json_str)
                    elif "```" in seo_text:
                        json_str = seo_text.split("```")[1].split("```")[0].strip()
                        seo_data = json.loads(json_str)
                except:
                    pass

        # Extract title from content
        title = topic
        lines = content.split("\n")
        for line in lines:
            if line.startswith("# "):
                title = line[2:].strip()
                break

        # Generate slug
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

        # Count words
        word_count = len(content.split())

        # Estimate read time (200 wpm average)
        read_time = max(1, round(word_count / 200))

        return {
            "title": title,
            "slug": slug,
            "content": content,
            "word_count": word_count,
            "read_time_minutes": read_time,
            "excerpt": seo_data.get("excerpt", content[:200] + "..."),
            "seo": SEOData(
                meta_title=seo_data.get("meta_title", title[:60]),
                meta_description=seo_data.get("meta_description", content[:160]),
                keywords=seo_data.get("keywords", []),
            )
        }

    def _fallback_outline(
        self,
        topic: str,
        article_type: ArticleType,
        keywords: List[str]
    ) -> ArticleOutline:
        """Fallback outline when AI is unavailable."""
        return ArticleOutline(
            title=topic,
            subtitle=None,
            sections=[
                {"heading": "Introduction", "description": "Overview of the topic"},
                {"heading": "Key Points", "description": "Main discussion points"},
                {"heading": "Analysis", "description": "In-depth analysis"},
                {"heading": "Conclusion", "description": "Summary and takeaways"},
            ],
            estimated_length=1500,
            suggested_keywords=keywords,
            hero_image_prompt=f"Professional image representing {topic}"
        )

    def _fallback_article(
        self,
        topic: str,
        article_type: ArticleType
    ) -> Dict[str, Any]:
        """Fallback article when AI is unavailable."""
        slug = re.sub(r'[^a-z0-9]+', '-', topic.lower()).strip('-')
        return {
            "title": topic,
            "slug": slug,
            "content": f"# {topic}\n\nContent generation is currently unavailable. Please try again later.",
            "word_count": 10,
            "read_time_minutes": 1,
            "excerpt": topic,
            "seo": SEOData(
                meta_title=topic[:60],
                meta_description=f"Article about {topic}",
                keywords=[]
            )
        }

    async def generate_seo_metadata(
        self,
        title: str,
        content: str,
        keywords: List[str] = []
    ) -> SEOData:
        """Generate optimized SEO metadata for existing content."""
        if not self.gemini_key:
            return SEOData(
                meta_title=title[:60],
                meta_description=content[:160],
                keywords=keywords
            )

        prompt = f"""Generate SEO metadata for this article:

Title: {title}
Content preview: {content[:1000]}...
{f"Target keywords: {', '.join(keywords)}" if keywords else ""}

Provide JSON with:
{{
  "meta_title": "SEO title (60 chars max)",
  "meta_description": "Meta description (160 chars max)",
  "keywords": ["optimized", "keywords"],
  "og_title": "Open Graph title",
  "og_description": "Open Graph description"
}}

Respond with ONLY valid JSON."""

        try:
            response = await self.client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )
            response.raise_for_status()
            data = response.json()

            import json
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "text" in part:
                        text = part["text"].strip()
                        if text.startswith("{"):
                            parsed = json.loads(text)
                        elif "```json" in text:
                            json_str = text.split("```json")[1].split("```")[0].strip()
                            parsed = json.loads(json_str)
                        elif "```" in text:
                            json_str = text.split("```")[1].split("```")[0].strip()
                            parsed = json.loads(json_str)
                        else:
                            continue

                        return SEOData(**parsed)

            return SEOData(
                meta_title=title[:60],
                meta_description=content[:160],
                keywords=keywords
            )

        except Exception as e:
            logger.error(f"SEO generation error: {e}")
            return SEOData(
                meta_title=title[:60],
                meta_description=content[:160],
                keywords=keywords
            )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
content_generation_service = ContentGenerationService()
