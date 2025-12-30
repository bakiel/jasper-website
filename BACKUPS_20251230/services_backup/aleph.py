"""
JASPER Lead Intelligence System - ALEPH AI Client
Interface to the ALEPH RAG service for semantic search and embeddings.

ALEPH Collections:
- jasper_dfi_profiles: IFC, AfDB, DFC, DBSA requirements
- jasper_proposals: Past winning proposals
- jasper_expertise: Bakiel's knowledge, credentials, case studies
- jasper_leads: Embedded lead profiles
- jasper_emails: Successful email history
- jasper_templates: Email/WhatsApp templates
"""

import os
import httpx
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from models.lead import Lead, SimilarDeal

logger = logging.getLogger(__name__)

# ALEPH API Configuration
ALEPH_BASE_URL = os.getenv("ALEPH_API_URL", "http://localhost:8000")
ALEPH_API_KEY = os.getenv("ALEPH_API_KEY", "")

# Collection Names
COLLECTIONS = {
    "dfi_profiles": "jasper_dfi_profiles",
    "proposals": "jasper_proposals",
    "expertise": "jasper_expertise",
    "leads": "jasper_leads",
    "emails": "jasper_emails",
    "templates": "jasper_templates",
}


class ALEPHClient:
    """
    Client for ALEPH AI RAG service.

    Provides:
    - Semantic search across collections
    - Lead embedding and similarity matching
    - DFI requirement lookup
    - Template matching for comms
    - Expertise retrieval for objection handling
    """

    def __init__(
        self,
        base_url: str = ALEPH_BASE_URL,
        api_key: str = ALEPH_API_KEY,
        timeout: float = 30.0
    ):
        """
        Initialize ALEPH client.

        Args:
            base_url: ALEPH API base URL
            api_key: API key for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=self.timeout
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    # =========================================================================
    # CORE METHODS
    # =========================================================================

    async def search(
        self,
        query: str,
        collection: str,
        top_k: int = 5,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Semantic search in a collection.

        Args:
            query: Search query text
            collection: Collection name (from COLLECTIONS)
            top_k: Number of results to return
            threshold: Minimum similarity score (0-1)

        Returns:
            List of matching documents with scores
        """
        try:
            response = await self.client.post(
                "/api/v1/search",
                json={
                    "query": query,
                    "collection": collection,
                    "top_k": top_k,
                    "threshold": threshold
                }
            )
            response.raise_for_status()
            return response.json().get("results", [])
        except Exception as e:
            logger.error(f"ALEPH search failed: {e}")
            return []

    async def embed_text(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector or None
        """
        try:
            response = await self.client.post(
                "/api/v1/embed",
                json={"text": text}
            )
            response.raise_for_status()
            return response.json().get("embedding")
        except Exception as e:
            logger.error(f"ALEPH embed failed: {e}")
            return None

    async def rag_query(
        self,
        query: str,
        collections: List[str],
        context_limit: int = 3
    ) -> Dict[str, Any]:
        """
        RAG query across multiple collections.

        Args:
            query: User query
            collections: Collections to search
            context_limit: Max context items per collection

        Returns:
            {
                "answer": "AI generated answer",
                "sources": [{"collection": "...", "text": "...", "score": 0.9}]
            }
        """
        try:
            response = await self.client.post(
                "/api/v1/query",
                json={
                    "query": query,
                    "collections": collections,
                    "context_limit": context_limit
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"ALEPH RAG query failed: {e}")
            return {"answer": None, "sources": []}

    # =========================================================================
    # LEAD METHODS
    # =========================================================================

    async def embed_lead(self, lead: Lead) -> Optional[str]:
        """
        Embed a lead into jasper_leads collection.

        Args:
            lead: Lead to embed

        Returns:
            Vector ID or None
        """
        # Create text representation of lead
        lead_text = self._lead_to_text(lead)

        try:
            response = await self.client.post(
                "/api/v1/upsert",
                json={
                    "collection": COLLECTIONS["leads"],
                    "id": lead.id,
                    "text": lead_text,
                    "metadata": {
                        "lead_id": lead.id,
                        "company": lead.company,
                        "project_type": lead.project_type,
                        "deal_size": lead.deal_size,
                        "target_dfi": lead.target_dfis[0] if lead.target_dfis else None,
                        "status": lead.status.value if lead.status else None,
                        "score": lead.score,
                        "created_at": lead.created_at.isoformat()
                    }
                }
            )
            response.raise_for_status()
            return lead.id
        except Exception as e:
            logger.error(f"Failed to embed lead {lead.id}: {e}")
            return None

    async def find_similar_leads(
        self,
        lead: Lead,
        top_k: int = 5,
        won_only: bool = True
    ) -> List[SimilarDeal]:
        """
        Find similar leads/deals to a given lead.

        Args:
            lead: Lead to find similar deals for
            top_k: Number of similar deals to return
            won_only: Only return won deals

        Returns:
            List of SimilarDeal objects
        """
        lead_text = self._lead_to_text(lead)

        results = await self.search(
            query=lead_text,
            collection=COLLECTIONS["leads"],
            top_k=top_k * 2,  # Get more to filter
            threshold=0.5
        )

        similar_deals = []
        for result in results:
            # Skip self
            if result.get("metadata", {}).get("lead_id") == lead.id:
                continue

            # Filter to won only if requested
            if won_only and result.get("metadata", {}).get("status") != "won":
                continue

            similar_deals.append(SimilarDeal(
                deal_name=result.get("metadata", {}).get("company", "Unknown"),
                company=result.get("metadata", {}).get("company", "Unknown"),
                deal_size=result.get("metadata", {}).get("deal_size"),
                dfi=result.get("metadata", {}).get("target_dfi"),
                project_type=result.get("metadata", {}).get("project_type"),
                similarity_score=result.get("score", 0.0),
                outcome=result.get("metadata", {}).get("status", "unknown")
            ))

            if len(similar_deals) >= top_k:
                break

        return similar_deals

    def _lead_to_text(self, lead: Lead) -> str:
        """Convert lead to searchable text."""
        parts = []

        if lead.company:
            parts.append(f"Company: {lead.company}")
        if lead.sector:
            parts.append(f"Sector: {lead.sector.value}")
        if lead.message:
            parts.append(f"Project: {lead.message}")
        if lead.project_type:
            parts.append(f"Type: {lead.project_type}")
        if lead.target_dfis:
            parts.append(f"Target DFI: {', '.join(lead.target_dfis)}")
        if lead.deal_size:
            parts.append(f"Deal size: R{lead.deal_size:,.0f}")

        return " | ".join(parts)

    # =========================================================================
    # DFI METHODS
    # =========================================================================

    async def get_dfi_requirements(self, dfi_name: str) -> Dict[str, Any]:
        """
        Get requirements for a specific DFI.

        Args:
            dfi_name: DFI name (IFC, AfDB, IDC, etc.)

        Returns:
            DFI requirements document
        """
        results = await self.search(
            query=f"{dfi_name} requirements criteria",
            collection=COLLECTIONS["dfi_profiles"],
            top_k=1,
            threshold=0.6
        )

        if results:
            return results[0]
        return {}

    async def match_dfi_for_project(
        self,
        project_description: str,
        deal_size: float = None
    ) -> List[Dict[str, Any]]:
        """
        Find best matching DFIs for a project.

        Args:
            project_description: Description of the project
            deal_size: Project size in ZAR

        Returns:
            List of matching DFIs with scores
        """
        query = project_description
        if deal_size:
            query += f" Deal size: R{deal_size:,.0f}"

        return await self.search(
            query=query,
            collection=COLLECTIONS["dfi_profiles"],
            top_k=3,
            threshold=0.5
        )

    # =========================================================================
    # COMMS METHODS
    # =========================================================================

    async def find_best_template(
        self,
        context: str,
        channel: str = "email"
    ) -> Optional[Dict[str, Any]]:
        """
        Find best matching template for communication.

        Args:
            context: Context/situation description
            channel: Communication channel (email, whatsapp)

        Returns:
            Best matching template or None
        """
        query = f"{channel} template: {context}"
        results = await self.search(
            query=query,
            collection=COLLECTIONS["templates"],
            top_k=1,
            threshold=0.6
        )

        return results[0] if results else None

    async def find_similar_emails(
        self,
        context: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find similar successful emails.

        Args:
            context: Email context/situation
            top_k: Number of examples to return

        Returns:
            List of similar successful emails
        """
        return await self.search(
            query=context,
            collection=COLLECTIONS["emails"],
            top_k=top_k,
            threshold=0.5
        )

    # =========================================================================
    # EXPERTISE METHODS
    # =========================================================================

    async def get_expertise(
        self,
        topic: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Get Bakiel's expertise on a topic.

        Args:
            topic: Topic to get expertise on
            top_k: Number of results

        Returns:
            List of expertise documents
        """
        return await self.search(
            query=topic,
            collection=COLLECTIONS["expertise"],
            top_k=top_k,
            threshold=0.5
        )

    async def get_objection_handler(
        self,
        objection: str
    ) -> Optional[str]:
        """
        Get response for common objection.

        Args:
            objection: The objection/concern raised

        Returns:
            Suggested response or None
        """
        results = await self.search(
            query=f"objection: {objection}",
            collection=COLLECTIONS["expertise"],
            top_k=1,
            threshold=0.6
        )

        if results:
            return results[0].get("text")
        return None

    async def get_proposal_context(
        self,
        project_type: str,
        dfi: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get past proposals similar to current project.

        Args:
            project_type: Type of project
            dfi: Target DFI (optional)

        Returns:
            List of similar proposals
        """
        query = f"proposal for {project_type}"
        if dfi:
            query += f" {dfi}"

        return await self.search(
            query=query,
            collection=COLLECTIONS["proposals"],
            top_k=3,
            threshold=0.5
        )

    # =========================================================================
    # CALL COACH METHODS
    # =========================================================================

    async def generate_call_context(
        self,
        lead: Lead,
        conversation_summary: str = None
    ) -> Dict[str, Any]:
        """
        Generate full context for call brief.

        Args:
            lead: Lead
            conversation_summary: Summary of conversations so far

        Returns:
            {
                "dfi_requirements": {...},
                "similar_deals": [...],
                "expertise": [...],
                "proposals": [...],
                "suggested_questions": [...],
                "objection_handlers": {...}
            }
        """
        context = {}

        # Get target DFI (first one from list if exists)
        target_dfi = lead.target_dfis[0] if lead.target_dfis else None

        # Get DFI requirements if target DFI specified
        if target_dfi:
            context["dfi_requirements"] = await self.get_dfi_requirements(target_dfi)

        # Get similar deals
        context["similar_deals"] = await self.find_similar_leads(lead, top_k=3)

        # Get relevant expertise
        expertise_query = f"{lead.project_type or lead.sector.value} {target_dfi or ''}"
        context["expertise"] = await self.get_expertise(expertise_query, top_k=3)

        # Get similar proposals
        if lead.project_type or lead.sector:
            project_desc = lead.project_type or lead.sector.value
            context["proposals"] = await self.get_proposal_context(
                project_desc,
                target_dfi
            )

        # Common objection handlers
        common_objections = [
            "too expensive",
            "need to think about it",
            "what's your track record",
            "can you guarantee results"
        ]
        context["objection_handlers"] = {}
        for objection in common_objections:
            handler = await self.get_objection_handler(objection)
            if handler:
                context["objection_handlers"][objection] = handler

        return context
