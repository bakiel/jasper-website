"""
JASPER CRM - Keyword Service

Enhanced keyword infrastructure that:
1. Loads keywords from sector-organized CSVs
2. Infers category from filename
3. Uses DeepSeek R1 for search intent/difficulty estimation
4. Provides unified keyword database for SEO agents

Integrates with existing /seo/ folder structure.
"""

import os
import csv
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from enum import Enum

from services.deepseek_router import deepseek_router, TaskType

logger = logging.getLogger(__name__)


# SEO folder location
SEO_FOLDER = Path("/Users/mac/Downloads/jasper-financial-architecture/seo")


class SearchIntent(str, Enum):
    """Search intent classification"""
    INFORMATIONAL = "informational"   # Learning, research
    COMMERCIAL = "commercial"         # Comparing options
    TRANSACTIONAL = "transactional"   # Ready to buy/hire
    NAVIGATIONAL = "navigational"     # Looking for specific site


class KeywordCategory(str, Enum):
    """JASPER keyword categories (derived from filenames)"""
    DFI_FUNDING = "dfi_funding"
    DFI_MODELING = "dfi_modeling"
    AGRIBUSINESS = "agribusiness"
    AGRICULTURE_AFRICA = "agriculture_africa"
    REAL_ESTATE = "real_estate"
    SOLAR = "solar"
    RENEWABLE_ENERGY = "renewable_energy"
    IPP = "ipp"
    WATER = "water"
    MINING = "mining"
    HEALTHCARE = "healthcare"
    INFRASTRUCTURE = "infrastructure"
    GENERAL = "general"


# Filename to category mapping
FILENAME_CATEGORY_MAP = {
    "DFI_funding": KeywordCategory.DFI_FUNDING,
    "DFI_financial_modeling": KeywordCategory.DFI_MODELING,
    "agribusiness_investment": KeywordCategory.AGRIBUSINESS,
    "agricultural_finance": KeywordCategory.AGRICULTURE_AFRICA,
    "real_estate": KeywordCategory.REAL_ESTATE,
    "solar_project": KeywordCategory.SOLAR,
    "renewable_energy": KeywordCategory.RENEWABLE_ENERGY,
    "IPP_financing": KeywordCategory.IPP,
    "water_infrastructure": KeywordCategory.WATER,
    "mining_project": KeywordCategory.MINING,
    "healthcare_infrastructure": KeywordCategory.HEALTHCARE,
    "infrastructure_project": KeywordCategory.INFRASTRUCTURE,
    "development_finance": KeywordCategory.DFI_FUNDING,
    "financial_modeling": KeywordCategory.DFI_MODELING,
}


class KeywordService:
    """
    Enhanced keyword management service.

    Loads from existing CSVs and enriches with:
    - Category inference from filename
    - AI-powered intent/difficulty estimation
    - Search functionality for SEO agents
    """

    def __init__(self):
        self.keywords: List[Dict[str, Any]] = []
        self.keywords_by_category: Dict[str, List[Dict[str, Any]]] = {}
        self.router = deepseek_router

        # Load keywords on init
        self._load_all_keywords()
        logger.info(f"KeywordService initialized with {len(self.keywords)} keywords")

    # =========================================================================
    # LOADING KEYWORDS FROM CSVs
    # =========================================================================

    def _load_all_keywords(self) -> None:
        """Load all keywords from sector CSVs."""
        if not SEO_FOLDER.exists():
            logger.warning(f"SEO folder not found: {SEO_FOLDER}")
            return

        csv_files = list(SEO_FOLDER.glob("*.csv"))

        for csv_file in csv_files:
            if csv_file.name == "MASTER_KEYWORDS_COMBINED.csv":
                continue  # Skip master, load from individual files for category

            category = self._infer_category(csv_file.name)
            keywords = self._load_csv(csv_file, category)

            self.keywords.extend(keywords)

            if category.value not in self.keywords_by_category:
                self.keywords_by_category[category.value] = []
            self.keywords_by_category[category.value].extend(keywords)

        logger.info(f"Loaded {len(self.keywords)} keywords from {len(csv_files)} files")

    def _infer_category(self, filename: str) -> KeywordCategory:
        """Infer category from filename."""
        for pattern, category in FILENAME_CATEGORY_MAP.items():
            if pattern.lower() in filename.lower():
                return category
        return KeywordCategory.GENERAL

    def _load_csv(self, filepath: Path, category: KeywordCategory) -> List[Dict[str, Any]]:
        """Load keywords from a single CSV file."""
        keywords = []

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    keyword_text = row.get("keyword", row.get("Keyword", "")).strip()
                    if not keyword_text or keyword_text.startswith("-"):
                        continue

                    keywords.append({
                        "keyword": keyword_text,
                        "category": category.value,
                        "source_file": filepath.name,
                        "volume": int(row.get("volume", 0) or 0),
                        "difficulty": int(row.get("difficulty", 50) or 50),
                        "intent": row.get("intent", None),
                        "enriched": False,
                    })
        except Exception as e:
            logger.error(f"Failed to load {filepath}: {e}")

        return keywords

    # =========================================================================
    # KEYWORD SEARCH & FILTERING
    # =========================================================================

    def search(
        self,
        query: str = None,
        category: str = None,
        intent: str = None,
        min_volume: int = None,
        max_difficulty: int = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Search keywords with filtering.

        Args:
            query: Text to search in keywords
            category: Filter by category
            intent: Filter by search intent
            min_volume: Minimum search volume
            max_difficulty: Maximum difficulty score
            limit: Max results

        Returns:
            List of matching keywords
        """
        results = self.keywords.copy()

        # Text search
        if query:
            query_lower = query.lower()
            results = [
                kw for kw in results
                if query_lower in kw["keyword"].lower()
            ]

        # Category filter
        if category:
            results = [kw for kw in results if kw["category"] == category]

        # Intent filter
        if intent:
            results = [kw for kw in results if kw.get("intent") == intent]

        # Volume filter
        if min_volume:
            results = [kw for kw in results if kw.get("volume", 0) >= min_volume]

        # Difficulty filter
        if max_difficulty:
            results = [kw for kw in results if kw.get("difficulty", 100) <= max_difficulty]

        return results[:limit]

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all keywords for a category."""
        return self.keywords_by_category.get(category, [])

    def get_categories(self) -> Dict[str, int]:
        """Get all categories with keyword counts."""
        return {
            cat: len(keywords)
            for cat, keywords in self.keywords_by_category.items()
        }

    # =========================================================================
    # AI ENRICHMENT (DeepSeek R1)
    # =========================================================================

    async def enrich_keyword(self, keyword: str) -> Dict[str, Any]:
        """
        Use DeepSeek R1 to analyze and enrich a single keyword.

        Returns estimated volume, difficulty, intent, and related keywords.
        """
        prompt = f"""Analyze this SEO keyword for a DFI/infrastructure finance consulting firm:

KEYWORD: "{keyword}"

CONTEXT: JASPER Financial Architecture helps clients access R10M-R2B+ in Development Finance Institution funding (IDC, DBSA, AfDB, IFC) for infrastructure projects in Africa.

Provide JSON analysis:
{{
    "keyword": "{keyword}",
    "estimated_volume": <monthly searches estimate: low=100, medium=500, high=2000>,
    "estimated_difficulty": <SEO difficulty 1-100>,
    "search_intent": "informational|commercial|transactional|navigational",
    "buyer_stage": "awareness|consideration|decision",
    "relevance_score": <1-10 relevance to DFI consulting>,
    "suggested_content_type": "blog|guide|case-study|landing-page",
    "related_keywords": ["<3-5 related keywords>"],
    "notes": "<brief analysis>"
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=500,
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

        # Fallback
        return {
            "keyword": keyword,
            "estimated_volume": 100,
            "estimated_difficulty": 50,
            "search_intent": "informational",
            "relevance_score": 5,
            "notes": "Could not analyze",
        }

    async def enrich_batch(
        self,
        keywords: List[str],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Enrich multiple keywords using AI."""
        results = []

        for keyword in keywords[:limit]:
            enriched = await self.enrich_keyword(keyword)
            results.append(enriched)

        return results

    # =========================================================================
    # KEYWORD RECOMMENDATIONS
    # =========================================================================

    async def recommend_for_topic(
        self,
        topic: str,
        category: str = None,
        count: int = 10,
    ) -> Dict[str, Any]:
        """
        Recommend keywords for a given topic/content piece.

        Uses existing keywords + AI suggestions.
        """
        # Find matching existing keywords
        existing_matches = self.search(
            query=topic,
            category=category,
            limit=20,
        )

        # Use AI to suggest additional keywords
        prompt = f"""Suggest SEO keywords for this content topic:

TOPIC: "{topic}"
{f"CATEGORY: {category}" if category else ""}

CONTEXT: JASPER Financial Architecture - DFI funding consultancy for African infrastructure projects.

We already have these related keywords:
{[kw["keyword"] for kw in existing_matches[:5]]}

Suggest 5-10 additional keywords we should target. Provide JSON:
{{
    "primary_keyword": "<main keyword to target>",
    "secondary_keywords": ["<supporting keywords>"],
    "long_tail_keywords": ["<longer, specific phrases>"],
    "questions": ["<question-based keywords>"],
    "content_angle": "<suggested content approach>"
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=500,
            temperature=0.5,
        )

        ai_suggestions = {}
        if result.get("content"):
            try:
                import json
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                ai_suggestions = json.loads(content.strip())
            except:
                pass

        return {
            "topic": topic,
            "existing_matches": existing_matches[:count],
            "ai_suggestions": ai_suggestions,
            "total_in_category": len(self.get_by_category(category)) if category else len(self.keywords),
        }

    # =========================================================================
    # KEYWORD GAP ANALYSIS
    # =========================================================================

    async def gap_analysis(
        self,
        competitor_url: str = None,
        sector: str = None,
    ) -> Dict[str, Any]:
        """
        Analyze keyword gaps - what we should target but don't have.
        """
        current_categories = self.get_categories()

        prompt = f"""Analyze SEO keyword gaps for a DFI/infrastructure finance consultancy:

CURRENT KEYWORD COVERAGE:
{current_categories}

{f"SECTOR FOCUS: {sector}" if sector else ""}

CONTEXT: JASPER Financial Architecture helps clients access IDC, DBSA, AfDB funding for:
- Infrastructure projects (R10M-R2B+)
- Agribusiness, Real Estate, Renewable Energy, Water, Mining, Healthcare

Identify gaps and opportunities. Provide JSON:
{{
    "underserved_topics": ["<topics we should cover but don't>"],
    "high_opportunity_keywords": ["<keywords with good volume/difficulty ratio>"],
    "trending_topics": ["<emerging topics in DFI/infrastructure finance>"],
    "content_gaps": ["<types of content we should create>"],
    "competitor_advantages": ["<what competitors likely rank for>"],
    "priority_actions": ["<top 3 SEO actions to take>"]
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=600,
            temperature=0.5,
        )

        analysis = {
            "current_coverage": current_categories,
            "total_keywords": len(self.keywords),
        }

        if result.get("content"):
            try:
                import json
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                analysis["gaps"] = json.loads(content.strip())
            except:
                analysis["gaps"] = {"error": "Could not parse analysis"}

        return analysis

    # =========================================================================
    # STATS & REPORTING
    # =========================================================================

    def get_stats(self) -> Dict[str, Any]:
        """Get keyword database statistics."""
        return {
            "total_keywords": len(self.keywords),
            "categories": self.get_categories(),
            "enriched_count": len([kw for kw in self.keywords if kw.get("enriched")]),
            "with_volume": len([kw for kw in self.keywords if kw.get("volume", 0) > 0]),
            "source_files": list(set(kw.get("source_file", "") for kw in self.keywords)),
        }


# Singleton instance
keyword_service = KeywordService()
