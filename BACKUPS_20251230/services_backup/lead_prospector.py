"""
JASPER Lead Prospector Service
Actively finds and creates leads from news, company databases, and web sources.
"""

import os
import re
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
import httpx
from services.logging_service import get_logger
from services.news_monitor import news_monitor, NewsItem

logger = get_logger(__name__)


@dataclass
class ProspectLead:
    """A potential lead identified from prospecting"""
    company_name: str
    source: str  # news, web_scrape, referral
    source_url: str
    relevance_score: float
    sector: str
    deal_indicators: List[str] = field(default_factory=list)
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    company_website: Optional[str] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)


# Keywords that indicate a company is seeking funding or development
FUNDING_INDICATORS = [
    "seeking funding", "capital raise", "investment", "expansion",
    "new project", "development", "infrastructure", "renewable energy",
    "solar", "wind", "agriculture", "agri-processing", "manufacturing",
    "announces", "launches", "plans to build", "secures funding",
    "partnership", "joint venture", "MOU", "memorandum",
]

# SA company suffixes
COMPANY_PATTERNS = [
    r'\b([A-Z][A-Za-z\s]+(?:Pty|PTY)?\s*(?:Ltd|LTD|Limited))\b',
    r'\b([A-Z][A-Za-z\s]+(?:Holdings|Group|Corporation|Corp|Inc))\b',
    r'\b([A-Z][A-Za-z]+\s+(?:Energy|Power|Solar|Wind|Agri|Farm))\b',
]


class LeadProspectorService:
    """
    Actively prospects for leads from multiple sources.

    Sources:
    1. News articles (via NewsMonitor)
    2. Company databases
    3. Government tenders
    4. Industry directories
    """

    def __init__(self):
        self.crm_api_url = os.getenv("CRM_API_URL", "http://localhost:8001/api/v1")
        self.prospects: Dict[str, ProspectLead] = {}
        self._running = False

    def _generate_prospect_id(self, company_name: str, source: str) -> str:
        """Generate unique ID for prospect"""
        content = f"{company_name.lower().strip()}:{source}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def _extract_companies(self, text: str) -> List[str]:
        """Extract company names from text"""
        companies = set()

        for pattern in COMPANY_PATTERNS:
            matches = re.findall(pattern, text)
            for match in matches:
                company = match.strip()
                # Filter out common false positives
                if len(company) > 5 and company not in [
                    "South Africa", "African Development", "World Bank",
                    "Government", "Department", "Ministry"
                ]:
                    companies.add(company)

        return list(companies)

    def _calculate_deal_likelihood(self, text: str) -> tuple[float, List[str]]:
        """Calculate likelihood this company needs DFI funding"""
        text_lower = text.lower()
        score = 0.0
        indicators = []

        for indicator in FUNDING_INDICATORS:
            if indicator in text_lower:
                score += 10
                indicators.append(indicator)

        # Bonus for specific sectors
        sector_bonuses = {
            "renewable": 15, "solar": 15, "wind": 15,
            "infrastructure": 20, "agriculture": 15,
            "manufacturing": 15, "export": 10,
            "idc": 25, "afdb": 25, "ifc": 25, "dbsa": 25,
        }

        for sector, bonus in sector_bonuses.items():
            if sector in text_lower:
                score += bonus
                indicators.append(f"sector:{sector}")

        # Bonus for funding amounts
        if re.search(r'\b\d+\s*(million|billion|m|bn|rand|dollar|usd)\b', text_lower, re.I):
            score += 20
            indicators.append("funding_amount_mentioned")

        return min(score, 100.0), indicators

    def _detect_sector(self, text: str) -> str:
        """Detect primary sector from text"""
        text_lower = text.lower()

        sectors = {
            "Renewable Energy": ["renewable", "solar", "wind", "ipp", "reippp", "energy", "power"],
            "Infrastructure": ["infrastructure", "road", "water", "sanitation", "construction"],
            "Agriculture": ["agriculture", "farming", "agri", "crop", "livestock", "irrigation"],
            "Manufacturing": ["manufacturing", "factory", "production", "industrial"],
            "Technology": ["technology", "tech", "digital", "software", "data"],
            "Mining": ["mining", "mineral", "extraction"],
        }

        for sector, keywords in sectors.items():
            for kw in keywords:
                if kw in text_lower:
                    return sector

        return "General"

    async def prospect_from_news(self, news_item: NewsItem) -> List[ProspectLead]:
        """Extract potential leads from a news item"""
        prospects = []

        full_text = f"{news_item.title} {news_item.summary}"
        companies = self._extract_companies(full_text)

        for company in companies:
            score, indicators = self._calculate_deal_likelihood(full_text)

            if score >= 30:  # Only create prospect if score is reasonable
                prospect_id = self._generate_prospect_id(company, "news")

                if prospect_id not in self.prospects:
                    prospect = ProspectLead(
                        company_name=company,
                        source="news",
                        source_url=news_item.link,
                        relevance_score=score,
                        sector=self._detect_sector(full_text),
                        deal_indicators=indicators,
                        notes=f"Found in: {news_item.title[:100]}... Source: {news_item.source}"
                    )

                    prospects.append(prospect)
                    self.prospects[prospect_id] = prospect
                    logger.info(f"New prospect from news: {company} (score: {score})")

        return prospects

    async def enrich_prospect(self, prospect: ProspectLead) -> ProspectLead:
        """
        Attempt to enrich prospect with additional data.
        Uses public sources to find contact info and company details.
        """
        try:
            # Try to find company website
            search_query = f"{prospect.company_name} South Africa contact"

            # This would use a search API in production
            # For now, we'll construct likely domain patterns
            company_slug = re.sub(r'[^a-zA-Z0-9]', '', prospect.company_name.lower())
            likely_domains = [
                f"https://{company_slug}.co.za",
                f"https://www.{company_slug}.co.za",
                f"https://{company_slug}.com",
            ]

            async with httpx.AsyncClient(timeout=10.0) as client:
                for domain in likely_domains[:1]:  # Check first domain only to avoid spam
                    try:
                        resp = await client.head(domain, follow_redirects=True)
                        if resp.status_code == 200:
                            prospect.company_website = str(resp.url)
                            break
                    except:
                        pass

            # Generate likely contact email patterns
            if prospect.company_website:
                domain = prospect.company_website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
                prospect.contact_email = f"info@{domain}"

            return prospect

        except Exception as e:
            logger.error(f"Error enriching prospect: {e}")
            return prospect

    async def create_lead_in_crm(self, prospect: ProspectLead) -> Optional[str]:
        """Create a lead in the CRM from a prospect"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                lead_data = {
                    "company_name": prospect.company_name,
                    "email": prospect.contact_email or f"prospect-{hash(prospect.company_name) % 10000}@prospecting.jasper",
                    "source": f"auto_prospect:{prospect.source}",
                    "sector": prospect.sector,
                    "score": int(prospect.relevance_score),
                    "tier": "warm" if prospect.relevance_score >= 50 else "cold",
                    "status": "new",
                    "notes": f"Auto-prospected lead.\n\nSource: {prospect.source_url}\n\nIndicators: {', '.join(prospect.deal_indicators)}\n\n{prospect.notes}",
                    "research_status": "pending",
                }

                if prospect.contact_name:
                    lead_data["contact_name"] = prospect.contact_name
                if prospect.contact_phone:
                    lead_data["phone"] = prospect.contact_phone

                response = await client.post(
                    f"{self.crm_api_url}/leads",
                    json=lead_data,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    lead_id = result.get("lead", {}).get("id")
                    logger.info(f"Created CRM lead: {lead_id} for {prospect.company_name}")
                    return lead_id
                else:
                    logger.warning(f"Failed to create lead: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error creating CRM lead: {e}")
            return None

    async def run_prospecting_cycle(self, max_leads: int = 5) -> Dict[str, Any]:
        """
        Run a full prospecting cycle:
        1. Scan news for potential leads
        2. Enrich prospects
        3. Create leads in CRM
        """
        logger.info("Starting prospecting cycle...")

        results = {
            "cycle_time": datetime.now().isoformat(),
            "news_items_scanned": 0,
            "prospects_found": 0,
            "leads_created": 0,
            "leads": []
        }

        try:
            # 1. Get news items
            news_items = await news_monitor.scan_all_sources()
            results["news_items_scanned"] = len(news_items)

            # 2. Extract prospects from news
            all_prospects = []
            for item in news_items[:20]:  # Limit to top 20 items
                prospects = await self.prospect_from_news(item)
                all_prospects.extend(prospects)

            results["prospects_found"] = len(all_prospects)

            # 3. Sort by relevance and take top prospects
            all_prospects.sort(key=lambda p: p.relevance_score, reverse=True)
            top_prospects = all_prospects[:max_leads]

            # 4. Enrich and create leads
            for prospect in top_prospects:
                # Enrich
                enriched = await self.enrich_prospect(prospect)

                # Create in CRM
                lead_id = await self.create_lead_in_crm(enriched)

                if lead_id:
                    results["leads_created"] += 1
                    results["leads"].append({
                        "id": lead_id,
                        "company": prospect.company_name,
                        "score": prospect.relevance_score,
                        "sector": prospect.sector,
                        "source": prospect.source_url
                    })

            logger.info(f"Prospecting complete: {results['leads_created']} leads created from {results['prospects_found']} prospects")

        except Exception as e:
            logger.error(f"Prospecting cycle error: {e}")
            results["error"] = str(e)

        return results

    def get_status(self) -> Dict[str, Any]:
        """Get prospector status"""
        return {
            "running": self._running,
            "total_prospects": len(self.prospects),
            "prospect_sources": {
                "news": len([p for p in self.prospects.values() if p.source == "news"]),
            }
        }


# Singleton instance
lead_prospector = LeadProspectorService()
