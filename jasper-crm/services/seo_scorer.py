"""
JASPER CRM - SEO Scorer Service
Auto-calculates SEO score on every post save - like Rank Math.

Features:
- Focus keyword analysis
- Keyword density calculation
- Title/meta length optimization
- Content structure analysis
- Readability scoring
- Internal/external link detection
"""

import re
import math
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class SEOCheck:
    """Single SEO check result."""
    name: str
    passed: bool
    score: float  # 0-100
    suggestion: str
    details: Optional[str] = None


@dataclass
class SEOResult:
    """Complete SEO analysis result."""
    score: int  # 0-100
    grade: str  # A, B, C, D, F
    checks: Dict[str, SEOCheck] = field(default_factory=dict)
    suggestions: List[str] = field(default_factory=list)
    focus_keyword: Optional[str] = None


class SEOScorer:
    """
    Auto-calculates SEO score on every post save - like Rank Math.

    Scoring breakdown:
    - Keyword in title: 15 points
    - Keyword in URL/slug: 10 points
    - Keyword in first 100 words: 10 points
    - Keyword density (1-2%): 10 points
    - SEO title length (50-60 chars): 10 points
    - Meta description length (120-160 chars): 10 points
    - Content length (1500+ words): 15 points
    - Internal links: 5 points
    - External links: 5 points
    - Headings structure (H2, H3): 5 points
    - Image alt tags: 5 points
    """

    def calculate_score(self, post: Dict[str, Any], focus_keyword: Optional[str] = None) -> SEOResult:
        """
        Calculate complete SEO score for a blog post.

        Args:
            post: Blog post dict with title, content, excerpt, seo fields, slug
            focus_keyword: Target keyword to optimize for

        Returns:
            SEOResult with score, grade, checks, and suggestions
        """
        # Extract focus keyword from post or use provided
        if not focus_keyword:
            focus_keyword = self._extract_focus_keyword(post)

        checks = {}

        # Run all checks
        checks["keyword_in_title"] = self.check_keyword_in_title(post, focus_keyword)
        checks["keyword_in_url"] = self.check_keyword_in_url(post, focus_keyword)
        checks["keyword_in_first_100"] = self.check_keyword_in_intro(post, focus_keyword)
        checks["keyword_density"] = self.check_keyword_density(post, focus_keyword)
        checks["seo_title_length"] = self.check_title_length(post)
        checks["meta_description_length"] = self.check_meta_length(post)
        checks["content_length"] = self.check_content_length(post)
        checks["internal_links"] = self.check_internal_links(post)
        checks["external_links"] = self.check_external_links(post)
        checks["headings_structure"] = self.check_headings(post)
        checks["image_alt_tags"] = self.check_image_alts(post)

        # Calculate total score (weighted average)
        total_score = sum(c.score for c in checks.values()) / len(checks) if checks else 0
        score = round(total_score)

        # Determine grade
        if score >= 80:
            grade = "A"
        elif score >= 60:
            grade = "B"
        elif score >= 40:
            grade = "C"
        elif score >= 20:
            grade = "D"
        else:
            grade = "F"

        # Collect suggestions from failed checks
        suggestions = [c.suggestion for c in checks.values() if not c.passed]

        return SEOResult(
            score=score,
            grade=grade,
            checks=checks,
            suggestions=suggestions,
            focus_keyword=focus_keyword
        )

    def _extract_focus_keyword(self, post: Dict[str, Any]) -> str:
        """Extract focus keyword from post SEO data or title."""
        seo = post.get("seo", {})
        if seo.get("keywords"):
            keywords = seo["keywords"]
            if isinstance(keywords, list) and keywords:
                return keywords[0].lower()
            elif isinstance(keywords, str):
                return keywords.split(",")[0].strip().lower()

        # Fall back to extracting from title
        title = post.get("title", "")
        # Extract longest meaningful word
        words = [w.lower() for w in title.split() if len(w) > 4]
        return words[0] if words else title.lower()[:20]

    def check_keyword_in_title(self, post: Dict[str, Any], keyword: str) -> SEOCheck:
        """Check if focus keyword appears in the title."""
        title = post.get("title", "").lower()
        keyword = keyword.lower()

        if keyword in title:
            return SEOCheck(
                name="Keyword in Title",
                passed=True,
                score=100,
                suggestion="",
                details=f"Focus keyword '{keyword}' found in title"
            )
        return SEOCheck(
            name="Keyword in Title",
            passed=False,
            score=0,
            suggestion=f"Add focus keyword '{keyword}' to your title",
            details="Focus keyword not found in title"
        )

    def check_keyword_in_url(self, post: Dict[str, Any], keyword: str) -> SEOCheck:
        """Check if focus keyword appears in the URL/slug."""
        slug = post.get("slug", "").lower().replace("-", " ")
        keyword = keyword.lower()

        if keyword in slug or keyword.replace(" ", "-") in post.get("slug", "").lower():
            return SEOCheck(
                name="Keyword in URL",
                passed=True,
                score=100,
                suggestion="",
                details=f"Focus keyword found in URL slug"
            )
        return SEOCheck(
            name="Keyword in URL",
            passed=False,
            score=0,
            suggestion=f"Include focus keyword '{keyword}' in your URL slug",
            details="Focus keyword not found in URL"
        )

    def check_keyword_in_intro(self, post: Dict[str, Any], keyword: str) -> SEOCheck:
        """Check if focus keyword appears in first 100 words."""
        content = post.get("content", "")
        # Strip HTML/markdown tags
        text = re.sub(r'<[^>]+>', '', content)
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'#+ ', '', text)

        words = text.split()[:100]
        first_100 = " ".join(words).lower()
        keyword = keyword.lower()

        if keyword in first_100:
            return SEOCheck(
                name="Keyword in Introduction",
                passed=True,
                score=100,
                suggestion="",
                details="Focus keyword appears in the first 100 words"
            )
        return SEOCheck(
            name="Keyword in Introduction",
            passed=False,
            score=0,
            suggestion=f"Add focus keyword '{keyword}' to your introduction (first 100 words)",
            details="Focus keyword not found in introduction"
        )

    def check_keyword_density(self, post: Dict[str, Any], keyword: str) -> SEOCheck:
        """Check keyword density (optimal: 1-2%)."""
        content = post.get("content", "")
        # Strip HTML/markdown
        text = re.sub(r'<[^>]+>', '', content).lower()
        text = re.sub(r'\[.*?\]', '', text)

        word_count = len(text.split())
        if word_count == 0:
            return SEOCheck(
                name="Keyword Density",
                passed=False,
                score=0,
                suggestion="Add content to your post",
                details="No content found"
            )

        # Count keyword occurrences (case-insensitive)
        keyword = keyword.lower()
        keyword_count = len(re.findall(re.escape(keyword), text))
        density = (keyword_count * len(keyword.split())) / word_count * 100

        if 1.0 <= density <= 2.5:
            return SEOCheck(
                name="Keyword Density",
                passed=True,
                score=100,
                suggestion="",
                details=f"Keyword density: {density:.1f}% (optimal)"
            )
        elif 0.5 <= density < 1.0:
            return SEOCheck(
                name="Keyword Density",
                passed=True,
                score=60,
                suggestion=f"Increase keyword usage slightly (current: {density:.1f}%)",
                details=f"Keyword density: {density:.1f}% (slightly low)"
            )
        elif 2.5 < density <= 3.5:
            return SEOCheck(
                name="Keyword Density",
                passed=True,
                score=60,
                suggestion=f"Reduce keyword usage slightly (current: {density:.1f}%)",
                details=f"Keyword density: {density:.1f}% (slightly high)"
            )
        elif density < 0.5:
            return SEOCheck(
                name="Keyword Density",
                passed=False,
                score=20,
                suggestion=f"Use focus keyword more often (current: {density:.1f}%, aim for 1-2%)",
                details=f"Keyword density: {density:.1f}% (too low)"
            )
        else:
            return SEOCheck(
                name="Keyword Density",
                passed=False,
                score=20,
                suggestion=f"Reduce keyword stuffing (current: {density:.1f}%, aim for 1-2%)",
                details=f"Keyword density: {density:.1f}% (too high)"
            )

    def check_title_length(self, post: Dict[str, Any]) -> SEOCheck:
        """Check SEO title length (optimal: 50-60 chars)."""
        seo = post.get("seo", {})
        seo_title = seo.get("title", "") or post.get("title", "")
        length = len(seo_title)

        if 50 <= length <= 60:
            return SEOCheck(
                name="SEO Title Length",
                passed=True,
                score=100,
                suggestion="",
                details=f"SEO title: {length} characters (optimal)"
            )
        elif 45 <= length < 50 or 60 < length <= 70:
            return SEOCheck(
                name="SEO Title Length",
                passed=True,
                score=70,
                suggestion=f"SEO title is {length} chars (aim for 50-60)",
                details=f"SEO title: {length} characters (acceptable)"
            )
        elif length < 45:
            return SEOCheck(
                name="SEO Title Length",
                passed=False,
                score=30,
                suggestion=f"SEO title too short ({length} chars). Aim for 50-60 characters",
                details=f"SEO title: {length} characters (too short)"
            )
        else:
            return SEOCheck(
                name="SEO Title Length",
                passed=False,
                score=30,
                suggestion=f"SEO title too long ({length} chars). Aim for 50-60 characters",
                details=f"SEO title: {length} characters (too long)"
            )

    def check_meta_length(self, post: Dict[str, Any]) -> SEOCheck:
        """Check meta description length (optimal: 120-160 chars)."""
        seo = post.get("seo", {})
        description = seo.get("description", "") or post.get("excerpt", "")
        length = len(description)

        if 120 <= length <= 160:
            return SEOCheck(
                name="Meta Description Length",
                passed=True,
                score=100,
                suggestion="",
                details=f"Meta description: {length} characters (optimal)"
            )
        elif 100 <= length < 120 or 160 < length <= 180:
            return SEOCheck(
                name="Meta Description Length",
                passed=True,
                score=70,
                suggestion=f"Meta description is {length} chars (aim for 120-160)",
                details=f"Meta description: {length} characters (acceptable)"
            )
        elif length < 100:
            return SEOCheck(
                name="Meta Description Length",
                passed=False,
                score=30,
                suggestion=f"Meta description too short ({length} chars). Aim for 120-160 characters",
                details=f"Meta description: {length} characters (too short)"
            )
        else:
            return SEOCheck(
                name="Meta Description Length",
                passed=False,
                score=30,
                suggestion=f"Meta description too long ({length} chars). Aim for 120-160 characters",
                details=f"Meta description: {length} characters (too long)"
            )

    def check_content_length(self, post: Dict[str, Any]) -> SEOCheck:
        """Check content length (optimal: 1500+ words)."""
        content = post.get("content", "")
        # Strip HTML/markdown
        text = re.sub(r'<[^>]+>', '', content)
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'#+ ', '', text)

        word_count = len(text.split())

        if word_count >= 2000:
            return SEOCheck(
                name="Content Length",
                passed=True,
                score=100,
                suggestion="",
                details=f"Content: {word_count:,} words (excellent)"
            )
        elif word_count >= 1500:
            return SEOCheck(
                name="Content Length",
                passed=True,
                score=90,
                suggestion="",
                details=f"Content: {word_count:,} words (good)"
            )
        elif word_count >= 1000:
            return SEOCheck(
                name="Content Length",
                passed=True,
                score=70,
                suggestion=f"Add more content ({word_count} words, aim for 1500+)",
                details=f"Content: {word_count:,} words (acceptable)"
            )
        elif word_count >= 500:
            return SEOCheck(
                name="Content Length",
                passed=False,
                score=40,
                suggestion=f"Content too short ({word_count} words). Aim for 1500+ words",
                details=f"Content: {word_count:,} words (short)"
            )
        else:
            return SEOCheck(
                name="Content Length",
                passed=False,
                score=10,
                suggestion=f"Content very short ({word_count} words). Add substantial content",
                details=f"Content: {word_count:,} words (very short)"
            )

    def check_internal_links(self, post: Dict[str, Any]) -> SEOCheck:
        """Check for internal links."""
        content = post.get("content", "")

        # Count internal links (jasperfinance.org or relative links)
        internal_patterns = [
            r'href=["\'](?:https?://)?(?:www\.)?jasperfinance\.org',
            r'href=["\']/(?!http)',  # Relative links
            r'\[.*?\]\(/[^)]+\)',  # Markdown relative links
        ]

        internal_count = 0
        for pattern in internal_patterns:
            internal_count += len(re.findall(pattern, content, re.IGNORECASE))

        if internal_count >= 2:
            return SEOCheck(
                name="Internal Links",
                passed=True,
                score=100,
                suggestion="",
                details=f"Found {internal_count} internal links"
            )
        elif internal_count == 1:
            return SEOCheck(
                name="Internal Links",
                passed=True,
                score=60,
                suggestion="Add more internal links (currently: 1)",
                details="Found 1 internal link"
            )
        else:
            return SEOCheck(
                name="Internal Links",
                passed=False,
                score=0,
                suggestion="Add internal links to other pages on your site",
                details="No internal links found"
            )

    def check_external_links(self, post: Dict[str, Any]) -> SEOCheck:
        """Check for external links."""
        content = post.get("content", "")

        # Count external links (not jasperfinance.org)
        all_links = re.findall(r'href=["\']https?://([^"\']+)', content, re.IGNORECASE)
        external_count = sum(1 for link in all_links if "jasperfinance.org" not in link.lower())

        # Also check markdown links
        md_links = re.findall(r'\[.*?\]\((https?://[^)]+)\)', content)
        external_count += sum(1 for link in md_links if "jasperfinance.org" not in link.lower())

        if external_count >= 1:
            return SEOCheck(
                name="External Links",
                passed=True,
                score=100,
                suggestion="",
                details=f"Found {external_count} external link(s)"
            )
        return SEOCheck(
            name="External Links",
            passed=False,
            score=0,
            suggestion="Add at least one external link to authoritative sources",
            details="No external links found"
        )

    def check_headings(self, post: Dict[str, Any]) -> SEOCheck:
        """Check headings structure (H2, H3 usage)."""
        content = post.get("content", "")

        # Count HTML headings
        h2_html = len(re.findall(r'<h2[^>]*>', content, re.IGNORECASE))
        h3_html = len(re.findall(r'<h3[^>]*>', content, re.IGNORECASE))

        # Count Markdown headings
        h2_md = len(re.findall(r'^## ', content, re.MULTILINE))
        h3_md = len(re.findall(r'^### ', content, re.MULTILINE))

        h2_count = h2_html + h2_md
        h3_count = h3_html + h3_md

        if h2_count >= 2 and h3_count >= 1:
            return SEOCheck(
                name="Headings Structure",
                passed=True,
                score=100,
                suggestion="",
                details=f"Good structure: {h2_count} H2, {h3_count} H3 headings"
            )
        elif h2_count >= 1:
            return SEOCheck(
                name="Headings Structure",
                passed=True,
                score=70,
                suggestion="Add more subheadings (H2, H3) to structure your content",
                details=f"Found {h2_count} H2, {h3_count} H3 headings"
            )
        return SEOCheck(
            name="Headings Structure",
            passed=False,
            score=20,
            suggestion="Add H2 and H3 headings to structure your content",
            details="No proper heading structure found"
        )

    def check_image_alts(self, post: Dict[str, Any]) -> SEOCheck:
        """Check if images have alt tags."""
        content = post.get("content", "")

        # Find all images
        img_tags = re.findall(r'<img[^>]*>', content, re.IGNORECASE)
        md_images = re.findall(r'!\[([^\]]*)\]\([^)]+\)', content)

        total_images = len(img_tags) + len(md_images)

        if total_images == 0:
            return SEOCheck(
                name="Image Alt Tags",
                passed=True,
                score=60,
                suggestion="Consider adding images to your content",
                details="No images found"
            )

        # Count images with alt text
        imgs_with_alt = len(re.findall(r'<img[^>]+alt=["\'][^"\']+["\']', content, re.IGNORECASE))
        md_with_alt = sum(1 for alt in md_images if alt.strip())  # Markdown alt in brackets

        images_with_alt = imgs_with_alt + md_with_alt
        missing = total_images - images_with_alt

        if missing == 0:
            return SEOCheck(
                name="Image Alt Tags",
                passed=True,
                score=100,
                suggestion="",
                details=f"All {total_images} images have alt tags"
            )
        elif images_with_alt > missing:
            return SEOCheck(
                name="Image Alt Tags",
                passed=True,
                score=60,
                suggestion=f"Add alt tags to {missing} image(s)",
                details=f"{missing} of {total_images} images missing alt tags"
            )
        return SEOCheck(
            name="Image Alt Tags",
            passed=False,
            score=20,
            suggestion=f"Add descriptive alt tags to {missing} image(s)",
            details=f"{missing} of {total_images} images missing alt tags"
        )

    def to_dict(self, result: SEOResult) -> Dict[str, Any]:
        """Convert SEOResult to dictionary for JSON serialization."""
        return {
            "score": result.score,
            "grade": result.grade,
            "focus_keyword": result.focus_keyword,
            "checks": {
                name: {
                    "name": check.name,
                    "passed": check.passed,
                    "score": check.score,
                    "suggestion": check.suggestion,
                    "details": check.details
                }
                for name, check in result.checks.items()
            },
            "suggestions": result.suggestions
        }


# Singleton instance
seo_scorer = SEOScorer()
