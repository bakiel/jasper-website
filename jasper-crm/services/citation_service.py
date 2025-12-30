"""
JASPER CRM - Citation Service

Extracts facts from articles and generates authoritative citations using
Gemini 2.0 Flash with Google Search grounding.

Features:
- Fact extraction from article content
- Automatic source discovery via Google Search
- Inline footnote generation
- Source registry for reuse
- Prefers authoritative DFI/academic sources
"""

import os
import json
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

from services.ai_router import AIRouter, AITask

logger = logging.getLogger(__name__)


class CitationService:
    """Service for managing article citations and sources"""

    def __init__(self):
        self.ai_router = AIRouter()
        self.data_dir = Path("/opt/jasper-crm/data")
        self.source_registry_path = self.data_dir / "source_registry.json"
        self.blog_posts_path = self.data_dir / "blog_posts.json"

        # Initialize source registry
        self._load_source_registry()

    def _load_source_registry(self):
        """Load or initialize source registry"""
        if self.source_registry_path.exists():
            try:
                with open(self.source_registry_path, 'r') as f:
                    self.source_registry = json.load(f)
            except Exception as e:
                logger.error(f"Error loading source registry: {e}")
                self.source_registry = {"sources": [], "last_updated": None}
        else:
            self.source_registry = {"sources": [], "last_updated": None}

    def _save_source_registry(self):
        """Save source registry to disk"""
        try:
            self.source_registry["last_updated"] = datetime.utcnow().isoformat()
            with open(self.source_registry_path, 'w') as f:
                json.dump(self.source_registry, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving source registry: {e}")

    def _add_to_registry(self, sources: List[Dict[str, str]]):
        """Add new sources to registry (avoid duplicates)"""
        existing_urls = {s.get("url") for s in self.source_registry["sources"]}

        new_sources = []
        for source in sources:
            if source.get("url") and source["url"] not in existing_urls:
                new_sources.append({
                    "title": source.get("title", "Source"),
                    "url": source["url"],
                    "added_at": datetime.utcnow().isoformat(),
                })
                existing_urls.add(source["url"])

        if new_sources:
            self.source_registry["sources"].extend(new_sources)
            self._save_source_registry()
            logger.info(f"Added {len(new_sources)} new sources to registry")

    def _load_blog_post(self, slug: str) -> Optional[Dict]:
        """Load blog post by slug"""
        try:
            with open(self.blog_posts_path, 'r') as f:
                posts = json.load(f)

            for post in posts:
                if post.get("slug") == slug:
                    return post

            return None
        except Exception as e:
            logger.error(f"Error loading blog post {slug}: {e}")
            return None

    def _save_blog_post(self, updated_post: Dict):
        """Save updated blog post"""
        try:
            with open(self.blog_posts_path, 'r') as f:
                posts = json.load(f)

            # Find and update the post
            for i, post in enumerate(posts):
                if post.get("slug") == updated_post.get("slug"):
                    posts[i] = updated_post
                    break

            with open(self.blog_posts_path, 'w') as f:
                json.dump(posts, f, indent=2)

            logger.info(f"Saved updated post: {updated_post.get('slug')}")
        except Exception as e:
            logger.error(f"Error saving blog post: {e}")
            raise

    async def analyze_article(self, slug: str) -> Dict[str, Any]:
        """
        Analyze article content to identify facts that need citations.

        Returns:
            Dict with facts that need citations and recommended authoritative sources
        """
        post = self._load_blog_post(slug)
        if not post:
            return {"error": f"Article {slug} not found"}

        content = post.get("content", "")
        title = post.get("title", "")

        # Extract facts using Gemini with grounding
        system_prompt = """You are an academic fact-checker. Analyze the article and identify claims that need authoritative citations.

Focus on:
- Statistical claims (percentages, amounts, growth rates)
- Policy statements or regulations
- DFI/financial institution funding programs
- Market size or economic data
- Technical specifications or standards

For each claim:
1. Extract the exact sentence or claim
2. Identify what type of authoritative source would validate it (e.g., "World Bank report", "IDC annual report", "academic study")
3. Assess citation urgency (high/medium/low)

Prefer sources from: IFC, AfDB, World Bank, DBSA, IDC, OECD, academic journals, government statistics.

Return JSON format:
{
  "needs_citation": [
    {
      "claim": "exact text from article",
      "location": "paragraph number or section",
      "source_type": "type of source needed",
      "urgency": "high/medium/low",
      "reason": "why this needs citation"
    }
  ]
}"""

        prompt = f"""Article Title: {title}

Content:
{content}

Identify all claims that need citations."""

        try:
            result = await self.ai_router.route(
                task=AITask.RESEARCH,
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=2000,
                temperature=0.3,
                enable_search=True,
            )

            if result.get("error"):
                return {"error": result["error"]}

            # Parse JSON response
            response_text = result.get("content", "")

            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)

            analysis = json.loads(response_text)

            # Add grounding sources if available
            if result.get("grounding"):
                analysis["grounding_sources"] = result["grounding"]["sources"]
                self._add_to_registry(result["grounding"]["sources"])

            return {
                "slug": slug,
                "title": title,
                "analysis": analysis,
                "model": result.get("model"),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse analysis JSON: {e}")
            return {"error": "Failed to parse analysis response", "raw_response": result.get("content")}
        except Exception as e:
            logger.error(f"Error analyzing article: {e}")
            return {"error": str(e)}

    async def find_sources_for_claim(self, claim: str, source_type: str) -> Dict[str, Any]:
        """
        Find authoritative sources for a specific claim using Google Search grounding.

        Args:
            claim: The claim text to validate
            source_type: Type of source needed (e.g., "World Bank report")

        Returns:
            Dict with sources and citation text
        """
        system_prompt = f"""You are a research assistant specializing in finding authoritative sources.

Find the most credible source for the following claim, preferably from:
- Development Finance Institutions (IFC, AfDB, World Bank, DBSA, IDC)
- Academic journals and research papers
- Government statistics offices
- International organizations (OECD, IMF, UN agencies)

Provide:
1. The most authoritative source you found
2. A brief citation sentence that naturally incorporates the source
3. The specific URL if available

Focus on {source_type} sources."""

        prompt = f"""Claim: "{claim}"

Find the most authoritative source to validate this claim and provide a natural citation sentence."""

        try:
            result = await self.ai_router.route(
                task=AITask.RESEARCH,
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=1000,
                temperature=0.2,
                enable_search=True,
            )

            if result.get("error"):
                return {"error": result["error"]}

            sources = []
            if result.get("grounding"):
                sources = result["grounding"]["sources"]
                self._add_to_registry(sources)

            return {
                "claim": claim,
                "citation_text": result.get("content"),
                "sources": sources,
                "model": result.get("model"),
            }

        except Exception as e:
            logger.error(f"Error finding sources: {e}")
            return {"error": str(e)}

    async def add_citations(
        self,
        slug: str,
        citation_style: str = "inline",
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Add citations to an article.

        Args:
            slug: Article slug
            citation_style: "inline" (text with links) or "footnotes" (numbered references)
            dry_run: If True, preview only without saving

        Returns:
            Dict with updated content and metadata
        """
        post = self._load_blog_post(slug)
        if not post:
            return {"error": f"Article {slug} not found"}

        # First analyze to find what needs citations
        analysis_result = await self.analyze_article(slug)
        if analysis_result.get("error"):
            return analysis_result

        analysis = analysis_result.get("analysis", {})
        needs_citation = analysis.get("needs_citation", [])

        if not needs_citation:
            return {
                "slug": slug,
                "message": "No claims requiring citations were found",
                "needs_citation": []
            }

        # Find sources for each claim
        citations_added = []
        updated_content = post.get("content", "")

        for item in needs_citation:
            claim = item.get("claim", "")
            source_type = item.get("source_type", "authoritative source")

            # Find source
            source_result = await self.find_sources_for_claim(claim, source_type)

            if source_result.get("sources"):
                # Get first source
                source = source_result["sources"][0]

                # Generate citation based on style
                if citation_style == "inline":
                    # Inline: "According to [World Bank](url), ..."
                    citation = f"According to [{source['title']}]({source['url']}), "

                    # Try to insert citation before the claim
                    if claim in updated_content:
                        updated_content = updated_content.replace(
                            claim,
                            f"{citation}{claim}",
                            1  # Only replace first occurrence
                        )
                        citations_added.append({
                            "claim": claim,
                            "source": source,
                            "style": "inline"
                        })
                elif citation_style == "footnotes":
                    # Footnotes: claim^[1] with references at bottom
                    footnote_num = len(citations_added) + 1
                    if claim in updated_content:
                        updated_content = updated_content.replace(
                            claim,
                            f"{claim}^[{footnote_num}]",
                            1
                        )
                        citations_added.append({
                            "claim": claim,
                            "source": source,
                            "style": "footnote",
                            "number": footnote_num
                        })

        # Add footnotes section if using footnote style
        if citation_style == "footnotes" and citations_added:
            footnotes_section = "\n\n## References\n\n"
            for citation in citations_added:
                if citation.get("style") == "footnote":
                    source = citation["source"]
                    footnotes_section += f"{citation['number']}. [{source['title']}]({source['url']})\n"

            updated_content += footnotes_section

        result = {
            "slug": slug,
            "title": post.get("title"),
            "citations_added": len(citations_added),
            "citations": citations_added,
            "preview": updated_content if dry_run else None,
        }

        # Save if not dry run
        if not dry_run and citations_added:
            post["content"] = updated_content
            post["updated_at"] = datetime.utcnow().isoformat()
            post["metadata"] = post.get("metadata", {})
            post["metadata"]["citations_added"] = len(citations_added)
            post["metadata"]["last_citation_update"] = datetime.utcnow().isoformat()

            self._save_blog_post(post)
            result["saved"] = True
        else:
            result["saved"] = False

        return result

    def get_source_registry(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Get source registry entries.

        Args:
            limit: Optional limit on number of sources returned

        Returns:
            Dict with sources and metadata
        """
        sources = self.source_registry.get("sources", [])

        if limit:
            sources = sources[-limit:]  # Get most recent

        return {
            "total_sources": len(self.source_registry.get("sources", [])),
            "sources": sources,
            "last_updated": self.source_registry.get("last_updated"),
        }

    def search_sources(self, query: str) -> List[Dict[str, str]]:
        """
        Search source registry for relevant sources.

        Args:
            query: Search query

        Returns:
            List of matching sources
        """
        query_lower = query.lower()
        sources = self.source_registry.get("sources", [])

        matches = []
        for source in sources:
            title = source.get("title", "").lower()
            url = source.get("url", "").lower()

            if query_lower in title or query_lower in url:
                matches.append(source)

        return matches


# Singleton instance
_citation_service: Optional[CitationService] = None


def get_citation_service() -> CitationService:
    """Get or create citation service singleton"""
    global _citation_service
    if _citation_service is None:
        _citation_service = CitationService()
    return _citation_service
