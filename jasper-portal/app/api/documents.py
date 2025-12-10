"""
JASPER Client Portal - Documents API
Secure document upload, download, and management with database persistence
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import os
import uuid
import aiofiles

from app.models.base import get_db
from app.models.document import Document, DocumentType, DocumentStatus
from app.models.project import Project
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    name: str
    original_filename: str
    file_size: int
    mime_type: str
    file_extension: str
    document_type: str
    status: str
    version: int
    is_latest: bool
    uploaded_by: str
    is_client_upload: bool
    client_visible: bool
    description: Optional[str]
    uploaded_at: datetime
    download_url: str

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_mime_type(filename: str) -> str:
    """Get MIME type from filename"""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'csv': 'text/csv',
    }
    return mime_types.get(ext, 'application/octet-stream')


def document_to_response(doc: Document) -> DocumentResponse:
    """Convert Document model to response schema"""
    return DocumentResponse(
        id=doc.id,
        project_id=doc.project_id,
        name=doc.name,
        original_filename=doc.original_filename,
        file_size=doc.file_size or 0,
        mime_type=doc.mime_type or '',
        file_extension=doc.file_extension or '',
        document_type=doc.document_type.value if doc.document_type else 'other_client',
        status=doc.status.value if doc.status else 'uploaded',
        version=doc.version or 1,
        is_latest=doc.is_latest,
        uploaded_by=doc.uploaded_by,
        is_client_upload=doc.is_client_upload,
        client_visible=doc.client_visible,
        description=doc.description,
        uploaded_at=doc.uploaded_at,
        download_url=f"/api/v1/documents/{doc.id}/download"
    )


# ============================================
# ENDPOINTS
# ============================================

@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: int = Form(...),
    document_type: str = Form(default="other_client"),
    description: Optional[str] = Form(default=None),
    uploaded_by: str = Form(default="admin"),
    is_client_upload: bool = Form(default=False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document for a project"""
    # Verify project exists
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file extension
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    allowed = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'csv'}
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(allowed))}"
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check file size (max 50MB)
    max_size = 50 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: 50MB"
        )

    # Create project upload directory
    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_dir, exist_ok=True)

    # Generate unique filename
    unique_id = uuid.uuid4().hex[:8]
    safe_filename = f"{unique_id}_{file.filename}"
    file_path = os.path.join(project_dir, safe_filename)

    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    # Create document record
    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        doc_type = DocumentType.OTHER_CLIENT

    document = Document(
        project_id=project_id,
        name=file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=get_mime_type(file.filename),
        file_extension=ext,
        document_type=doc_type,
        status=DocumentStatus.UPLOADED,
        uploaded_by=uploaded_by,
        is_client_upload=is_client_upload,
        client_visible=not is_client_upload,  # Admin uploads visible, client uploads need approval
        description=description,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document_to_response(document)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    project_id: Optional[int] = Query(default=None),
    document_type: Optional[str] = Query(default=None),
    client_visible_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    """List documents with optional filters"""
    query = select(Document).where(Document.is_latest == True)

    if project_id:
        query = query.where(Document.project_id == project_id)
    if document_type:
        try:
            doc_type = DocumentType(document_type)
            query = query.where(Document.document_type == doc_type)
        except ValueError:
            pass
    if client_visible_only:
        query = query.where(Document.client_visible == True)

    query = query.order_by(Document.uploaded_at.desc())

    documents = db.execute(query).scalars().all()

    return DocumentListResponse(
        documents=[document_to_response(d) for d in documents],
        total=len(documents)
    )


@router.get("/project/{project_id}", response_model=DocumentListResponse)
async def get_project_documents(
    project_id: int,
    client_visible_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    """Get all documents for a project"""
    query = select(Document).where(
        Document.project_id == project_id,
        Document.is_latest == True
    )

    if client_visible_only:
        query = query.where(Document.client_visible == True)

    query = query.order_by(Document.uploaded_at.desc())
    documents = db.execute(query).scalars().all()

    return DocumentListResponse(
        documents=[document_to_response(d) for d in documents],
        total=len(documents)
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get document metadata"""
    document = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document_to_response(document)


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Download document file"""
    document = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        document.file_path,
        filename=document.original_filename,
        media_type=document.mime_type
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Delete a document"""
    document = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete from database
    db.delete(document)
    db.commit()

    return None


@router.patch("/{document_id}/approve")
async def approve_document(
    document_id: int,
    approved_by: str = "admin",
    db: Session = Depends(get_db)
):
    """Approve a document for client visibility"""
    document = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.approve(approved_by)
    db.commit()
    db.refresh(document)

    return document_to_response(document)


@router.get("/project/{project_id}/deliverables", response_model=DocumentListResponse)
async def get_project_deliverables(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all deliverable documents for a project"""
    deliverable_types = [
        DocumentType.PROPOSAL,
        DocumentType.FINANCIAL_MODEL,
        DocumentType.BUSINESS_PLAN,
        DocumentType.PITCH_DECK,
        DocumentType.EXECUTIVE_SUMMARY,
        DocumentType.DUE_DILIGENCE,
        DocumentType.INVOICE,
        DocumentType.OTHER_DELIVERABLE,
    ]

    query = select(Document).where(
        Document.project_id == project_id,
        Document.document_type.in_(deliverable_types),
        Document.is_latest == True,
        Document.client_visible == True
    ).order_by(Document.uploaded_at.desc())

    documents = db.execute(query).scalars().all()

    return DocumentListResponse(
        documents=[document_to_response(d) for d in documents],
        total=len(documents)
    )
