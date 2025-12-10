"""
JASPER CRM - Document Model
File management for projects
"""

from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Integer, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project


class DocumentType(str, enum.Enum):
    """Document categories"""
    # Client uploads
    FEASIBILITY_STUDY = "feasibility_study"
    FINANCIAL_STATEMENTS = "financial_statements"
    REGISTRATION_DOCS = "registration_docs"
    TECHNICAL_SPECS = "technical_specs"
    ENVIRONMENTAL_STUDY = "environmental_study"
    PERMITS_LICENSES = "permits_licenses"
    CONTRACTS = "contracts"
    OTHER_CLIENT = "other_client"

    # JASPER deliverables
    PROPOSAL = "proposal"
    FINANCIAL_MODEL = "financial_model"
    BUSINESS_PLAN = "business_plan"
    PITCH_DECK = "pitch_deck"
    EXECUTIVE_SUMMARY = "executive_summary"
    DUE_DILIGENCE = "due_diligence"
    INVOICE = "invoice"
    OTHER_DELIVERABLE = "other_deliverable"


class DocumentStatus(str, enum.Enum):
    """Document status"""
    PENDING = "pending"       # Upload in progress
    UPLOADED = "uploaded"     # Successfully uploaded
    PROCESSING = "processing" # AI processing (OCR etc)
    PROCESSED = "processed"   # AI processing complete
    APPROVED = "approved"     # Reviewed and approved
    REJECTED = "rejected"     # Rejected, needs replacement
    ARCHIVED = "archived"     # No longer active


class Document(Base):
    """
    Document/file attached to a project.
    Supports both client uploads and JASPER deliverables.
    """
    __tablename__ = "documents"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # File details
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Display name"
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Original uploaded filename"
    )
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Storage path"
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        comment="File size in bytes"
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        comment="MIME type"
    )
    file_extension: Mapped[str] = mapped_column(
        String(20),
        comment="File extension without dot"
    )

    # Classification
    document_type: Mapped[DocumentType] = mapped_column(
        SQLEnum(DocumentType),
        default=DocumentType.OTHER_CLIENT,
        index=True
    )
    status: Mapped[DocumentStatus] = mapped_column(
        SQLEnum(DocumentStatus),
        default=DocumentStatus.UPLOADED,
        index=True
    )

    # Versioning
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        comment="Version number"
    )
    is_latest: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment="Is this the latest version"
    )
    replaces_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="ID of document this replaces"
    )

    # Source
    uploaded_by: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Who uploaded: 'client' or admin email"
    )
    is_client_upload: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Uploaded by client vs JASPER"
    )

    # AI processing
    ocr_processed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )
    extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    extraction_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        default=None,
        comment="JSON from AI extraction"
    )

    # Access control
    client_visible: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment="Visible in client portal"
    )
    requires_approval: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Needs admin approval before visible"
    )

    # Notes
    description: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approved_by: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="documents"
    )

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', type='{self.document_type}')>"

    @property
    def file_size_display(self) -> str:
        """Human-readable file size"""
        if not self.file_size:
            return "Unknown"

        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024
        return f"{self.file_size:.1f} TB"

    @property
    def is_image(self) -> bool:
        """Check if document is an image"""
        image_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
        return self.file_extension.lower() in image_extensions

    @property
    def is_pdf(self) -> bool:
        """Check if document is a PDF"""
        return self.file_extension.lower() == 'pdf'

    @property
    def is_spreadsheet(self) -> bool:
        """Check if document is a spreadsheet"""
        spreadsheet_extensions = {'xls', 'xlsx', 'csv'}
        return self.file_extension.lower() in spreadsheet_extensions

    @property
    def is_deliverable(self) -> bool:
        """Check if this is a JASPER deliverable"""
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
        return self.document_type in deliverable_types

    def mark_processed(self, extracted_text: str = None, metadata: dict = None):
        """Mark document as AI-processed"""
        self.status = DocumentStatus.PROCESSED
        self.ocr_processed = True
        self.processed_at = datetime.utcnow()
        if extracted_text:
            self.extracted_text = extracted_text
        if metadata:
            self.extraction_metadata = metadata

    def approve(self, approved_by: str):
        """Approve document for client visibility"""
        self.status = DocumentStatus.APPROVED
        self.approved_at = datetime.utcnow()
        self.approved_by = approved_by
        self.client_visible = True

    def reject(self, notes: str = None):
        """Reject document"""
        self.status = DocumentStatus.REJECTED
        if notes:
            self.notes = notes
