"""
JASPER CRM - Project Model
Financial modelling projects for clients
"""

from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Integer, Numeric, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.milestone import Milestone
    from app.models.invoice import Invoice
    from app.models.document import Document
    from app.models.interaction import Interaction


class ProjectStage(str, enum.Enum):
    """8-stage pipeline from ONBOARDING_SYSTEM.md"""
    INQUIRY = "inquiry"       # Initial contact
    QUALIFY = "qualify"       # Qualification call done
    INTAKE = "intake"         # Intake form sent/pending
    PROPOSAL = "proposal"     # Proposal sent
    DEPOSIT = "deposit"       # Deposit invoice sent/paid
    PRODUCTION = "production" # Work in progress
    DRAFT = "draft"           # Draft delivered, in review
    FINAL = "final"           # Project complete


class Package(str, enum.Enum):
    """Service packages with pricing"""
    GROWTH = "growth"               # $12,000 - 4-6 weeks
    INSTITUTIONAL = "institutional" # $25,000 - 6-8 weeks
    INFRASTRUCTURE = "infrastructure" # $45,000 - 10-12 weeks
    CUSTOM = "custom"               # Custom scope/pricing


# Package pricing reference
PACKAGE_PRICING = {
    Package.GROWTH: {
        "price": 12000,
        "timeline_weeks_min": 4,
        "timeline_weeks_max": 6,
        "revision_rounds": 2,
        "description": "Emerging projects seeking growth capital"
    },
    Package.INSTITUTIONAL: {
        "price": 25000,
        "timeline_weeks_min": 6,
        "timeline_weeks_max": 8,
        "revision_rounds": 3,
        "description": "Established projects seeking institutional funding"
    },
    Package.INFRASTRUCTURE: {
        "price": 45000,
        "timeline_weeks_min": 10,
        "timeline_weeks_max": 12,
        "revision_rounds": 4,
        "description": "Large-scale infrastructure projects"
    },
    Package.CUSTOM: {
        "price": None,
        "timeline_weeks_min": None,
        "timeline_weeks_max": None,
        "revision_rounds": None,
        "description": "Custom scope and pricing"
    }
}


class Currency(str, enum.Enum):
    """Supported currencies"""
    USD = "USD"
    ZAR = "ZAR"
    EUR = "EUR"
    GBP = "GBP"


class Project(Base):
    """
    A financial modelling project for a client.
    Tracks from inquiry through to final delivery.
    """
    __tablename__ = "projects"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    contact_id: Mapped[int] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Primary contact for this project"
    )

    # Project identification
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Project name (e.g., 'Solar Farm Feasibility Study')"
    )
    reference: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        comment="Project reference (e.g., 'JASP-2025-001')"
    )
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Pipeline stage
    stage: Mapped[ProjectStage] = mapped_column(
        SQLEnum(ProjectStage),
        default=ProjectStage.INQUIRY,
        index=True
    )
    stage_changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        comment="When stage last changed"
    )

    # Package and pricing
    package: Mapped[Package] = mapped_column(
        SQLEnum(Package),
        default=Package.GROWTH
    )
    value: Mapped[int] = mapped_column(
        Integer,
        default=12000,
        comment="Project value in primary currency"
    )
    currency: Mapped[Currency] = mapped_column(
        SQLEnum(Currency),
        default=Currency.USD
    )

    # Timeline
    inquiry_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        comment="When inquiry received"
    )
    start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        comment="When production started"
    )
    target_completion: Mapped[Optional[date]] = mapped_column(
        Date,
        comment="Target delivery date"
    )
    actual_completion: Mapped[Optional[date]] = mapped_column(
        Date,
        comment="Actual delivery date"
    )

    # Revision tracking
    revision_rounds_used: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of revision rounds used"
    )
    revision_rounds_total: Mapped[int] = mapped_column(
        Integer,
        default=2,
        comment="Total revision rounds included"
    )

    # Project details (from intake)
    project_sector: Mapped[Optional[str]] = mapped_column(String(100))
    project_location: Mapped[Optional[str]] = mapped_column(String(255))
    funding_amount: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Target funding amount in USD"
    )
    target_dfis: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        default=list,
        comment="Target DFIs: ['ifc', 'afdb']"
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    internal_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        comment="Internal notes not visible to client"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    company: Mapped["Company"] = relationship(
        "Company",
        back_populates="projects"
    )
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact",
        back_populates="projects"
    )
    milestones: Mapped[List["Milestone"]] = relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Milestone.order"
    )
    invoices: Mapped[List["Invoice"]] = relationship(
        "Invoice",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    interactions: Mapped[List["Interaction"]] = relationship(
        "Interaction",
        back_populates="project"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, ref='{self.reference}', stage='{self.stage}')>"

    @property
    def package_info(self) -> dict:
        """Get package pricing details"""
        return PACKAGE_PRICING.get(self.package, PACKAGE_PRICING[Package.CUSTOM])

    @property
    def deposit_amount(self) -> int:
        """50% deposit amount"""
        return self.value // 2

    @property
    def final_amount(self) -> int:
        """50% final payment"""
        return self.value - self.deposit_amount

    @property
    def is_active(self) -> bool:
        """Is project currently in production"""
        return self.stage in [
            ProjectStage.DEPOSIT,
            ProjectStage.PRODUCTION,
            ProjectStage.DRAFT
        ]

    @property
    def is_complete(self) -> bool:
        """Is project finished"""
        return self.stage == ProjectStage.FINAL

    @property
    def progress_percent(self) -> int:
        """Estimated progress percentage based on milestones"""
        if not self.milestones:
            stage_progress = {
                ProjectStage.INQUIRY: 0,
                ProjectStage.QUALIFY: 10,
                ProjectStage.INTAKE: 15,
                ProjectStage.PROPOSAL: 20,
                ProjectStage.DEPOSIT: 25,
                ProjectStage.PRODUCTION: 50,
                ProjectStage.DRAFT: 85,
                ProjectStage.FINAL: 100,
            }
            return stage_progress.get(self.stage, 0)

        completed = sum(1 for m in self.milestones if m.completed)
        total = len(self.milestones)
        return int((completed / total) * 100) if total > 0 else 0

    def advance_stage(self) -> "ProjectStage":
        """Move to next pipeline stage"""
        stage_order = list(ProjectStage)
        current_index = stage_order.index(self.stage)
        if current_index < len(stage_order) - 1:
            self.stage = stage_order[current_index + 1]
            self.stage_changed_at = datetime.utcnow()
        return self.stage

    @classmethod
    def generate_reference(cls, year: int = None, sequence: int = 1) -> str:
        """Generate project reference: JASP-2025-001"""
        if year is None:
            year = datetime.now().year
        return f"JASP-{year}-{sequence:03d}"
