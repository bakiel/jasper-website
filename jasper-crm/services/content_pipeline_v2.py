"""
JASPER Content Pipeline V2
Multi-stage content generation with research grounding, humanization, and SEO optimization

Pipeline:
1. Research (Gemini 2.0 Flash + Google Search) -> Gather real facts (cheap/fast)
2. Draft (DeepSeek V3.2) -> Generate content with voice guide
3. Humanize (Gemini 2.0 Flash Thinking) -> Remove AI-isms, add personality (reasoning)
4. SEO Optimize (Gemini 2.0 Flash) -> Ensure keyword placement and structure (cheap/fast)
"""

import os
import re
import json
import httpx
from typing import Dict, Any, List, Optional
from loguru import logger
# API monitoring
from services.api_monitor import api_monitor

# Import the new prompts
from agents.content_prompts import (
    build_system_prompt,
    build_user_prompt,
    build_humanize_prompt,
    build_research_prompt,
    BANNED_PHRASES,
)


class ContentPipelineV2:
    """
    Multi-stage content generation pipeline.

    Produces human-quality blog content that passes SEO validation.
    """

    def __init__(self):
        self.deepseek_key = os.getenv("DEEPSEEK_API_KEY")
        self.google_key = os.getenv("GOOGLE_API_KEY")

        if not self.deepseek_key:
            logger.warning("DEEPSEEK_API_KEY not set - content generation will fail")
        if not self.google_key:
            logger.warning("GOOGLE_API_KEY not set - research/humanize/SEO disabled")

    async def generate_content(
        self,
        topic: str,
        category: str = "dfi-insights",
        keywords: List[str] = None,
        skip_research: bool = False,
        skip_humanize: bool = False,
        skip_seo: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate content through the full pipeline.
        """
        pipeline_log = []

        # Generate focus keyword if not provided
        if not keywords:
            keywords = self._extract_keywords(topic)

        focus_keyword = keywords[0] if keywords else topic.lower().split()[0]

        try:
            # Stage 1: Research Grounding
            research_context = ""
            if not skip_research and self.google_key:
                logger.info(f"[Pipeline] Stage 1: Research grounding for '{topic}'")
                research_context = await self._research_topic(topic, category)
                pipeline_log.append({"stage": "research", "success": bool(research_context)})
            else:
                pipeline_log.append({"stage": "research", "skipped": True})

            # Stage 2: Draft Generation
            logger.info(f"[Pipeline] Stage 2: Generating draft with DeepSeek V3.2")
            draft = await self._generate_draft(topic, category, keywords, research_context)

            if not draft.get("content"):
                return {"error": "Draft generation failed", "pipeline_log": pipeline_log}

            pipeline_log.append({"stage": "draft", "success": True, "word_count": len(draft.get("content", "").split())})

            # Stage 3: Humanization Pass
            if not skip_humanize and self.google_key:
                logger.info(f"[Pipeline] Stage 3: Humanization pass")
                humanized_content = await self._humanize_content(draft.get("content", ""))

                if humanized_content:
                    draft["content"] = humanized_content
                    draft["humanized"] = True
                    pipeline_log.append({"stage": "humanize", "success": True})
                else:
                    pipeline_log.append({"stage": "humanize", "success": False})
            else:
                pipeline_log.append({"stage": "humanize", "skipped": True})

            # Stage 4: SEO Optimization
            if not skip_seo and self.google_key:
                logger.info(f"[Pipeline] Stage 4: SEO optimization (focus: {focus_keyword})")
                seo_result = await self._seo_optimize(draft, focus_keyword, keywords)

                if seo_result.get("success"):
                    draft = seo_result["draft"]
                    pipeline_log.append({"stage": "seo_optimize", "success": True})
                else:
                    pipeline_log.append({"stage": "seo_optimize", "success": False, "error": seo_result.get("error")})
            else:
                pipeline_log.append({"stage": "seo_optimize", "skipped": True})

            # Stage 5: Final cleanup
            draft["content"] = self._final_cleanup(draft.get("content", ""))
            pipeline_log.append({"stage": "cleanup", "success": True})

            # Ensure focus keyword is set
            draft["focus_keyword"] = focus_keyword
            draft["keywords"] = keywords
            draft["pipeline_log"] = pipeline_log
            draft["pipeline_version"] = "v2"

            return draft

        except Exception as e:
            logger.error(f"[Pipeline] Error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "pipeline_log": pipeline_log}

    def _extract_keywords(self, topic: str) -> List[str]:
        """Extract meaningful SEO keywords from topic."""
        topic_lower = topic.lower()

        # Known high-value DFI/investment keywords to look for
        priority_keywords = [
            "agri-processing", "agriprocessing", "africa investment", "african investment",
            "dfi funding", "project finance", "infrastructure investment",
            "renewable energy", "impact investment", "blended finance",
            "ifc funding", "afdb funding", "development finance",
            "food security", "agricultural investment", "climate finance",
        ]

        # Check for priority keywords first
        found = []
        for kw in priority_keywords:
            if kw in topic_lower:
                found.append(kw)

        if found:
            return found[:3]

        # Fallback: extract meaningful 2-3 word phrases
        words = topic_lower.split()
        stopwords = {"the", "a", "an", "in", "on", "at", "for", "to", "of", "and", "or",
                     "is", "are", "why", "how", "what", "their", "they", "this", "that"}

        # Get content words
        content_words = [w for w in words if w not in stopwords and len(w) > 2]

        # Build meaningful phrases (skip adjacent stopwords)
        if len(content_words) >= 2:
            # Try to find "X investment" or "X funding" patterns
            for i, word in enumerate(content_words[:-1]):
                next_word = content_words[i+1]
                if next_word in ["investment", "investments", "funding", "finance"]:
                    found.append(f"{word} {next_word}")

            # If nothing found, just use pairs of content words
            if not found:
                for i in range(len(content_words) - 1):
                    found.append(f"{content_words[i]} {content_words[i+1]}")

        return found[:3] if found else content_words[:3]

    async def _research_topic(self, topic: str, category: str) -> str:
        """Use Gemini with Google Search grounding to gather real facts."""
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.google_key)
            research_prompt = build_research_prompt(topic, category)

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=research_prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.3,
                )
            )

            research_text = response.text if response.text else ""
            logger.info(f"[Research] Gathered {len(research_text)} chars of research")
            return research_text

        except Exception as e:
            logger.error(f"[Research] Failed: {e}")
            return ""

    async def _generate_draft(
        self,
        topic: str,
        category: str,
        keywords: List[str],
        research_context: str
    ) -> Dict[str, Any]:
        """Generate the draft using DeepSeek V3.2."""
        try:
            system_prompt = build_system_prompt(category, research_context)
            user_prompt = build_user_prompt(topic, keywords)

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.deepseek_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4000,
                    }
                )

                if response.status_code != 200:
                    logger.error(f"[Draft] DeepSeek error: {response.text}")
                    return {"error": f"DeepSeek API error: {response.status_code}"}

                data = response.json()
                
                # Log API usage with actual token counts
                usage = data.get("usage", {})
                api_monitor.log_deepseek_call(
                    model="deepseek-chat",
                    endpoint="chat/completions",
                    input_tokens=usage.get("prompt_tokens", 0),
                    output_tokens=usage.get("completion_tokens", 0),
                    cached_tokens=usage.get("prompt_cache_hit_tokens", 0),
                    caller="content_pipeline_v2._generate_draft",
                    prompt_preview=topic[:100]
                )
                
                raw_content = data["choices"][0]["message"]["content"]
                return self._parse_draft(raw_content, topic, keywords)

        except Exception as e:
            logger.error(f"[Draft] Failed: {e}")
            return {"error": str(e)}

    async def _humanize_content(self, content: str) -> Optional[str]:
        """Run humanization pass with Gemini."""
        try:
            from google import genai

            client = genai.Client(api_key=self.google_key)
            humanize_prompt = build_humanize_prompt(content)

            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=humanize_prompt,
            )

            humanized = response.text if response.text else None

            if humanized and len(humanized) > len(content) * 0.5:
                logger.info(f"[Humanize] Success: {len(content)} -> {len(humanized)} chars")
                return humanized

            return None

        except Exception as e:
            logger.error(f"[Humanize] Failed: {e}")
            return None

    async def _seo_optimize(
        self,
        draft: Dict[str, Any],
        focus_keyword: str,
        keywords: List[str]
    ) -> Dict[str, Any]:
        """
        SEO optimization pass - SURGICAL approach.

        Only modifies:
        - Title (add keyword)
        - SEO Title (add keyword, ensure length)
        - SEO Description (add keyword, ensure length)
        - First paragraph of content (inject keyword naturally)
        - Add external link if missing

        Does NOT rewrite the full article.
        """
        try:
            from google import genai

            client = genai.Client(api_key=self.google_key)

            current_title = draft.get('title', '')
            current_seo_title = draft.get('seoTitle', '')
            current_seo_desc = draft.get('seoDescription', '')
            full_content = draft.get('content', '')

            # Split content into first paragraph and rest
            paragraphs = full_content.split('\n\n')
            first_para = paragraphs[0] if paragraphs else ""
            rest_of_content = '\n\n'.join(paragraphs[1:]) if len(paragraphs) > 1 else ""

            seo_prompt = f'''You are an SEO specialist. Do a SURGICAL optimization for focus keyword: "{focus_keyword}"

CURRENT:
- Title: {current_title}
- SEO Title: {current_seo_title}
- SEO Description: {current_seo_desc}
- First paragraph: {first_para[:500]}

TASK: Return ONLY these 4 items, nothing else:

[TITLE]: Rewrite the title to include "{focus_keyword}" naturally (keep it professional)
[SEO_TITLE]: Create SEO title (50-60 chars) that includes "{focus_keyword}"
[SEO_DESCRIPTION]: Create meta description (120-160 chars) that includes "{focus_keyword}"
[FIRST_PARA]: Rewrite ONLY the first paragraph to include "{focus_keyword}" in the first 2 sentences. Keep same length and meaning.

Be concise. Return ONLY these 4 items with the markers.'''

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=seo_prompt,
            )

            if not response.text:
                return {"success": False, "error": "Empty SEO response"}

            # Parse the surgical response
            result = response.text
            new_title = current_title
            new_seo_title = current_seo_title
            new_seo_desc = current_seo_desc
            new_first_para = first_para

            # Extract each field
            import re

            title_match = re.search(r'\[TITLE\]:\s*(.+?)(?=\[|$)', result, re.DOTALL)
            if title_match:
                new_title = title_match.group(1).strip()

            seo_title_match = re.search(r'\[SEO_TITLE\]:\s*(.+?)(?=\[|$)', result, re.DOTALL)
            if seo_title_match:
                new_seo_title = seo_title_match.group(1).strip()[:60]

            seo_desc_match = re.search(r'\[SEO_DESCRIPTION\]:\s*(.+?)(?=\[|$)', result, re.DOTALL)
            if seo_desc_match:
                new_seo_desc = seo_desc_match.group(1).strip()[:160]

            first_para_match = re.search(r'\[FIRST_PARA\]:\s*(.+?)(?=\[|$)', result, re.DOTALL)
            if first_para_match:
                new_first_para = first_para_match.group(1).strip()

            # Reconstruct content with new first paragraph
            new_content = new_first_para + '\n\n' + rest_of_content if rest_of_content else new_first_para

            # Add external link if not present
            if 'https://' not in new_content and 'http://' not in new_content:
                # Add link to first H2 section or end of first paragraph
                link = "\n\nFor more on development finance strategies, see the [IFC's approach to agribusiness](https://www.ifc.org/en/what-we-do/sector-expertise/agribusiness-and-forestry)."
                # Insert after first paragraph
                parts = new_content.split('\n\n', 1)
                if len(parts) > 1:
                    new_content = parts[0] + link + '\n\n' + parts[1]
                else:
                    new_content = new_content + link

            # Update draft
            draft['title'] = new_title
            draft['seoTitle'] = new_seo_title
            draft['seoDescription'] = new_seo_desc
            draft['content'] = new_content

            # Verify
            keyword_in_title = focus_keyword.lower() in new_title.lower()
            keyword_in_content = focus_keyword.lower() in new_content[:500].lower()

            logger.info(f"[SEO] Surgical optimization - title:{keyword_in_title}, content:{keyword_in_content}, length:{len(new_content.split())} words")

            return {"success": True, "draft": draft}

        except Exception as e:
            logger.error(f"[SEO Optimize] Failed: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

    def _final_cleanup(self, content: str) -> str:
        """Final pass to remove any remaining banned phrases."""
        cleaned = content

        replacements = {
            "leverage": "use",
            "Leverage": "Use",
            "utilize": "use",
            "Utilize": "Use",
            "utilise": "use",
            "Utilise": "Use",
        }

        for old, new in replacements.items():
            cleaned = cleaned.replace(old, new)

        return cleaned

    def _parse_draft(self, raw: str, default_title: str, keywords: List[str]) -> Dict[str, Any]:
        """Parse the structured output from the LLM."""
        result = {
            "title": default_title,
            "seoTitle": default_title[:60],
            "seoDescription": "",
            "excerpt": "",
            "content": "",
            "tags": keywords or []
        }

        markers = {
            "TITLE": "title",
            "SEO_TITLE": "seoTitle",
            "SEO_DESCRIPTION": "seoDescription",
            "EXCERPT": "excerpt",
            "CONTENT": "content",
            "TAGS": "tags"
        }

        for marker, field in markers.items():
            pattern = rf'\[{marker}\]:\s*(.+?)(?=\[(?:TITLE|SEO_TITLE|SEO_DESCRIPTION|EXCERPT|CONTENT|TAGS)\]|$)'
            match = re.search(pattern, raw, re.DOTALL | re.IGNORECASE)

            if match:
                value = match.group(1).strip()

                if field == "tags":
                    result[field] = [t.strip() for t in value.split(",") if t.strip()]
                elif field == "content":
                    value = re.sub(r'\[TAGS\].*$', '', value, flags=re.DOTALL | re.IGNORECASE)
                    result[field] = value.strip()
                else:
                    result[field] = value

        # If no structured content found, use the whole thing
        if not result["content"] and raw:
            if "[CONTENT]:" in raw.upper():
                idx = raw.upper().find("[CONTENT]:")
                result["content"] = raw[idx + 10:].strip()
            else:
                result["content"] = raw

        # Generate excerpt from content if missing
        if not result["excerpt"] and result["content"]:
            first_para = result["content"].split('\n\n')[0]
            result["excerpt"] = first_para[:250].strip() + "..." if len(first_para) > 250 else first_para

        return result


# Singleton instance
content_pipeline_v2 = ContentPipelineV2()
