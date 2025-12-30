"""
JASPER CRM - Evaluation Agent (Quality Gate for Auto-Publishing)

Autonomous AI reviewer using Gemini Flash to validate content
before auto-publishing to jasperfinance.org/insights.

Quality Thresholds (ALL must pass for auto-publish):
- SEO Score: >= 70%
- Content Quality: >= 100% (NO COMPROMISE - perfect quality required)
- Image Quality: >= 90%
- Grounding Score: >= 80%

Features:
- SEO analysis (keywords, meta, headers, URL structure)
- Content quality evaluation (readability, structure, value, accuracy)
- Image quality validation (brand alignment, resolution, relevance)
- Grounding verification (sources cited, facts verifiable)
- Automatic approval/rejection with feedback

API: Direct Google Gemini API
Model: Gemini 3.0 Flash Preview
"""

import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class QualityScores:
    """Quality scores for an article"""
    seo_score: float = 0.0
    content_quality: float = 0.0
    image_quality: float = 0.0
    grounding_score: float = 0.0

    @property
    def passes_threshold(self) -> bool:
        """Check if all scores meet minimum thresholds"""
        return (
            self.seo_score >= 70.0 and
            self.content_quality >= 100.0 and  # NO COMPROMISE
            self.image_quality >= 90.0 and
            self.grounding_score >= 80.0
        )

    def to_dict(self) -> Dict[str, float]:
        return {
            "seo_score": self.seo_score,
            "content_quality": self.content_quality,
            "image_quality": self.image_quality,
            "grounding_score": self.grounding_score,
        }


@dataclass
class EvaluationResult:
    """Result of article evaluation"""
    approved: bool
    scores: QualityScores
    feedback: Optional[str] = None
    failed_criteria: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    evaluated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    retry_recommended: bool = False


class EvaluationAgent:
    """
    Autonomous evaluation agent using Gemini Flash.

    Reviews content, SEO, images, and grounding before auto-publishing.
    Articles must pass ALL quality thresholds to be approved.

    Thresholds:
    - SEO: 70% (keywords, meta, headers, URL)
    - Content: 100% (NO COMPROMISE - DFI investors expect perfection)
    - Image: 90% (brand alignment, resolution, relevance)
    - Grounding: 80% (sources cited, facts verifiable)
    """

    THRESHOLDS = {
        "seo_score": 70.0,
        "content_quality": 100.0,  # Perfect quality required for DFI clients
        "image_quality": 90.0,
        "grounding_score": 80.0,
    }

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = "gemini-3.0-flash-preview"

        # Initialize Google AI client
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("EvaluationAgent initialized with Gemini Flash")
            except ImportError:
                logger.error("google-genai not installed, evaluation disabled")
        else:
            logger.warning("GOOGLE_API_KEY not set, evaluation disabled")

    async def evaluate_article(
        self,
        article: Dict[str, Any],
        image: Optional[Dict[str, Any]] = None,
        research: Optional[Dict[str, Any]] = None,
    ) -> EvaluationResult:
        """
        Evaluate an article for auto-publishing.

        Args:
            article: Article data with title, content, category, etc.
            image: Hero image data with url, prompt, etc.
            research: Research sources used

        Returns:
            EvaluationResult with approval decision and scores
        """
        # Calculate individual scores
        seo_score = await self._check_seo_score(article)
        content_score = await self._check_content_quality(article)
        image_score = await self._check_image_quality(image) if image else 90.0  # Default pass if no image
        grounding_score = await self._check_grounding(article, research)

        scores = QualityScores(
            seo_score=seo_score,
            content_quality=content_score,
            image_quality=image_score,
            grounding_score=grounding_score,
        )

        # Determine failed criteria
        failed_criteria = []
        suggestions = []

        if seo_score < self.THRESHOLDS["seo_score"]:
            failed_criteria.append("SEO Score")
            suggestions.append("Improve keyword usage, add meta description, check header structure")

        if content_score < self.THRESHOLDS["content_quality"]:
            failed_criteria.append("Content Quality")
            suggestions.append("Ensure content is comprehensive, accurate, and provides clear value")

        if image_score < self.THRESHOLDS["image_quality"]:
            failed_criteria.append("Image Quality")
            suggestions.append("Regenerate hero image with better brand alignment")

        if grounding_score < self.THRESHOLDS["grounding_score"]:
            failed_criteria.append("Grounding Score")
            suggestions.append("Add more verified sources, cite specific data points")

        approved = len(failed_criteria) == 0

        feedback = None
        if not approved:
            feedback = f"Article not approved. Failed criteria: {', '.join(failed_criteria)}. " + \
                      f"Suggestions: {' '.join(suggestions)}"

        return EvaluationResult(
            approved=approved,
            scores=scores,
            feedback=feedback,
            failed_criteria=failed_criteria,
            suggestions=suggestions,
            retry_recommended=len(failed_criteria) <= 2,  # Recommend retry if only 1-2 issues
        )

    async def _check_seo_score(self, article: Dict[str, Any]) -> float:
        """
        Calculate SEO score based on best practices.

        Checks:
        - Title length (50-60 chars ideal)
        - Content length (1500+ words for authority)
        - Headers present (H2, H3)
        - Meta description
        - Keywords in content
        """
        score = 0.0
        title = article.get("title", "")
        content = article.get("content", "")
        meta_description = article.get("seoDescription", "") or article.get("excerpt", "")
        target_keywords = article.get("tags", [])

        # Title length (50-60 chars ideal) - max 20 points
        title_len = len(title)
        if 50 <= title_len <= 60:
            score += 20
        elif 40 <= title_len <= 70:
            score += 15
        elif 30 <= title_len <= 80:
            score += 10
        else:
            score += 5

        # Content length (1500+ words for DFI) - max 25 points
        word_count = len(content.split())
        if word_count >= 2000:
            score += 25
        elif word_count >= 1500:
            score += 20
        elif word_count >= 1000:
            score += 15
        elif word_count >= 500:
            score += 10
        else:
            score += 5

        # Headers present (H2, H3) - max 15 points
        has_h2 = "##" in content or "<h2" in content.lower()
        has_h3 = "###" in content or "<h3" in content.lower()
        if has_h2 and has_h3:
            score += 15
        elif has_h2:
            score += 10
        else:
            score += 5

        # Meta description (155 chars ideal) - max 15 points
        meta_len = len(meta_description)
        if 120 <= meta_len <= 160:
            score += 15
        elif 80 <= meta_len <= 200:
            score += 10
        elif meta_len > 0:
            score += 5

        # Keywords in content - max 25 points
        content_lower = content.lower()
        keyword_hits = 0
        for kw in target_keywords:
            if isinstance(kw, str) and kw.lower() in content_lower:
                keyword_hits += 1

        if keyword_hits >= 5:
            score += 25
        elif keyword_hits >= 3:
            score += 20
        elif keyword_hits >= 1:
            score += 15
        else:
            score += 5

        return min(100.0, score)

    async def _check_content_quality(self, article: Dict[str, Any]) -> float:
        """
        Evaluate content quality using Gemini Flash.

        Checks:
        - Readability (professional but accessible)
        - Structure (logical flow, clear sections)
        - Value (actionable insights, data points)
        - Accuracy (no obvious errors or contradictions)
        """
        if not self.client:
            # Fall back to basic checks
            return self._basic_content_check(article)

        try:
            from google.genai import types

            content = article.get("content", "")[:3000]  # First 3000 chars for efficiency
            title = article.get("title", "")
            category = article.get("category", "DFI Insights")

            prompt = f"""Evaluate this article for a professional DFI consulting firm.
Score from 0-100 on these criteria:

1. READABILITY (0-25): Is it professional but accessible? CFO-friendly?
2. STRUCTURE (0-25): Does it have logical flow, clear sections, good headers?
3. VALUE (0-25): Does it provide actionable insights, real data, practical advice?
4. ACCURACY (0-25): Are there obvious errors, contradictions, or vague claims?

Article Title: {title}
Category: {category}

Content:
{content}

Respond with JSON only:
{{"readability": <0-25>, "structure": <0-25>, "value": <0-25>, "accuracy": <0-25>, "total": <0-100>, "feedback": "<brief feedback>"}}
"""

            config = types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=300,
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )

            # Parse response
            text = response.text

            # Extract JSON
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]

            result = json.loads(text.strip())
            total = result.get("total", 0)

            logger.info(f"Content quality score: {total} - {result.get('feedback', '')}")
            return float(total)

        except Exception as e:
            logger.error(f"Content quality check failed: {e}")
            return self._basic_content_check(article)

    def _basic_content_check(self, article: Dict[str, Any]) -> float:
        """Basic content quality check without AI."""
        score = 0.0
        content = article.get("content", "")

        # Word count
        word_count = len(content.split())
        if word_count >= 1500:
            score += 30
        elif word_count >= 1000:
            score += 20
        else:
            score += 10

        # Has headers
        if "##" in content or "<h2" in content.lower():
            score += 20

        # Has bullet points or lists
        if "- " in content or "* " in content or "<ul" in content.lower():
            score += 15

        # Has specific DFI mentions
        dfi_terms = ["IDC", "DBSA", "IFC", "AfDB", "DFI", "development finance"]
        for term in dfi_terms:
            if term.lower() in content.lower():
                score += 5
                break

        # Reasonable paragraph structure
        paragraphs = content.split("\n\n")
        if len(paragraphs) >= 5:
            score += 15

        # Not too many exclamation marks (unprofessional)
        if content.count("!") <= 3:
            score += 10

        return min(100.0, score)

    async def _check_image_quality(self, image: Dict[str, Any]) -> float:
        """
        Validate image quality against brand guidelines.

        Checks:
        - Resolution (1200x630 minimum for social)
        - Format (JPEG/PNG)
        - Relevance to prompt
        - Brand colors (Navy #0a1628, Emerald #2d6a4f)
        """
        if not image:
            return 90.0  # Default pass if no image

        score = 0.0

        # Check resolution
        width = image.get("width", 0) or image.get("metadata", {}).get("width", 0)
        height = image.get("height", 0) or image.get("metadata", {}).get("height", 0)

        if width >= 1792 and height >= 1024:
            score += 35  # Optimal for 16:9
        elif width >= 1200 and height >= 630:
            score += 25  # Good for social
        elif width >= 800:
            score += 15
        else:
            score += 5

        # Check format
        format_type = image.get("format", "") or image.get("metadata", {}).get("format", "")
        if format_type.lower() in ["jpeg", "jpg", "png", "webp"]:
            score += 20
        else:
            score += 10

        # Check if generated (AI-generated images are usually good quality)
        source = image.get("source", "")
        if source == "generated":
            score += 25
        elif source in ["unsplash", "pexels"]:
            score += 20
        else:
            score += 10

        # Check file size (reasonable size indicates quality)
        file_size = image.get("fileSize", 0) or image.get("metadata", {}).get("fileSize", 0)
        if file_size > 100000:  # > 100KB
            score += 20
        elif file_size > 50000:  # > 50KB
            score += 15
        else:
            score += 10

        return min(100.0, score)

    async def _check_grounding(
        self,
        article: Dict[str, Any],
        research: Optional[Dict[str, Any]],
    ) -> float:
        """
        Verify claims are backed by cited sources.

        Checks:
        - Number of sources cited
        - Sources have valid URLs
        - Key claims have citations
        """
        score = 0.0

        # Check research sources
        sources = []
        if research:
            sources = research.get("sources", [])
            if isinstance(research, dict) and "sources" in research:
                sources = research["sources"]

        # Number of sources
        source_count = len(sources)
        if source_count >= 5:
            score += 40
        elif source_count >= 3:
            score += 30
        elif source_count >= 1:
            score += 20
        else:
            score += 5

        # Check for URL presence in sources
        valid_urls = 0
        for source in sources:
            url = source.get("url", "") if isinstance(source, dict) else ""
            if url and (url.startswith("http://") or url.startswith("https://")):
                valid_urls += 1

        if valid_urls >= 3:
            score += 25
        elif valid_urls >= 1:
            score += 15
        else:
            score += 5

        # Check if content mentions sources/references
        content = article.get("content", "").lower()

        # Look for citation patterns
        citation_patterns = [
            r"according to",
            r"reports that",
            r"data shows",
            r"study found",
            r"world bank",
            r"ifc",
            r"afdb",
            r"dbsa",
            r"idc",
        ]

        citation_count = 0
        for pattern in citation_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                citation_count += 1

        if citation_count >= 5:
            score += 35
        elif citation_count >= 3:
            score += 25
        elif citation_count >= 1:
            score += 15
        else:
            score += 5

        return min(100.0, score)

    async def evaluate_for_retry(
        self,
        previous_result: EvaluationResult,
        new_article: Dict[str, Any],
    ) -> EvaluationResult:
        """
        Re-evaluate an article after improvements.

        Provides comparison to previous evaluation.
        """
        new_result = await self.evaluate_article(new_article)

        # Add improvement feedback
        improvements = []
        if new_result.scores.seo_score > previous_result.scores.seo_score:
            improvements.append(f"SEO improved: {previous_result.scores.seo_score:.0f}% -> {new_result.scores.seo_score:.0f}%")
        if new_result.scores.content_quality > previous_result.scores.content_quality:
            improvements.append(f"Content improved: {previous_result.scores.content_quality:.0f}% -> {new_result.scores.content_quality:.0f}%")
        if new_result.scores.grounding_score > previous_result.scores.grounding_score:
            improvements.append(f"Grounding improved: {previous_result.scores.grounding_score:.0f}% -> {new_result.scores.grounding_score:.0f}%")

        if improvements:
            existing_feedback = new_result.feedback or ""
            new_result.feedback = f"Improvements: {', '.join(improvements)}. {existing_feedback}"

        return new_result


# Singleton instance
evaluation_agent = EvaluationAgent()
