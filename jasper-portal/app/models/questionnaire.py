"""
JASPER CRM - Client Intake Questionnaire Model
Stores client onboarding questionnaire responses
"""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Boolean, Integer, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact


class ProjectTimeline(str, enum.Enum):
    """Expected project timeline"""
    URGENT = "urgent"           # Less than 1 month
    SHORT = "short"             # 1-3 months
    MEDIUM = "medium"           # 3-6 months
    LONG = "long"               # 6-12 months
    FLEXIBLE = "flexible"       # No specific timeline


class FundingStatus(str, enum.Enum):
    """Current funding status"""
    SELF_FUNDED = "self_funded"
    SEEKING_FUNDING = "seeking_funding"
    PARTIALLY_FUNDED = "partially_funded"
    FULLY_FUNDED = "fully_funded"
    NOT_APPLICABLE = "not_applicable"


class ProjectReadiness(str, enum.Enum):
    """Project readiness level"""
    CONCEPT = "concept"                 # Just an idea
    FEASIBILITY = "feasibility"         # Doing feasibility studies
    PLANNING = "planning"               # Detailed planning stage
    READY_FOR_FUNDING = "ready_for_funding"  # Ready to approach funders
    IMPLEMENTATION = "implementation"    # Already implementing


class IntakeQuestionnaire(Base):
    """
    Client intake questionnaire responses.
    Collected after client's first portal login.
    """
    __tablename__ = "intake_questionnaires"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One questionnaire per company
        index=True
    )
    submitted_by_contact_id: Mapped[int] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True
    )

    # Section 1: Company Information Enhancement
    company_description: Mapped[Optional[str]] = mapped_column(
        Text,
        comment="Brief description of the company and its activities"
    )
    years_in_operation: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Number of years company has been operating"
    )
    employee_count: Mapped[Optional[str]] = mapped_column(
        String(50),
        comment="Employee count range: 1-10, 11-50, 51-200, 201-500, 500+"
    )
    annual_revenue_range: Mapped[Optional[str]] = mapped_column(
        String(100),
        comment="Annual revenue range in USD"
    )

    # Section 2: Project Details
    project_name: Mapped[Optional[str]] = mapped_column(String(255))
    project_description: Mapped[Optional[str]] = mapped_column(Text)
    project_location: Mapped[Optional[str]] = mapped_column(String(255))
    project_value_estimate: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Estimated project value in USD"
    )
    project_timeline: Mapped[Optional[ProjectTimeline]] = mapped_column(
        SQLEnum(ProjectTimeline)
    )
    project_readiness: Mapped[Optional[ProjectReadiness]] = mapped_column(
        SQLEnum(ProjectReadiness)
    )

    # Section 3: Funding Requirements
    funding_status: Mapped[Optional[FundingStatus]] = mapped_column(
        SQLEnum(FundingStatus)
    )
    funding_amount_required: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Amount of funding required in USD"
    )
    dfi_experience: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Has the company worked with DFIs before?"
    )
    previous_dfi_partners: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        default=list,
        comment="List of DFIs previously worked with"
    )
    preferred_dfis: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        default=list,
        comment="Preferred DFIs to target"
    )

    # Section 4: Documents Available
    has_business_plan: Mapped[bool] = mapped_column(Boolean, default=False)
    has_financial_statements: Mapped[bool] = mapped_column(Boolean, default=False)
    has_feasibility_study: Mapped[bool] = mapped_column(Boolean, default=False)
    has_environmental_assessment: Mapped[bool] = mapped_column(Boolean, default=False)
    has_legal_documentation: Mapped[bool] = mapped_column(Boolean, default=False)
    additional_documents: Mapped[Optional[str]] = mapped_column(
        Text,
        comment="Other available documents"
    )

    # Section 5: Impact & ESG
    jobs_to_be_created: Mapped[Optional[int]] = mapped_column(Integer)
    sdg_alignment: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        default=list,
        comment="UN Sustainable Development Goals alignment"
    )
    environmental_benefits: Mapped[Optional[str]] = mapped_column(Text)
    social_impact_description: Mapped[Optional[str]] = mapped_column(Text)

    # Section 6: Additional Information
    challenges_faced: Mapped[Optional[str]] = mapped_column(Text)
    specific_assistance_needed: Mapped[Optional[str]] = mapped_column(Text)
    how_did_you_hear: Mapped[Optional[str]] = mapped_column(String(255))
    additional_comments: Mapped[Optional[str]] = mapped_column(Text)

    # Meta
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether questionnaire has been fully completed"
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
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
    company: Mapped["Company"] = relationship("Company")
    submitted_by: Mapped[Optional["Contact"]] = relationship("Contact")

    def __repr__(self):
        return f"<IntakeQuestionnaire(id={self.id}, company_id={self.company_id}, completed={self.completed})>"
