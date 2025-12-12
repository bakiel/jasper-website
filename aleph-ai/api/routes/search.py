"""
ALEPH AI Infrastructure - Search Routes
POST /v1/search - Semantic vector search
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..models import embedding_service
from ..services import milvus_service

router = APIRouter(prefix="/v1/search", tags=["Search"])


class SearchRequest(BaseModel):
    """Semantic search request."""
    query: str = Field(..., description="Search query text")
    collection: str = Field(..., description="Collection to search")
    top_k: int = Field(10, description="Maximum results", ge=1, le=100)
    threshold: float = Field(0.0, description="Minimum similarity score", ge=0.0, le=1.0)


class SearchResult(BaseModel):
    """Single search result."""
    id: str
    score: float
    metadata: Dict[str, Any]
    text: Optional[str] = None


class SearchResponse(BaseModel):
    """Search response."""
    results: List[SearchResult]
    query: str
    collection: str
    count: int


class MultiSearchRequest(BaseModel):
    """Search across multiple collections."""
    query: str = Field(..., description="Search query text")
    collections: List[str] = Field(..., description="Collections to search")
    top_k: int = Field(10, description="Maximum results per collection")
    threshold: float = Field(0.0, description="Minimum similarity score")


class MultiSearchResponse(BaseModel):
    """Multi-collection search response."""
    results: List[Dict[str, Any]]
    query: str
    collections: List[str]
    count: int


class HybridSearchRequest(BaseModel):
    """Hybrid vector + metadata search."""
    query: str = Field(..., description="Search query text")
    collection: str = Field(..., description="Collection to search")
    filters: Optional[Dict[str, Any]] = Field(None, description="Metadata filters")
    top_k: int = Field(10, description="Maximum results")
    threshold: float = Field(0.0, description="Minimum similarity score")


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Perform semantic search in a collection.

    Auto-embeds the query and searches for similar vectors.
    """
    try:
        # Embed query
        query_vector = embedding_service.embed_text(request.query)

        # Search
        results = milvus_service.search(
            collection=request.collection,
            vector=query_vector,
            top_k=request.top_k,
            threshold=request.threshold,
        )

        return SearchResponse(
            results=[SearchResult(**r) for r in results],
            query=request.query,
            collection=request.collection,
            count=len(results),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/multi", response_model=MultiSearchResponse)
async def multi_collection_search(
    request: MultiSearchRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Search across multiple collections.

    Results are combined and sorted by score.
    """
    try:
        # Embed query
        query_vector = embedding_service.embed_text(request.query)

        # Search across collections
        results = milvus_service.search_multi(
            collections=request.collections,
            vector=query_vector,
            top_k=request.top_k,
            threshold=request.threshold,
        )

        return MultiSearchResponse(
            results=results,
            query=request.query,
            collections=request.collections,
            count=len(results),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid")
async def hybrid_search(
    request: HybridSearchRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Hybrid search combining vector similarity with metadata filters.

    Note: Metadata filtering in Milvus Lite is limited.
    Complex filters may require post-filtering.
    """
    try:
        # Embed query
        query_vector = embedding_service.embed_text(request.query)

        # Build filter expression if provided
        filter_expr = None
        if request.filters:
            # Simple key-value filter support
            # For complex filters, use post-processing
            pass

        # Search
        results = milvus_service.search(
            collection=request.collection,
            vector=query_vector,
            top_k=request.top_k * 2,  # Over-fetch for post-filtering
            threshold=request.threshold,
            filter_expr=filter_expr,
        )

        # Post-filter by metadata if needed
        if request.filters:
            filtered_results = []
            for r in results:
                match = True
                for key, value in request.filters.items():
                    if r["metadata"].get(key) != value:
                        match = False
                        break
                if match:
                    filtered_results.append(r)
                if len(filtered_results) >= request.top_k:
                    break
            results = filtered_results

        return {
            "results": results[:request.top_k],
            "query": request.query,
            "collection": request.collection,
            "filters": request.filters,
            "count": len(results[:request.top_k]),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections")
async def list_collections(
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """List all available collections."""
    collections = milvus_service.list_collections()

    return {
        "collections": [
            milvus_service.collection_info(c)
            for c in collections
        ],
        "count": len(collections),
    }


@router.get("/collections/{collection}")
async def get_collection_info(
    collection: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """Get detailed collection information."""
    try:
        return milvus_service.collection_info(collection)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
