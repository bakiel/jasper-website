"""
ALEPH AI Infrastructure - RAG Routes
POST /v1/rag/* - Retrieval-Augmented Generation
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..models import embedding_service, completion_service
from ..services import milvus_service

router = APIRouter(prefix="/v1/rag", tags=["RAG"])


class RAGQueryRequest(BaseModel):
    """RAG query request."""
    query: str = Field(..., description="User question")
    collections: List[str] = Field(..., description="Collections to search")
    top_k: int = Field(5, description="Number of context documents")
    completion_model: str = Field("deepseek", description="gemini, grok, deepseek")
    system_prompt: Optional[str] = Field(None, description="Custom system prompt")
    max_tokens: int = Field(1000, description="Maximum response tokens")


class RAGQueryResponse(BaseModel):
    """RAG query response."""
    answer: str
    sources: List[Dict[str, Any]]
    tokens: Dict[str, int]
    cost_usd: float


class DFIMatchRequest(BaseModel):
    """DFI matching request for JASPER."""
    project_description: str = Field(..., description="Project description")
    sector: Optional[str] = Field(None, description="Project sector")
    funding_amount: Optional[str] = Field(None, description="Funding required")
    region: Optional[str] = Field(None, description="Geographic region")
    top_k: int = Field(5, description="Number of DFI matches")


class DFIMatchResponse(BaseModel):
    """DFI matching response."""
    matches: List[Dict[str, Any]]
    query: str
    reasoning: Optional[str] = None


class SimilarProjectsRequest(BaseModel):
    """Find similar past projects."""
    project_brief: str = Field(..., description="New project description")
    top_k: int = Field(5, description="Number of similar projects")
    only_successful: bool = Field(True, description="Only return successful proposals")


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Retrieval-Augmented Generation query.

    Pipeline:
    1. Embed query
    2. Search collections for context
    3. Build context from results
    4. Generate answer with context
    """
    try:
        # Step 1: Embed query
        query_vector = embedding_service.embed_text(request.query)

        # Step 2: Search for context
        results = milvus_service.search_multi(
            collections=request.collections,
            vector=query_vector,
            top_k=request.top_k,
            threshold=0.3,
        )

        # Step 3: Build context
        context_parts = []
        for r in results:
            source = r.get("collection", "unknown")
            text = r.get("text", "")
            if text:
                context_parts.append(f"[Source: {source}]\n{text}")

        context = "\n\n---\n\n".join(context_parts)

        # Step 4: Generate answer
        system = request.system_prompt or (
            "You are an expert consultant. Answer based on the provided context. "
            "If the context doesn't contain relevant information, say so. "
            "Cite sources when possible."
        )

        prompt = f"""Context:
{context}

Question: {request.query}

Provide a comprehensive answer based on the context above."""

        completion = await completion_service.complete(
            prompt=prompt,
            model=request.completion_model,
            system=system,
            max_tokens=request.max_tokens,
        )

        # Format sources
        sources = [
            {
                "collection": r["collection"],
                "id": r["id"],
                "score": round(r["score"], 3),
            }
            for r in results
        ]

        return RAGQueryResponse(
            answer=completion.get("text", ""),
            sources=sources,
            tokens=completion.get("tokens", {"input": 0, "output": 0, "total": 0}),
            cost_usd=completion.get("cost_usd", 0),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match-dfi", response_model=DFIMatchResponse)
async def match_dfi(
    request: DFIMatchRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Match project to suitable DFIs.

    Specialized for JASPER:
    1. Build rich query from project details
    2. Search jasper_dfi_profiles
    3. Group by DFI and rank
    4. Optionally generate reasoning
    """
    try:
        # Build rich query
        query_parts = [request.project_description]
        if request.sector:
            query_parts.append(f"Sector: {request.sector}")
        if request.funding_amount:
            query_parts.append(f"Funding: {request.funding_amount}")
        if request.region:
            query_parts.append(f"Region: {request.region}")

        query = " | ".join(query_parts)

        # Embed and search
        query_vector = embedding_service.embed_text(query)

        results = milvus_service.search(
            collection="jasper_dfi_profiles",
            vector=query_vector,
            top_k=request.top_k * 3,  # Over-fetch for grouping
            threshold=0.2,
        )

        # Group by DFI, keep best score per DFI
        dfi_scores = {}
        for r in results:
            dfi_name = r["metadata"].get("dfi_name", "Unknown")
            if dfi_name not in dfi_scores or r["score"] > dfi_scores[dfi_name]["score"]:
                dfi_scores[dfi_name] = {
                    "dfi": dfi_name,
                    "score": round(r["score"], 3),
                    "metadata": {
                        k: v for k, v in r["metadata"].items()
                        if k != "_string_id" and k != "dfi_name"
                    },
                    "relevant_text": r.get("text", "")[:300],
                }

        # Sort by score
        matches = sorted(
            dfi_scores.values(),
            key=lambda x: x["score"],
            reverse=True,
        )[:request.top_k]

        return DFIMatchResponse(
            matches=matches,
            query=query,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar-projects")
async def find_similar_projects(
    request: SimilarProjectsRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Find similar past projects from JASPER proposals.

    Useful for:
    - Proposal template selection
    - Pricing reference
    - Success pattern identification
    """
    try:
        # Embed project brief
        query_vector = embedding_service.embed_text(request.project_brief)

        # Search proposals
        results = milvus_service.search(
            collection="jasper_proposals",
            vector=query_vector,
            top_k=request.top_k * 2,
            threshold=0.3,
        )

        # Filter by success if requested
        if request.only_successful:
            results = [
                r for r in results
                if r["metadata"].get("status") in ["won", "successful", None]
            ]

        # Format results
        similar = [
            {
                "id": r["id"],
                "score": round(r["score"], 3),
                "project_name": r["metadata"].get("project_name"),
                "sector": r["metadata"].get("sector"),
                "package": r["metadata"].get("package"),
                "funding_range": r["metadata"].get("funding_range"),
                "preview": r.get("text", "")[:200],
            }
            for r in results[:request.top_k]
        ]

        return {
            "similar_projects": similar,
            "query": request.project_brief[:200],
            "count": len(similar),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge-query")
async def query_knowledge_base(
    query: str,
    business: str = "jasper",
    max_tokens: int = 1000,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Query business-specific knowledge base.

    Searches all collections for a business and generates answer.
    """
    try:
        # Determine collections for business
        from ..config import COLLECTIONS

        business_collections = [
            name for name, config in COLLECTIONS.items()
            if config["business"] == business
        ]

        if not business_collections:
            raise HTTPException(
                status_code=400,
                detail=f"No collections found for business: {business}",
            )

        # Embed query
        query_vector = embedding_service.embed_text(query)

        # Search across business collections
        results = milvus_service.search_multi(
            collections=business_collections,
            vector=query_vector,
            top_k=5,
            threshold=0.3,
        )

        # Build context
        context_parts = []
        for r in results:
            if r.get("text"):
                context_parts.append(f"[{r['collection']}]\n{r['text']}")

        context = "\n\n".join(context_parts)

        # Generate answer
        system_prompts = {
            "jasper": (
                "You are a senior financial consultant at JASPER Financial Architecture "
                "with 21 years of experience in DFI engagements, financial modeling, "
                "and regenerative agriculture. Answer based on the knowledge base."
            ),
            "aleph": (
                "You are a creative director at ALEPH Creative-Hub specializing in "
                "brand design, visual identity, and creative strategy."
            ),
            "gahn": (
                "You are a culinary expert at Gahn Eden specializing in plant-based "
                "cuisine, vegan nutrition, and sustainable food systems."
            ),
            "ubuntu": (
                "You are an agricultural extension expert supporting smallholder farmers "
                "with crop management, pest control, and DFI funding access."
            ),
        }

        completion = await completion_service.complete(
            prompt=f"Context:\n{context}\n\nQuestion: {query}",
            model="deepseek",
            system=system_prompts.get(business, system_prompts["jasper"]),
            max_tokens=max_tokens,
        )

        return {
            "answer": completion.get("text", ""),
            "sources": [
                {"collection": r["collection"], "score": round(r["score"], 3)}
                for r in results
            ],
            "business": business,
            "cost_usd": completion.get("cost_usd", 0),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
