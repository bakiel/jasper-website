"""
JASPER Client Portal - AI Service
Model strategy aligned with BLOG_GENERATOR.md, CLIENT_SUBMISSION_PROCESSOR.md,
and QWEN3_EMBEDDING_STRATEGY.md

IMAGE GENERATION: Nano Banana Pro (google/gemini-3-pro-image-preview) via OpenRouter
"""

import httpx
from typing import Optional, Dict, Any, List
import json
import base64

from app.core.config import get_settings

settings = get_settings()


class AIService:
    """
    AI Service using JASPER's documented model stack:

    Research/Analysis: DeepSeek V3.2
    - Topic research, data gathering, outline creation
    - Cost: ~$0.01 per request

    Writing/Polish: Claude Sonnet 4.5
    - Long-form content, final polish
    - Cost: ~$0.04 per article

    OCR/Extraction: Qwen3-VL 8B
    - Document text extraction, table parsing
    - Cost: ~$0.002 per document

    Analysis/Reasoning: Qwen3-VL 30B Thinking
    - Completeness checks, gap analysis
    - Cost: ~$0.01 per analysis

    Embeddings: Qwen3-Embedding-0.6B
    - Semantic search, document similarity
    - Cost: ~$0.002 per query

    Images: Nano Banana Pro (google/gemini-3-pro-image-preview)
    - Professional-grade image generation via OpenRouter
    - 2K/4K output, text rendering, identity preservation
    - Cost: $2/M input, $12/M output tokens
    """

    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": settings.AI_SITE_URL,
            "X-Title": settings.AI_SITE_NAME,
            "Content-Type": "application/json"
        }

    async def _make_request(
        self,
        model: str,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        modalities: List[str] = None
    ) -> Dict[str, Any]:
        """Make request to OpenRouter API"""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # Add modalities for image generation
        if modalities:
            payload["modalities"] = modalities

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    # ============================================
    # RESEARCH & ANALYSIS (DeepSeek V3.2)
    # ============================================

    async def research_topic(self, topic: str, context: str = "") -> Dict[str, Any]:
        """
        Research a topic using DeepSeek V3.2.
        Use for: Topic research, data gathering, outline creation, SEO keywords
        """
        messages = [
            {
                "role": "system",
                "content": """You are a research agent for JASPER Financial Architecture,
a DFI financial modelling firm. Research topics related to development finance
institutions (IFC, AfDB, ADB, IDC), financial modelling, and project finance.

Focus on practical, actionable insights for project developers seeking DFI funding
in the $5M-$500M range."""
            },
            {
                "role": "user",
                "content": f"""Research the following topic and provide structured analysis.

TOPIC: {topic}

{f'CONTEXT: {context}' if context else ''}

OUTPUT FORMAT (JSON):
{{
    "key_themes": ["..."],
    "target_audience_insights": "...",
    "data_points": ["..."],
    "sources": ["..."],
    "outline": ["H2: ...", "H3: ..."],
    "seo_keywords": ["..."],
    "unique_angle": "..."
}}"""
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_RESEARCH,
            messages=messages,
            temperature=0.5
        )

        return {
            "model": "deepseek-v3.2",
            "usage": "research",
            "response": result["choices"][0]["message"]["content"]
        }

    async def generate_outline(self, topic: str, research: str) -> str:
        """Generate article outline from research"""
        messages = [
            {
                "role": "system",
                "content": "Create detailed article outlines for JASPER's blog."
            },
            {
                "role": "user",
                "content": f"""Based on this research, create a detailed article outline.

TOPIC: {topic}

RESEARCH:
{research}

Create an outline with:
- Compelling H1 title
- 4-6 H2 sections
- 2-3 H3 subsections per H2
- Key points for each section
- Word count targets per section"""
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_RESEARCH,
            messages=messages,
            temperature=0.6
        )

        return result["choices"][0]["message"]["content"]

    # ============================================
    # WRITING & POLISH (Claude Sonnet 4.5)
    # ============================================

    async def write_article(
        self,
        outline: str,
        research: str,
        seo_keywords: List[str],
        min_words: int = 1000
    ) -> str:
        """
        Write full article using Claude Sonnet 4.5.
        Use for: Blog articles, business plans, proposals
        """
        messages = [
            {
                "role": "system",
                "content": """You are the content writer for JASPER Financial Architecture.
Write in a professional, direct voice. No fluff, no filler. Every sentence provides value.

BRAND VOICE:
- Professional but accessible
- Confident without arrogance
- Technical accuracy
- Practical focus
- Direct communication"""
            },
            {
                "role": "user",
                "content": f"""Write a complete article based on the outline and research.

OUTLINE:
{outline}

RESEARCH:
{research}

REQUIREMENTS:
- Minimum {min_words} words
- SEO keywords to integrate naturally: {', '.join(seo_keywords)}
- Clear H2 and H3 structure
- Actionable insights
- End with clear call-to-action

Write the complete article in markdown format."""
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_WRITING,
            messages=messages,
            temperature=0.7,
            max_tokens=6000
        )

        return result["choices"][0]["message"]["content"]

    async def polish_content(self, content: str, content_type: str = "article") -> str:
        """Polish and refine content for final publication"""
        messages = [
            {
                "role": "system",
                "content": f"Polish this {content_type} for JASPER. Maintain brand voice, fix any issues, improve flow."
            },
            {
                "role": "user",
                "content": f"Polish this content:\n\n{content}"
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_WRITING,
            messages=messages,
            temperature=0.5
        )

        return result["choices"][0]["message"]["content"]

    # ============================================
    # OCR & EXTRACTION (Qwen3-VL 8B)
    # ============================================

    async def extract_document(self, image_base64: str) -> Dict[str, Any]:
        """
        Extract text and data from document image using Qwen3-VL 8B.
        Use for: PDFs, scanned documents, financial statements
        """
        messages = [
            {
                "role": "system",
                "content": """You are a document extraction specialist. Extract all text,
tables, and data from the provided document image. Also identify branding elements."""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Extract all content from this document.

OUTPUT FORMAT (JSON):
{
    "document_type": "feasibility_study|financial_model|registration|other",
    "extracted_text": "...",
    "tables": [{"title": "...", "headers": [...], "rows": [[...]]}],
    "figures": [{"description": "...", "data_points": [...]}],
    "branding": {
        "logo_detected": true/false,
        "colours_detected": ["#hex1"],
        "fonts_detected": ["Font1"]
    },
    "quality_notes": "..."
}"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_OCR,
            messages=messages,
            temperature=0.2
        )

        return {
            "model": "qwen3-vl-8b",
            "usage": "ocr",
            "response": result["choices"][0]["message"]["content"]
        }

    # ============================================
    # ANALYSIS & REASONING (Qwen3-VL 30B Thinking)
    # ============================================

    async def analyze_submission(
        self,
        extracted_data: Dict,
        checklist: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze client submission completeness using Qwen3-VL 30B Thinking.
        Use for: Intake completeness checks, gap analysis
        """
        messages = [
            {
                "role": "system",
                "content": """You are an intake analyst for a DFI financial modelling firm.
Analyse submissions against the required checklist. Think carefully about what is
present, partial, or missing."""
            },
            {
                "role": "user",
                "content": f"""Analyse this submission against the checklist.

CHECKLIST:
{json.dumps(checklist, indent=2)}

EXTRACTED DATA:
{json.dumps(extracted_data, indent=2)}

THINK THROUGH:
1. What items are fully complete?
2. What items are partially complete (and what's missing)?
3. What items are completely missing?
4. What quality issues exist?
5. What are the highest priority missing items?

OUTPUT FORMAT (JSON):
{{
    "completeness_score": 0-100,
    "status": "complete|partial|incomplete",
    "checklist_results": {{}},
    "missing_items": [{{"item": "...", "priority": "high|medium|low", "reason": "..."}}],
    "quality_notes": ["..."],
    "recommendations": ["..."]
}}"""
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_ANALYSIS,
            messages=messages,
            temperature=0.3,
            max_tokens=4000
        )

        return {
            "model": "qwen3-vl-30b-thinking",
            "usage": "analysis",
            "response": result["choices"][0]["message"]["content"]
        }

    # ============================================
    # IMAGE GENERATION - NANO BANANA PRO
    # google/gemini-3-pro-image-preview via OpenRouter
    # ============================================

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        style: str = None,
        reference_images: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate image using Nano Banana Pro via OpenRouter.

        PROMPTING BEST PRACTICES (from Google guide):
        1. Use natural language, full sentences - not tag soups
        2. Be specific: describe subject, setting, lighting, mood
        3. Provide context (the "why" or "for whom")
        4. Edit don't re-roll - use conversational edits

        Args:
            prompt: Detailed natural language description
            aspect_ratio: "16:9", "1:1", "9:16", "4:3", "3:4"
            style: Optional style guidance
            reference_images: Optional base64 images for identity/style reference

        Returns:
            Dict with base64 image data
        """
        # Build the prompt with JASPER brand context
        full_prompt = f"""Create a professional image for JASPER Financial Architecture,
a DFI financial modelling consultancy serving project developers in Africa.

BRAND CONTEXT:
- Primary colour: Navy (#0F2A3C)
- Accent colour: Emerald (#2C8A5B)
- Style: Professional, clean, sophisticated
- Font (if text needed): Poppins or Montserrat

IMAGE REQUEST:
{prompt}

{f'STYLE: {style}' if style else ''}

Ensure the image is suitable for professional business use, with clean composition
and high visual quality. Format: {aspect_ratio} aspect ratio."""

        # Build message content
        content = [{"type": "text", "text": full_prompt}]

        # Add reference images if provided (for identity preservation)
        if reference_images:
            for i, img_base64 in enumerate(reference_images[:5]):  # Max 5 refs
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{img_base64}"}
                })

        messages = [{"role": "user", "content": content}]

        result = await self._make_request(
            model=settings.AI_MODEL_IMAGE,
            messages=messages,
            modalities=["image", "text"],
            temperature=0.8,
            max_tokens=4096
        )

        # Extract image from response
        message = result["choices"][0]["message"]
        images = []

        if "images" in message:
            images = message["images"]
        elif "content" in message:
            # Handle different response formats
            for part in message.get("content", []):
                if isinstance(part, dict) and part.get("type") == "image_url":
                    images.append(part["image_url"])

        return {
            "model": "nano-banana-pro",
            "usage": "image_generation",
            "images": images,
            "text_response": message.get("content", "") if isinstance(message.get("content"), str) else None
        }

    async def generate_infographic(
        self,
        title: str,
        data_points: List[Dict[str, Any]],
        style: str = "modern professional"
    ) -> Dict[str, Any]:
        """
        Generate infographic from structured data.
        Nano Banana Pro excels at text rendering and data visualization.
        """
        prompt = f"""Create a clean, modern infographic with the following:

TITLE: {title}

DATA POINTS:
{json.dumps(data_points, indent=2)}

DESIGN REQUIREMENTS:
- Style: {style}
- Use JASPER brand colours: Navy (#0F2A3C), Emerald (#2C8A5B)
- Ensure ALL text is legible and properly rendered
- Use clear visual hierarchy
- Include appropriate icons or visual elements
- Professional quality suitable for business presentations"""

        return await self.generate_image(prompt, aspect_ratio="9:16", style=style)

    async def generate_blog_hero(
        self,
        article_title: str,
        key_theme: str
    ) -> Dict[str, Any]:
        """
        Generate hero image for blog article.
        Optimised for 16:9 format, professional style.
        """
        prompt = f"""Create a sophisticated hero image for a blog article.

ARTICLE TITLE: "{article_title}"
KEY THEME: {key_theme}

Create a cinematic, professional image that visually represents this topic.
The image should work well as a header/hero image on a website.
Avoid generic stock photo aesthetics - create something distinctive and memorable.
Do NOT include any text in the image."""

        return await self.generate_image(prompt, aspect_ratio="16:9")

    async def generate_social_image(
        self,
        headline: str,
        platform: str = "linkedin"
    ) -> Dict[str, Any]:
        """
        Generate social media image with text overlay.
        Nano Banana Pro has SOTA text rendering capabilities.
        """
        dimensions = {
            "linkedin": "1200x627",
            "twitter": "1200x675",
            "instagram": "1080x1080",
            "facebook": "1200x630"
        }

        aspect = "16:9" if platform in ["linkedin", "twitter", "facebook"] else "1:1"

        prompt = f"""Create a professional social media graphic for {platform}.

TEXT TO DISPLAY: "{headline}"

REQUIREMENTS:
- Bold, legible text rendering
- JASPER brand colours: Navy background (#0F2A3C), Emerald accent (#2C8A5B)
- White text for maximum contrast
- Clean, modern design
- Professional appearance suitable for B2B financial services
- Include subtle geometric or abstract elements
- The text should be the focal point"""

        return await self.generate_image(prompt, aspect_ratio=aspect)

    async def edit_image(
        self,
        image_base64: str,
        edit_instruction: str
    ) -> Dict[str, Any]:
        """
        Edit an existing image with natural language instructions.
        Nano Banana Pro supports conversational editing.
        """
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{image_base64}"}
                    },
                    {
                        "type": "text",
                        "text": f"""Edit this image with the following changes:

{edit_instruction}

Maintain the overall quality and style of the original image.
Apply only the requested changes."""
                    }
                ]
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_IMAGE,
            messages=messages,
            modalities=["image", "text"],
            temperature=0.7
        )

        message = result["choices"][0]["message"]
        images = message.get("images", [])

        return {
            "model": "nano-banana-pro",
            "usage": "image_edit",
            "images": images
        }

    # ============================================
    # SOCIAL CONTENT
    # ============================================

    async def generate_social_post(
        self,
        article_content: str,
        platform: str = "linkedin"
    ) -> str:
        """
        Generate social media post from article.
        Uses DeepSeek for draft, Sonnet for polish.
        """
        # Draft with DeepSeek
        draft_messages = [
            {
                "role": "system",
                "content": "Extract key insights and create social media draft."
            },
            {
                "role": "user",
                "content": f"""From this article, create a {platform} post draft.

ARTICLE:
{article_content[:3000]}

Create:
- Hook (first line to grab attention)
- 3-5 key value points
- Engagement question
- Link placeholder [ARTICLE_LINK]

Keep to 250-300 words."""
            }
        ]

        draft_result = await self._make_request(
            model=settings.AI_MODEL_RESEARCH,
            messages=draft_messages,
            temperature=0.7
        )

        draft = draft_result["choices"][0]["message"]["content"]

        # Polish with Sonnet
        polish_messages = [
            {
                "role": "system",
                "content": """Polish this LinkedIn post for JASPER Financial Architecture.
Voice: professional, direct, value-focused. No fluff."""
            },
            {
                "role": "user",
                "content": f"""Polish this draft:

{draft}

Requirements:
- Strong hook
- Clear value proposition
- Professional tone
- 200-300 words max
- End with engagement question or CTA"""
            }
        ]

        result = await self._make_request(
            model=settings.AI_MODEL_WRITING,
            messages=polish_messages,
            temperature=0.5
        )

        return result["choices"][0]["message"]["content"]


# ============================================
# COST TRACKING
# ============================================

MODEL_COSTS = {
    "deepseek/deepseek-chat": {
        "input": 0.00028,   # $0.28/1M tokens (cache miss)
        "output": 0.00042   # $0.42/1M tokens
    },
    "anthropic/claude-sonnet-4-5": {
        "input": 0.003,     # $3/1M tokens
        "output": 0.015     # $15/1M tokens
    },
    "qwen/qwen3-vl-8b-instruct": {
        "input": 0.000064,  # $0.064/1M tokens
        "output": 0.0004    # $0.40/1M tokens
    },
    "qwen/qwen3-vl-30b-a3b-thinking": {
        "input": 0.0003,    # $0.30/1M tokens
        "output": 0.0012    # $1.20/1M tokens
    },
    "google/gemini-3-pro-image-preview": {
        "input": 0.002,     # $2/1M tokens
        "output": 0.012     # $12/1M tokens
    }
}


# Singleton instance
ai_service = AIService()
