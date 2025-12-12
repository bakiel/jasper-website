"""
ALEPH AI Infrastructure - Ingestion Routes
POST /v1/ingest/* - Document and data ingestion pipelines
"""

from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json

from ..models import embedding_service, vision_service, completion_service
from ..services import milvus_service

router = APIRouter(prefix="/v1/ingest", tags=["Ingestion"])


class InsertRequest(BaseModel):
    """Direct vector insert request."""
    collection: str = Field(..., description="Target collection")
    id: str = Field(..., description="Unique identifier")
    text: str = Field(..., description="Text to embed and store")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Associated metadata")


class InsertResponse(BaseModel):
    """Insert response."""
    success: bool
    id: str
    collection: str


class BatchInsertRequest(BaseModel):
    """Batch insert request."""
    collection: str = Field(..., description="Target collection")
    items: List[Dict[str, Any]] = Field(..., description="Items with id, text, metadata")


class BatchInsertResponse(BaseModel):
    """Batch insert response."""
    success: bool
    count: int
    collection: str


class DocumentIngestRequest(BaseModel):
    """Full document ingestion request."""
    document: str = Field(..., description="Base64 encoded document (PDF/image)")
    collection: str = Field(..., description="Target collection")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Document metadata")
    chunk_size: int = Field(500, description="Characters per chunk")
    chunk_overlap: int = Field(50, description="Overlap between chunks")


class DocumentIngestResponse(BaseModel):
    """Document ingestion response."""
    document_id: str
    chunks_created: int
    vectors_stored: int
    processing_time_ms: int
    extracted_text_preview: str


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to end at sentence boundary
        if end < len(text):
            # Look for sentence end
            for sep in ['. ', '.\n', '! ', '? ', '\n\n']:
                pos = text.rfind(sep, start, end)
                if pos > start + chunk_size // 2:
                    end = pos + len(sep)
                    break

        chunks.append(text[start:end].strip())
        start = end - overlap

    return [c for c in chunks if c]


@router.post("/insert", response_model=InsertResponse)
async def insert_vector(
    request: InsertRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Insert text with auto-embedding into collection.

    Auto-embeds the text and stores with metadata.
    """
    try:
        # Generate embedding
        vector = embedding_service.embed_text(request.text)

        # Insert into Milvus
        success = milvus_service.insert(
            collection=request.collection,
            id=request.id,
            vector=vector,
            metadata=request.metadata,
            text=request.text,
        )

        return InsertResponse(
            success=success,
            id=request.id,
            collection=request.collection,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insert/batch", response_model=BatchInsertResponse)
async def insert_batch(
    request: BatchInsertRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Batch insert texts with auto-embedding.

    Each item should have: {id, text, metadata}
    """
    try:
        # Generate embeddings for all texts
        texts = [item["text"] for item in request.items]
        vectors = embedding_service.embed_texts(texts)

        # Prepare items with vectors
        items_with_vectors = []
        for item, vector in zip(request.items, vectors):
            items_with_vectors.append({
                "id": item["id"],
                "vector": vector,
                "metadata": item.get("metadata", {}),
                "text": item["text"],
            })

        # Batch insert
        count = milvus_service.insert_batch(
            collection=request.collection,
            items=items_with_vectors,
        )

        return BatchInsertResponse(
            success=True,
            count=count,
            collection=request.collection,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/document", response_model=DocumentIngestResponse)
async def ingest_document(
    request: DocumentIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Full document ingestion pipeline.

    Pipeline:
    1. OCR with SmolDocling
    2. Chunk text
    3. Embed chunks with EmbeddingGemma
    4. Store in Milvus
    """
    import time
    import uuid

    start_time = time.time()

    try:
        # Step 1: OCR extraction
        ocr_result = await vision_service.ocr(
            image=request.document,
            output_format="text",
        )

        extracted_text = ocr_result.get("text", "")
        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from document",
            )

        # Step 2: Chunk text
        chunks = chunk_text(
            extracted_text,
            chunk_size=request.chunk_size,
            overlap=request.chunk_overlap,
        )

        # Step 3: Embed all chunks
        vectors = embedding_service.embed_texts(chunks)

        # Step 4: Generate document ID and store
        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        items = []
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            items.append({
                "id": f"{document_id}_chunk_{i}",
                "vector": vector,
                "metadata": {
                    **request.metadata,
                    "document_id": document_id,
                    "chunk_index": i,
                    "chunk_count": len(chunks),
                },
                "text": chunk,
            })

        # Batch insert
        milvus_service.insert_batch(
            collection=request.collection,
            items=items,
        )

        processing_time = int((time.time() - start_time) * 1000)

        return DocumentIngestResponse(
            document_id=document_id,
            chunks_created=len(chunks),
            vectors_stored=len(vectors),
            processing_time_ms=processing_time,
            extracted_text_preview=extracted_text[:500],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DFIProfileRequest(BaseModel):
    """DFI profile ingestion request."""
    document: str = Field(..., description="Base64 DFI requirements PDF")
    dfi_name: str = Field(..., description="DFI name (e.g., 'AfDB AFAWA')")
    metadata: Optional[Dict[str, Any]] = None


@router.post("/dfi-profile")
async def ingest_dfi_profile(
    request: DFIProfileRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Ingest a DFI requirements document for JASPER.

    Specialized pipeline:
    1. Extract with SmolDocling
    2. Analyze with DeepSeek for structured data
    3. Chunk and embed
    4. Store in jasper_dfi_profiles
    """
    import time
    import uuid

    start_time = time.time()

    try:
        # Step 1: OCR
        ocr_result = await vision_service.ocr(request.document, output_format="text")
        extracted_text = ocr_result.get("text", "")

        if not extracted_text:
            raise HTTPException(status_code=400, detail="No text extracted")

        # Step 2: Analyze for structure (optional - uses tokens)
        analysis_prompt = f"""Analyze this DFI requirements document for {request.dfi_name}.

Extract:
1. Focus sectors (list)
2. Funding range (min/max)
3. Geographic focus (regions/countries)
4. Key eligibility criteria (list)
5. Application process summary (2-3 sentences)

Return as JSON.

Document:
{extracted_text[:4000]}"""

        analysis = await completion_service.complete(
            prompt=analysis_prompt,
            model="gemini",  # FREE
            max_tokens=500,
        )

        # Try to parse analysis
        structured_data = {}
        try:
            text = analysis.get("text", "")
            if "{" in text:
                json_str = text[text.index("{"):text.rindex("}")+1]
                structured_data = json.loads(json_str)
        except:
            pass

        # Step 3: Chunk and embed
        chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)
        vectors = embedding_service.embed_texts(chunks)

        # Step 4: Store
        document_id = f"dfi_{request.dfi_name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}"

        items = []
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            items.append({
                "id": f"{document_id}_chunk_{i}",
                "vector": vector,
                "metadata": {
                    "dfi_name": request.dfi_name,
                    "document_id": document_id,
                    "chunk_index": i,
                    **structured_data,
                    **(request.metadata or {}),
                },
                "text": chunk,
            })

        milvus_service.insert_batch(
            collection="jasper_dfi_profiles",
            items=items,
        )

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "document_id": document_id,
            "dfi_name": request.dfi_name,
            "chunks_created": len(chunks),
            "structured_data": structured_data,
            "processing_time_ms": processing_time,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{collection}/{id}")
async def delete_item(
    collection: str,
    id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """Delete an item from a collection."""
    try:
        count = milvus_service.delete(collection, [id])
        return {"success": count > 0, "deleted_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
