"""
JASPER CRM - Company Model
Represents client organisations (the companies we work with)
"""

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.project import Project
    from app.models.interaction import Interaction


class Industry(str, enum.Enum):
    """Industry sectors JASPER serves"""
    RENEWABLE_ENERGY = "renewable_energy"
    INFRASTRUCTURE = "infrastructure"
    AGRICULTURE = "agriculture"
    MANUFACTURING = "manufacturing"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    TECHNOLOGY = "technology"
    REAL_ESTATE = "real_estate"
    MINING = "mining"
    WATER_SANITATION = "water_sanitation"
    TRANSPORT = "transport"
    TELECOM = "telecom"
    OTHER = "other"


class DFITarget(str, enum.Enum):
    """Development Finance Institutions"""
    IFC = "ifc"           # International Finance Corporation
    AFDB = "afdb"         # African Development Bank
    ADB = "adb"           # Asian Development Bank
    IDC = "idc"           # Industrial Development Corporation (SA)
    DBSA = "dbsa"         # Development Bank of Southern Africa
    EIB = "eib"           # European Investment Bank
    DFC = "dfc"           # US International Development Finance Corp
    OPIC = "opic"         # Overseas Private Investment Corporation
    CDC = "cdc"           # CDC Group (UK)
    FMO = "fmo"           # Dutch Development Bank
    DEG = "deg"           # German Development Finance
    PROPARCO = "proparco" # French Development Finance
    OTHER = "other"


class CompanyStatus(str, enum.Enum):
    """Company lifecycle status"""
    LEAD = "lead"              # Initial inquiry
    PROSPECT = "prospect"      # Qualified, in discussion
    CLIENT = "client"          # Has active/past project
    INACTIVE = "inactive"      # No activity 6+ months
    CHURNED = "churned"        # Lost/declined


class Company(Base):
    """
    Client company record.
    All business is done with companies, contacts are people at companies.
    """
    __tablename__ = "companies"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Company details
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    trading_name: Mapped[Optional[str]] = mapped_column(String(255))
    registration_number: Mapped[Optional[str]] = mapped_column(String(100))

    # Classification
    industry: Mapped[Industry] = mapped_column(
        SQLEnum(Industry),
        default=Industry.OTHER
    )
    status: Mapped[CompanyStatus] = mapped_column(
        SQLEnum(CompanyStatus),
        default=CompanyStatus.LEAD,
        index=True
    )

    # Location
    country: Mapped[str] = mapped_column(String(100), default="South Africa")
    city: Mapped[Optional[str]] = mapped_column(String(100))
    address: Mapped[Optional[str]] = mapped_column(Text)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))

    # Contact info
    website: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(255))

    # DFI targeting
    dfi_targets: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        default=list,
        comment="List of target DFIs: ['ifc', 'afdb']"
    )

    # Project scope
    project_value_min: Mapped[Optional[int]] = mapped_column(
        comment="Minimum project value in USD"
    )
    project_value_max: Mapped[Optional[int]] = mapped_column(
        comment="Maximum project value in USD"
    )

    # Source/attribution
    lead_source: Mapped[Optional[str]] = mapped_column(
        String(100),
        comment="How they found us: website, referral, linkedin, conference"
    )
    referred_by: Mapped[Optional[str]] = mapped_column(String(255))

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)

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
    contacts: Mapped[List["Contact"]] = relationship(
        "Contact",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    interactions: Mapped[List["Interaction"]] = relationship(
        "Interaction",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}', status='{self.status}')>"

    @property
    def primary_contact(self) -> Optional["Contact"]:
        """Get primary contact for this company"""
        for contact in self.contacts:
            if contact.is_primary:
                return contact
        return self.contacts[0] if self.contacts else None

    @property
    def total_project_value(self) -> float:
        """Sum of all project values"""
        return sum(p.value for p in self.projects if p.value)

    @property
    def active_projects(self) -> List["Project"]:
        """Projects currently in production"""
        from app.models.project import ProjectStage
        active_stages = [
            ProjectStage.DEPOSIT,
            ProjectStage.PRODUCTION,
            ProjectStage.DRAFT
        ]
        return [p for p in self.projects if p.stage in active_stages]
