"""
JASPER Memory - Shared Vector Memory Service
FastAPI service for embeddings and semantic search

Serves: JASPER CRM, JASPER Portal, Aleph, Future Apps
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib

from .config import SERVICE_NAME, SERVICE_VERSION, API_KEYS, COLLECTIONS
from .embeddings import embedding_service
from .vector_store import vector_store


# --- FastAPI App ---
app = FastAPI(
    title="JASPER Memory",
    description="Shared Vector Memory Service for Kutlwano Holdings",
    version=SERVICE_VERSION,
)

# CORS for all apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth ---
async def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key for service access"""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    # Check if key is valid
    for app_name, key in API_KEYS.items():
        if x_api_key == key:
            return app_name

    raise HTTPException(status_code=403, detail="Invalid API key")


# --- Request/Response Models ---
class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    instruction: Optional[str] = None


class EmbedBatchRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=100)


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    model: str


class InsertRequest(BaseModel):
    collection: str
    id: str
    text: str = Field(..., min_length=1)
    metadata: Dict[str, Any] = {}


class InsertBatchRequest(BaseModel):
    collection: str
    items: List[Dict[str, Any]]  # [{id, text, metadata}]


class SearchRequest(BaseModel):
    collection: str
    query: str = Field(..., min_length=1)
    limit: int = Field(default=10, ge=1, le=100)
    filter: Optional[str] = None


class SearchByVectorRequest(BaseModel):
    collection: str
    embedding: List[float]
    limit: int = Field(default=10, ge=1, le=100)


class MemoryItem(BaseModel):
    id: str
    score: float
    metadata: Dict[str, Any]
    text: Optional[str] = None


class SearchResponse(BaseModel):
    matches: List[MemoryItem]
    query: str
    collection: str


# --- Endpoints ---

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "embedding_model": embedding_service.model_name,
        "collections": list(COLLECTIONS.keys()),
    }


@app.get("/collections")
async def list_collections(app_name: str = Depends(verify_api_key)):
    """List all available collections"""
    collections = []
    for name in vector_store.list_collections():
        info = vector_store.collection_info(name)
        collections.append(info)
    return {"collections": collections, "app": app_name}


@app.get("/collections/{collection}")
async def get_collection(collection: str, app_name: str = Depends(verify_api_key)):
    """Get collection info"""
    try:
        info = vector_store.collection_info(collection)
        return info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Embedding Endpoints ---

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest, app_name: str = Depends(verify_api_key)):
    """
    Generate embedding for text.

    Used by all apps for vector generation.
    """
    if request.instruction:
        embedding = embedding_service.embed_with_instruction(
            request.text, request.instruction
        )
    else:
        embedding = embedding_service.embed_text(request.text)

    return EmbedResponse(
        embedding=embedding,
        dimensions=len(embedding),
        model=embedding_service.model_name,
    )


@app.post("/embed/batch")
async def embed_batch(request: EmbedBatchRequest, app_name: str = Depends(verify_api_key)):
    """Generate embeddings for multiple texts"""
    embeddings = embedding_service.embed_texts(request.texts)

    return {
        "embeddings": embeddings,
        "count": len(embeddings),
        "dimensions": len(embeddings[0]) if embeddings else 0,
        "model": embedding_service.model_name,
    }


# --- Memory Endpoints ---

@app.post("/memory/insert")
async def insert_memory(request: InsertRequest, app_name: str = Depends(verify_api_key)):
    """
    Insert text with auto-generated embedding.

    The text is embedded and stored in the vector database.
    """
    # Generate embedding
    embedding = embedding_service.embed_text(request.text)

    # Add metadata
    metadata = request.metadata.copy()
    metadata["_app"] = app_name
    metadata["_inserted_at"] = datetime.utcnow().isoformat()

    # Insert
    vector_store.insert(
        collection=request.collection,
        id=request.id,
        embedding=embedding,
        metadata=metadata,
        text=request.text,
    )

    return {
        "success": True,
        "id": request.id,
        "collection": request.collection,
    }


@app.post("/memory/insert/batch")
async def insert_memory_batch(
    request: InsertBatchRequest,
    app_name: str = Depends(verify_api_key)
):
    """Insert multiple items with auto-generated embeddings"""
    # Generate embeddings for all texts
    texts = [item["text"] for item in request.items]
    embeddings = embedding_service.embed_texts(texts)

    # Prepare items
    items = []
    for i, item in enumerate(request.items):
        metadata = item.get("metadata", {}).copy()
        metadata["_app"] = app_name
        metadata["_inserted_at"] = datetime.utcnow().isoformat()

        items.append({
            "id": item["id"],
            "embedding": embeddings[i],
            "metadata": metadata,
            "text": item["text"],
        })

    # Insert
    count = vector_store.insert_batch(request.collection, items)

    return {
        "success": True,
        "count": count,
        "collection": request.collection,
    }


@app.post("/memory/search", response_model=SearchResponse)
async def search_memory(request: SearchRequest, app_name: str = Depends(verify_api_key)):
    """
    Semantic search in collection.

    Query is embedded and matched against stored vectors.
    """
    # Generate query embedding
    query_embedding = embedding_service.embed_text(request.query)

    # Search
    matches = vector_store.search(
        collection=request.collection,
        query_embedding=query_embedding,
        limit=request.limit,
        filter_expr=request.filter,
    )

    return SearchResponse(
        matches=[MemoryItem(**m) for m in matches],
        query=request.query,
        collection=request.collection,
    )


@app.post("/memory/search/vector")
async def search_by_vector(
    request: SearchByVectorRequest,
    app_name: str = Depends(verify_api_key)
):
    """Search using pre-computed embedding vector"""
    matches = vector_store.search(
        collection=request.collection,
        query_embedding=request.embedding,
        limit=request.limit,
    )

    return {
        "matches": matches,
        "collection": request.collection,
    }


@app.get("/memory/{collection}/{id}")
async def get_memory_item(
    collection: str,
    id: str,
    app_name: str = Depends(verify_api_key)
):
    """Get specific item by ID"""
    item = vector_store.get(collection, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.delete("/memory/{collection}/{id}")
async def delete_memory_item(
    collection: str,
    id: str,
    app_name: str = Depends(verify_api_key)
):
    """Delete item by ID"""
    vector_store.delete(collection, [id])
    return {"success": True, "id": id}


# --- DFI Matching (JASPER-specific) ---

@app.post("/jasper/match-dfi")
async def match_dfi(
    project_description: str,
    sector: str,
    funding_amount: Optional[str] = None,
    app_name: str = Depends(verify_api_key)
):
    """
    Match project to suitable DFIs.
    JASPER-specific endpoint for lead qualification.
    """
    # Build search query
    query = f"Sector: {sector}. {project_description}"
    if funding_amount:
        query += f" Funding required: {funding_amount}"

    # Search DFI collection
    query_embedding = embedding_service.embed_text(query)
    matches = vector_store.search(
        collection="jasper_dfis",
        query_embedding=query_embedding,
        limit=5,
    )

    return {
        "dfi_matches": matches,
        "sector": sector,
        "query": query[:200],
    }


@app.post("/jasper/similar-projects")
async def find_similar_projects(
    project_description: str,
    limit: int = 5,
    app_name: str = Depends(verify_api_key)
):
    """
    Find similar past JASPER projects.
    For pricing reference and case studies.
    """
    query_embedding = embedding_service.embed_text(project_description)
    matches = vector_store.search(
        collection="jasper_projects",
        query_embedding=query_embedding,
        limit=limit,
    )

    return {
        "similar_projects": matches,
        "query": project_description[:200],
    }


# --- Startup ---

@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    print(f"Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    print(f"Embedding model: {embedding_service.model_name}")
    print(f"Embedding dimensions: {embedding_service.dimensions}")
    print(f"Collections: {list(COLLECTIONS.keys())}")
    print("JASPER Memory ready!")
