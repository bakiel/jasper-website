"""
JASPER CRM - Research Agent (DeepSeek R1 Powered)

Uses DeepSeek R1's search + reasoning capabilities for:
- Company research (web search → synthesis)
- DFI opportunity discovery
- Lead enrichment
- Market intelligence

R1's Multi-Step RAG Pipeline:
1. Query rewriting → optimized search terms
2. Web index lookup → select relevant URLs
3. Live crawling → fetch fresh content
4. Synthesis → reasoned answer with citations
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from services.deepseek_router import deepseek_router, TaskType

logger = logging.getLogger(__name__)


class ResearchAgent:
    """
    AI Research Agent using DeepSeek R1.

    Provides:
    - Light research: Quick company lookup
    - Deep research: Comprehensive analysis with web search
    - DFI discovery: Find relevant funding opportunities
    - Lead enrichment: Add context to leads
    """

    def __init__(self):
        self.router = deepseek_router
        logger.info("ResearchAgent initialized with DeepSeek R1")

    # =========================================================================
    # LIGHT RESEARCH (Quick lookup - no deep web search)
    # =========================================================================

    async def run_light(self, lead: Any) -> Any:
        """
        Run quick research on a lead.

        Light mode:
        - Basic company info
        - Industry/sector
        - Key contact verification
        - ~5 second response

        Args:
            lead: Lead object to research

        Returns:
            Lead with enriched data
        """
        logger.info(f"Running light research for lead: {getattr(lead, 'id', 'unknown')}")

        # Extract lead info
        company = getattr(lead, 'company', None) or getattr(lead, 'name', 'Unknown')
        email_domain = None
        if hasattr(lead, 'email') and lead.email:
            email_domain = lead.email.split('@')[1] if '@' in lead.email else None

        # Quick company lookup using V3.2 (faster, no web search)
        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=f"""Provide a brief overview of this company based on your knowledge:

Company: {company}
{f"Email domain: {email_domain}" if email_domain else ""}

Return JSON:
{{
    "company_name": "",
    "industry": "",
    "likely_size": "startup/sme/corporate",
    "description": "",
    "potential_dfi_fit": "high/medium/low",
    "suggested_approach": ""
}}

If you don't have information, make reasonable inferences from the name and domain.""",
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

                research_data = json.loads(content.strip())

                # Update lead with research
                if hasattr(lead, 'research_data'):
                    lead.research_data = research_data
                if hasattr(lead, 'sector') and not lead.sector:
                    lead.sector = research_data.get('industry')
                if hasattr(lead, 'company_size'):
                    lead.company_size = research_data.get('likely_size')

            except Exception as e:
                logger.error(f"Failed to parse light research: {e}")

        return lead

    # =========================================================================
    # DEEP RESEARCH (Full web search with R1)
    # =========================================================================

    async def run_deep(self, lead: Any) -> Any:
        """
        Run comprehensive research on a lead using DeepSeek R1 web search.

        Deep mode:
        - Full web search for company info
        - News and recent developments
        - Financial information
        - DFI/funding history
        - Key decision makers
        - ~30 second response

        Args:
            lead: Lead object to research

        Returns:
            Lead with comprehensive research data
        """
        logger.info(f"Running DEEP research for lead: {getattr(lead, 'id', 'unknown')}")

        company = getattr(lead, 'company', None) or getattr(lead, 'name', 'Unknown')
        sector = getattr(lead, 'sector', None)

        # Use R1 for web search + reasoning
        result = await self.router.research_company(
            company_name=company,
            additional_context=f"Sector: {sector}" if sector else None
        )

        if result.get("success") and result.get("company"):
            company_data = result["company"]

            # Update lead with research
            if hasattr(lead, 'research_data'):
                lead.research_data = company_data
            if hasattr(lead, 'sector') and company_data.get('industry'):
                lead.sector = company_data.get('industry')
            if hasattr(lead, 'company_size') and company_data.get('employees'):
                lead.company_size = company_data.get('employees')
            if hasattr(lead, 'key_contacts') and company_data.get('key_people'):
                lead.key_contacts = company_data.get('key_people')
            if hasattr(lead, 'recent_news') and company_data.get('recent_news'):
                lead.recent_news = company_data.get('recent_news')

            # Store reasoning for reference
            if hasattr(lead, 'research_reasoning'):
                lead.research_reasoning = result.get('reasoning')

        return lead

    # =========================================================================
    # DFI OPPORTUNITY DISCOVERY
    # =========================================================================

    async def find_dfi_opportunities(
        self,
        sector: Optional[str] = None,
        region: str = "South Africa",
        funding_range: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for DFI funding opportunities using R1.

        Args:
            sector: Target sector
            region: Geographic focus
            funding_range: Funding amount range

        Returns:
            List of opportunities with relevance scores
        """
        logger.info(f"Searching DFI opportunities: sector={sector}, region={region}")

        result = await self.router.discover_dfi_opportunities(
            sector=sector,
            region=region,
            funding_range=funding_range
        )

        if result.get("success") and result.get("opportunities"):
            return result["opportunities"]

        return []

    # =========================================================================
    # LEAD ENRICHMENT
    # =========================================================================

    async def enrich_lead(self, lead: Any) -> Dict[str, Any]:
        """
        Enrich a lead with additional context and research.

        Combines:
        - Company research
        - Contact verification
        - DFI opportunity matching
        - Suggested approach

        Args:
            lead: Lead to enrich

        Returns:
            Dict with enrichment data
        """
        logger.info(f"Enriching lead: {getattr(lead, 'id', 'unknown')}")

        enrichment = {
            "lead_id": getattr(lead, 'id', None),
            "enriched_at": datetime.utcnow().isoformat(),
            "company_research": None,
            "dfi_matches": [],
            "suggested_approach": None,
            "confidence": "low",
        }

        # Company research
        company = getattr(lead, 'company', None)
        if company:
            result = await self.router.research_company(company)
            if result.get("success"):
                enrichment["company_research"] = result.get("company")
                enrichment["confidence"] = result.get("company", {}).get("confidence", "medium")

        # Find matching DFI opportunities
        sector = getattr(lead, 'sector', None)
        deal_size = getattr(lead, 'deal_size', None)

        if sector or deal_size:
            funding_range = None
            if deal_size:
                if deal_size < 10_000_000:
                    funding_range = "R1M-R10M"
                elif deal_size < 50_000_000:
                    funding_range = "R10M-R50M"
                elif deal_size < 200_000_000:
                    funding_range = "R50M-R200M"
                else:
                    funding_range = "R200M+"

            opportunities = await self.find_dfi_opportunities(
                sector=sector,
                funding_range=funding_range
            )

            if opportunities:
                # Filter to top 3 most relevant
                enrichment["dfi_matches"] = sorted(
                    opportunities,
                    key=lambda x: x.get("relevance_score", 0),
                    reverse=True
                )[:3]

        # Generate suggested approach
        if enrichment["company_research"]:
            approach = await self._generate_approach(lead, enrichment)
            enrichment["suggested_approach"] = approach

        return enrichment

    async def _generate_approach(
        self,
        lead: Any,
        enrichment: Dict[str, Any]
    ) -> str:
        """Generate a suggested sales approach based on research."""

        company_data = enrichment.get("company_research", {})
        dfi_matches = enrichment.get("dfi_matches", [])

        prompt = f"""Based on this research, suggest an approach for engaging this lead:

LEAD:
- Name: {getattr(lead, 'name', 'Unknown')}
- Company: {getattr(lead, 'company', 'Unknown')}
- Sector: {getattr(lead, 'sector', 'Unknown')}
- Deal Size: R{getattr(lead, 'deal_size', 0):,.0f}

COMPANY RESEARCH:
{company_data}

MATCHING DFI OPPORTUNITIES:
{dfi_matches}

Provide a 2-3 sentence suggested approach for the sales call/email.
Focus on:
1. Key pain point to address
2. Relevant JASPER service to highlight
3. Specific DFI to mention if applicable"""

        result = await self.router.route(
            task=TaskType.CHAT,
            prompt=prompt,
            max_tokens=300,
            temperature=0.7,
        )

        return result.get("content", "")

    # =========================================================================
    # WEB SEARCH (Direct)
    # =========================================================================

    async def search(
        self,
        query: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Direct web search using R1.

        Args:
            query: Search query
            context: Additional context

        Returns:
            Dict with answer and sources
        """
        return await self.router.search_web(query, context)


# Singleton instance
research_agent = ResearchAgent()
