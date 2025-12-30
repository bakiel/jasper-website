"""
JASPER CRM - Research Service with Gemini Grounding

Research-grounded content generation using Gemini 3.0 Flash Preview
with Google Search grounding for real, verifiable sources.

Features:
- Web research with Google Search grounding
- Source extraction and citation generation
- DFI-specific research capabilities
- Fact verification for articles

API: Direct Google Gemini API (not OpenRouter)
Grounding: Google Search built-in to Gemini 3.0 Flash Preview
Cost: ~$35 per 1,000 grounded prompts (Gemini 3.0)

Reference: https://ai.google.dev/gemini-api/docs/google-search
"""

import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class GroundingSource:
    """A source from Google Search grounding"""
    title: str
    url: str
    snippet: Optional[str] = None
    accessed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class ResearchResult:
    """Result of a research query with grounding"""
    content: str
    sources: List[GroundingSource]
    search_queries: List[str]
    citations_text: str  # Content with inline citations
    confidence_score: float = 0.0
    researched_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ResearchService:
    """
    Research service using Gemini with Google Search grounding.

    Provides verified, source-backed research for article generation.
    Every fact returned is grounded by real web search results.
    """

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = "gemini-3.0-flash-preview"  # Supports grounding

        # Initialize Google AI client
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"ResearchService initialized with {self.model}")
            except ImportError:
                logger.error("google-genai not installed, research features disabled")
        else:
            logger.warning("GOOGLE_API_KEY not set, research features disabled")

    async def research_topic(
        self,
        topic: str,
        context: str = "",
        focus_areas: Optional[List[str]] = None,
    ) -> ResearchResult:
        """
        Research a topic using Gemini with Google Search grounding.

        Args:
            topic: The topic to research
            context: Additional context for the research
            focus_areas: Specific areas to focus on (e.g., ["funding", "regulations"])

        Returns:
            ResearchResult with content, sources, and citations
        """
        if not self.client:
            return ResearchResult(
                content="Research service not available (GOOGLE_API_KEY not configured)",
                sources=[],
                search_queries=[],
                citations_text="",
                confidence_score=0.0,
            )

        try:
            from google.genai import types

            # Build research prompt
            focus_str = ""
            if focus_areas:
                focus_str = f"\n\nFocus particularly on: {', '.join(focus_areas)}"

            prompt = f"""Research this topic thoroughly for a professional DFI investment article:

Topic: {topic}
Context: {context}
{focus_str}

Provide:
1. Key facts and statistics with specific numbers
2. Recent developments (2024-2025)
3. Expert quotes or institutional sources (World Bank, IFC, AfDB, IDC, DBSA, etc.)
4. Market data and trends relevant to South African and African markets
5. DFI funding opportunities and requirements

Be specific with data - include actual figures, dates, and attribution.
"""

            # Configure Google Search grounding
            grounding_tool = types.Tool(
                google_search=types.GoogleSearch()
            )

            config = types.GenerateContentConfig(
                tools=[grounding_tool],
                temperature=0.5,
                max_output_tokens=2000,
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )

            # Extract grounding metadata
            sources = []
            search_queries = []

            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    gm = candidate.grounding_metadata

                    # Extract search queries used
                    if gm.web_search_queries:
                        search_queries = list(gm.web_search_queries)

                    # Extract sources
                    sources = self._extract_sources(gm)

            # Generate citations text
            citations_text = self._add_citations(response)

            # Calculate confidence based on source count
            confidence = min(1.0, len(sources) * 0.15)  # 0.15 per source, max 1.0

            return ResearchResult(
                content=response.text,
                sources=sources,
                search_queries=search_queries,
                citations_text=citations_text,
                confidence_score=confidence,
            )

        except Exception as e:
            logger.error(f"Research failed: {e}")
            return ResearchResult(
                content=f"Research failed: {str(e)}",
                sources=[],
                search_queries=[],
                citations_text="",
                confidence_score=0.0,
            )

    async def research_dfi(
        self,
        dfi_name: str,
        sector: Optional[str] = None,
    ) -> ResearchResult:
        """
        Research a specific DFI (Development Finance Institution).

        Args:
            dfi_name: Name of the DFI (e.g., "IDC", "DBSA", "IFC")
            sector: Optional sector focus

        Returns:
            ResearchResult with DFI information, funding criteria, and opportunities
        """
        focus_areas = [
            "funding criteria and requirements",
            "recent funding announcements",
            "application process",
            "contact information",
            "typical deal sizes",
        ]

        context = f"Focus on {sector} sector funding" if sector else "General funding information"

        return await self.research_topic(
            topic=f"{dfi_name} DFI funding opportunities and criteria",
            context=context,
            focus_areas=focus_areas,
        )

    async def research_sector(
        self,
        sector: str,
        region: str = "South Africa",
    ) -> ResearchResult:
        """
        Research a sector for DFI funding opportunities.

        Args:
            sector: The sector to research (e.g., "renewable energy", "infrastructure")
            region: Geographic focus

        Returns:
            ResearchResult with sector analysis and funding landscape
        """
        focus_areas = [
            "current market size and growth",
            "DFI activity in the sector",
            "key projects and investments",
            "policy and regulatory environment",
            "funding gaps and opportunities",
        ]

        return await self.research_topic(
            topic=f"{sector} sector investment and DFI funding in {region}",
            context=f"Analysis for project finance and DFI funding in {region}",
            focus_areas=focus_areas,
        )

    async def verify_claim(
        self,
        claim: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Verify a specific claim using Google Search grounding.

        Args:
            claim: The claim to verify
            context: Additional context

        Returns:
            Dict with verification status, sources, and confidence
        """
        if not self.client:
            return {
                "verified": False,
                "error": "Research service not available",
                "confidence": 0.0,
            }

        try:
            from google.genai import types

            prompt = f"""Verify this claim using web search:

Claim: {claim}
{f"Context: {context}" if context else ""}

Respond with:
1. VERIFIED or UNVERIFIED or PARTIALLY VERIFIED
2. Evidence supporting or refuting the claim
3. Correct information if the claim is inaccurate
4. Sources that support your verification
"""

            grounding_tool = types.Tool(
                google_search=types.GoogleSearch()
            )

            config = types.GenerateContentConfig(
                tools=[grounding_tool],
                temperature=0.2,  # Lower temperature for fact-checking
                max_output_tokens=800,
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )

            content = response.text.upper()

            # Determine verification status
            if "VERIFIED" in content and "UNVERIFIED" not in content and "PARTIALLY" not in content:
                status = "verified"
                confidence = 0.9
            elif "PARTIALLY" in content:
                status = "partially_verified"
                confidence = 0.6
            else:
                status = "unverified"
                confidence = 0.3

            # Extract sources
            sources = []
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    sources = self._extract_sources(candidate.grounding_metadata)

            return {
                "verified": status == "verified",
                "status": status,
                "explanation": response.text,
                "sources": [{"title": s.title, "url": s.url} for s in sources],
                "confidence": confidence,
            }

        except Exception as e:
            logger.error(f"Claim verification failed: {e}")
            return {
                "verified": False,
                "error": str(e),
                "confidence": 0.0,
            }

    def _extract_sources(self, grounding_metadata) -> List[GroundingSource]:
        """Extract source URLs and titles from grounding chunks."""
        sources = []

        if hasattr(grounding_metadata, 'grounding_chunks') and grounding_metadata.grounding_chunks:
            for chunk in grounding_metadata.grounding_chunks:
                if hasattr(chunk, 'web') and chunk.web:
                    sources.append(GroundingSource(
                        title=getattr(chunk.web, 'title', 'Source'),
                        url=getattr(chunk.web, 'uri', ''),
                        snippet=getattr(chunk.web, 'snippet', None),
                    ))

        return sources

    def _add_citations(self, response) -> str:
        """Add inline citations linking text to sources."""
        text = response.text

        if not hasattr(response, 'candidates') or not response.candidates:
            return text

        candidate = response.candidates[0]
        if not hasattr(candidate, 'grounding_metadata') or not candidate.grounding_metadata:
            return text

        metadata = candidate.grounding_metadata
        supports = getattr(metadata, 'grounding_supports', None) or []
        chunks = getattr(metadata, 'grounding_chunks', None) or []

        if not supports or not chunks:
            return text

        # Sort by end_index descending to avoid shifting indices
        sorted_supports = sorted(
            [s for s in supports if hasattr(s, 'segment') and s.segment],
            key=lambda s: getattr(s.segment, 'end_index', 0),
            reverse=True
        )

        for support in sorted_supports:
            end_index = getattr(support.segment, 'end_index', None)
            if end_index is None:
                continue

            chunk_indices = getattr(support, 'grounding_chunk_indices', None)
            if chunk_indices:
                citation_links = []
                for i in chunk_indices:
                    if i < len(chunks) and hasattr(chunks[i], 'web') and chunks[i].web:
                        uri = getattr(chunks[i].web, 'uri', '')
                        if uri:
                            citation_links.append(f"[{i + 1}]")

                if citation_links:
                    citation_string = " " + ", ".join(citation_links)
                    text = text[:end_index] + citation_string + text[end_index:]

        return text

    def format_sources_markdown(self, sources: List[GroundingSource]) -> str:
        """Format sources as markdown reference list."""
        if not sources:
            return ""

        lines = ["## Sources", ""]
        for i, source in enumerate(sources, 1):
            lines.append(f"{i}. [{source.title}]({source.url})")

        return "\n".join(lines)

    def format_sources_html(self, sources: List[GroundingSource]) -> str:
        """Format sources as HTML reference list."""
        if not sources:
            return ""

        items = []
        for source in sources:
            items.append(f'<li><a href="{source.url}" target="_blank" rel="noopener">{source.title}</a></li>')

        return f'<h3>Sources</h3><ol>{"".join(items)}</ol>'


# Singleton instance
research_service = ResearchService()
