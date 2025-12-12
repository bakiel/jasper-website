"""
ALEPH AI Infrastructure - Embedding Routes
POST /v1/embed - Generate embeddings
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional

from ..models import embedding_service
from ..config import settings

router = APIRouter(prefix="/v1/embed", tags=["Embedding"])


class EmbedRequest(BaseModel):
    """Single text embedding request."""
    text: str = Field(..., description="Text to embed")
    dimensions: Optional[int] = Field(None, description="Truncate to dimensions (128/256/512/768)")
    normalize: bool = Field(True, description="L2 normalize embedding")


class EmbedResponse(BaseModel):
    """Embedding response."""
    embedding: List[float]
    dimensions: int
    model: str


class BatchEmbedRequest(BaseModel):
    """Batch embedding request."""
    texts: List[str] = Field(..., description="List of texts to embed", max_length=100)
    dimensions: Optional[int] = Field(None, description="Truncate to dimensions")
    normalize: bool = Field(True, description="L2 normalize embeddings")


class BatchEmbedResponse(BaseModel):
    """Batch embedding response."""
    embeddings: List[List[float]]
    dimensions: int
    count: int
    model: str


@router.post("", response_model=EmbedResponse)
async def embed_text(
    request: EmbedRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate embedding for a single text.

    Uses EmbeddingGemma (768 dims) or fallback to MiniLM (384 dims).
    Supports Matryoshka dimension truncation.
    """
    try:
        embedding = embedding_service.embed_text(
            text=request.text,
            dimensions=request.dimensions,
            normalize=request.normalize,
        )

        return EmbedResponse(
            embedding=embedding,
            dimensions=len(embedding),
            model=embedding_service.model_name,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchEmbedResponse)
async def embed_batch(
    request: BatchEmbedRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate embeddings for multiple texts.

    Maximum 100 texts per request.
    """
    if len(request.texts) > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100 texts per batch",
        )

    try:
        embeddings = embedding_service.embed_texts(
            texts=request.texts,
            dimensions=request.dimensions,
            normalize=request.normalize,
        )

        return BatchEmbedResponse(
            embeddings=embeddings,
            dimensions=len(embeddings[0]) if embeddings else 0,
            count=len(embeddings),
            model=embedding_service.model_name,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
async def embedding_info():
    """Get embedding model information."""
    return {
        "model": embedding_service.model_name,
        "dimensions": embedding_service.dimensions,
        "matryoshka_support": True,
        "available_dimensions": [128, 256, 512, 768],
        "cost": 0,
        "layer": "self-hosted",
    }
