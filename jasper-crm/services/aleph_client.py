"""
JASPER CRM - ALEPH AI Client
Integrates local AI models for semantic search and embeddings
"""

import os
import httpx
from typing import Dict, Any, List, Optional
import logging
import json

logger = logging.getLogger(__name__)

ALEPH_BASE_URL = os.getenv("ALEPH_API_URL", "http://localhost:8000")
ALEPH_API_KEY = os.getenv("ALEPH_API_KEY", "jasper_sk_live_k8x9m2n4p5q7r0s3t6u")


class AlephClient:
    """Client for ALEPH AI Infrastructure - Local AI Models"""

    def __init__(self):
        self.base_url = ALEPH_BASE_URL
        self.api_key = ALEPH_API_KEY
        self.headers = {"X-API-Key": self.api_key}

    async def embed(self, text: str, dimensions: Optional[int] = None) -> List[float]:
        """
        Generate embedding for text using local GTE-Large model.
        768 dimensions, <15ms latency, FREE.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/embed",
                    headers=self.headers,
                    json={"text": text, "dimensions": dimensions},
                    timeout=30.0,
                )
                if response.status_code == 200:
                    return response.json().get("embedding", [])
                else:
                    logger.error(f"ALEPH embed error: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"ALEPH embed failed: {e}")
            return []

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts in batch."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/embed/batch",
                    headers=self.headers,
                    json={"texts": texts},
                    timeout=60.0,
                )
                if response.status_code == 200:
                    return response.json().get("embeddings", [])
                return []
        except Exception as e:
            logger.error(f"ALEPH batch embed failed: {e}")
            return []

    async def search(
        self,
        query: str,
        collection: str = "jasper_leads",
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search in Milvus vector database.
        Returns similar items with scores.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/search",
                    headers=self.headers,
                    json={
                        "query": query,
                        "collection": collection,
                        "top_k": top_k,
                        "filter": filter_dict,
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    return response.json().get("results", [])
                return []
        except Exception as e:
            logger.error(f"ALEPH search failed: {e}")
            return []

    async def ingest(
        self,
        text: str,
        collection: str,
        doc_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Ingest text into vector database.
        Auto-embeds and stores with metadata.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/ingest/text",
                    headers=self.headers,
                    json={
                        "text": text,
                        "collection": collection,
                        "doc_id": doc_id,
                        "metadata": metadata or {},
                    },
                    timeout=30.0,
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"ALEPH ingest failed: {e}")
            return False

    async def rag_query(
        self,
        query: str,
        collections: List[str],
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """
        RAG query - search + format context for LLM.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/rag/query",
                    headers=self.headers,
                    json={
                        "query": query,
                        "collections": collections,
                        "top_k": top_k,
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    return response.json()
                return {"context": "", "sources": []}
        except Exception as e:
            logger.error(f"ALEPH RAG failed: {e}")
            return {"context": "", "sources": []}

    async def find_similar_leads(
        self,
        lead_context: str,
        status_filter: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Find leads similar to the given context."""
        filter_dict = None
        if status_filter:
            filter_dict = {"status": status_filter}

        return await self.search(
            query=lead_context,
            collection="jasper_leads",
            top_k=top_k,
            filter_dict=filter_dict,
        )

    async def find_winning_templates(
        self,
        lead_context: str,
        top_k: int = 3,
    ) -> tuple:
        """Find templates that worked for similar leads."""
        # First find similar won leads
        similar_won = await self.search(
            query=lead_context,
            collection="jasper_leads",
            top_k=top_k,
            filter_dict={"status": "won"},
        )

        # Extract template IDs from won leads
        template_ids = [
            r.get("metadata", {}).get("template_used")
            for r in similar_won
            if r.get("metadata", {}).get("template_used")
        ]

        return similar_won, template_ids

    async def classify_reply(self, reply_text: str) -> Dict[str, Any]:
        """
        Classify email reply intent using FREE Gemini.
        Returns: intent, confidence, suggested_action
        """
        try:
            async with httpx.AsyncClient() as client:
                prompt = f'''Classify this email reply intent:

"{reply_text}"

Categories:
1. POSITIVE - Interested, wants meeting/call
2. QUESTION - Asking for more info
3. OBJECTION - Price/timing concern
4. NEGATIVE - Not interested
5. OUT_OF_OFFICE - Auto-reply
6. REFERRAL - Referring to someone else

Return JSON only: {{"intent": "...", "confidence": 0.X, "suggested_action": "..."}}'''

                response = await client.post(
                    f"{self.base_url}/v1/complete",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "model": "gemini-flash",
                        "max_tokens": 200,
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    content = response.json().get("content", "{}")
                    if "```" in content:
                        parts = content.split("```")
                        if len(parts) > 1:
                            content = parts[1].replace("json", "")
                    return json.loads(content.strip())
                return {"intent": "UNKNOWN", "confidence": 0.0}
        except Exception as e:
            logger.error(f"Reply classification failed: {e}")
            return {"intent": "UNKNOWN", "confidence": 0.0, "error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Check ALEPH AI status."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers=self.headers,
                    timeout=10.0,
                )
                return response.json() if response.status_code == 200 else {"status": "error"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}


# Singleton instance
aleph = AlephClient()
