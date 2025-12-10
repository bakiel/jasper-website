"""
JASPER CRM - Interaction Model
Activity log for all client communications
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.project import Project


class InteractionType(str, enum.Enum):
    """Types of interactions/activities"""
    # Communication
    EMAIL_SENT = "email_sent"
    EMAIL_RECEIVED = "email_received"
    CALL = "call"
    MEETING = "meeting"
    VIDEO_CALL = "video_call"

    # Notes
    NOTE = "note"
    INTERNAL_NOTE = "internal_note"

    # System events
    STAGE_CHANGE = "stage_change"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_DOWNLOADED = "document_downloaded"
    INVOICE_SENT = "invoice_sent"
    INVOICE_PAID = "invoice_paid"
    PROPOSAL_SENT = "proposal_sent"
    PROPOSAL_VIEWED = "proposal_viewed"
    PORTAL_LOGIN = "portal_login"
    FORM_SUBMITTED = "form_submitted"

    # Tasks
    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    REMINDER = "reminder"


class Interaction(Base):
    """
    Activity log entry.
    Tracks all communications and events for a client/project.
    """
    __tablename__ = "interactions"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys (at least one should be set)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    contact_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Interaction details
    interaction_type: Mapped[InteractionType] = mapped_column(
        SQLEnum(InteractionType),
        nullable=False,
        index=True
    )
    subject: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Brief description of the interaction"
    )
    content: Mapped[Optional[str]] = mapped_column(
        Text,
        comment="Full content/notes"
    )

    # For emails
    email_message_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        comment="Email Message-ID header for threading"
    )

    # For calls/meetings
    duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Duration for calls/meetings"
    )
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        comment="Scheduled time for meetings"
    )
    outcome: Mapped[Optional[str]] = mapped_column(
        String(500),
        comment="Outcome/result of call/meeting"
    )

    # For stage changes
    from_stage: Mapped[Optional[str]] = mapped_column(String(50))
    to_stage: Mapped[Optional[str]] = mapped_column(String(50))

    # Attribution
    created_by: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Who created: email or 'system'"
    )
    is_system_generated: Mapped[bool] = mapped_column(
        default=False,
        comment="Auto-generated vs manual"
    )

    # Visibility
    internal_only: Mapped[bool] = mapped_column(
        default=False,
        comment="Hidden from client portal"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationships
    company: Mapped[Optional["Company"]] = relationship(
        "Company",
        back_populates="interactions"
    )
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact",
        back_populates="interactions"
    )
    project: Mapped[Optional["Project"]] = relationship(
        "Project",
        back_populates="interactions"
    )

    def __repr__(self):
        return f"<Interaction(id={self.id}, type='{self.interaction_type}', subject='{self.subject[:30]}...')>"

    @property
    def display_icon(self) -> str:
        """Icon for display in timeline"""
        icons = {
            InteractionType.EMAIL_SENT: "📤",
            InteractionType.EMAIL_RECEIVED: "📥",
            InteractionType.CALL: "📞",
            InteractionType.MEETING: "🤝",
            InteractionType.VIDEO_CALL: "📹",
            InteractionType.NOTE: "📝",
            InteractionType.INTERNAL_NOTE: "🔒",
            InteractionType.STAGE_CHANGE: "📊",
            InteractionType.DOCUMENT_UPLOADED: "📎",
            InteractionType.DOCUMENT_DOWNLOADED: "⬇️",
            InteractionType.INVOICE_SENT: "📄",
            InteractionType.INVOICE_PAID: "💰",
            InteractionType.PROPOSAL_SENT: "📋",
            InteractionType.PROPOSAL_VIEWED: "👁️",
            InteractionType.PORTAL_LOGIN: "🔑",
            InteractionType.FORM_SUBMITTED: "✅",
            InteractionType.TASK_CREATED: "📌",
            InteractionType.TASK_COMPLETED: "✔️",
            InteractionType.REMINDER: "⏰",
        }
        return icons.get(self.interaction_type, "📌")

    @classmethod
    def log_email_sent(
        cls,
        company_id: int,
        contact_id: int,
        subject: str,
        content: str,
        created_by: str,
        project_id: int = None,
        message_id: str = None
    ) -> "Interaction":
        """Log an outgoing email"""
        return cls(
            company_id=company_id,
            contact_id=contact_id,
            project_id=project_id,
            interaction_type=InteractionType.EMAIL_SENT,
            subject=f"Email: {subject}",
            content=content,
            email_message_id=message_id,
            created_by=created_by,
            is_system_generated=True
        )

    @classmethod
    def log_stage_change(
        cls,
        project_id: int,
        company_id: int,
        from_stage: str,
        to_stage: str,
        created_by: str
    ) -> "Interaction":
        """Log a pipeline stage change"""
        return cls(
            company_id=company_id,
            project_id=project_id,
            interaction_type=InteractionType.STAGE_CHANGE,
            subject=f"Stage changed: {from_stage} → {to_stage}",
            from_stage=from_stage,
            to_stage=to_stage,
            created_by=created_by,
            is_system_generated=True
        )

    @classmethod
    def log_invoice_paid(
        cls,
        project_id: int,
        company_id: int,
        invoice_number: str,
        amount: float,
        currency: str,
        payment_method: str
    ) -> "Interaction":
        """Log invoice payment"""
        return cls(
            company_id=company_id,
            project_id=project_id,
            interaction_type=InteractionType.INVOICE_PAID,
            subject=f"Invoice {invoice_number} paid: {currency} {amount:,.2f}",
            content=f"Payment method: {payment_method}",
            created_by="system",
            is_system_generated=True
        )

    @classmethod
    def log_portal_login(
        cls,
        contact_id: int,
        company_id: int
    ) -> "Interaction":
        """Log client portal login"""
        return cls(
            company_id=company_id,
            contact_id=contact_id,
            interaction_type=InteractionType.PORTAL_LOGIN,
            subject="Client logged into portal",
            created_by="system",
            is_system_generated=True,
            internal_only=True
        )

    @classmethod
    def add_note(
        cls,
        company_id: int,
        subject: str,
        content: str,
        created_by: str,
        contact_id: int = None,
        project_id: int = None,
        internal: bool = False
    ) -> "Interaction":
        """Add a note"""
        return cls(
            company_id=company_id,
            contact_id=contact_id,
            project_id=project_id,
            interaction_type=InteractionType.INTERNAL_NOTE if internal else InteractionType.NOTE,
            subject=subject,
            content=content,
            created_by=created_by,
            is_system_generated=False,
            internal_only=internal
        )
