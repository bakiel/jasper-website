"""
JASPER CRM - Contact Model
People at client companies
"""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.project import Project
    from app.models.interaction import Interaction
    from app.models.magic_link import MagicLink


class Contact(Base):
    """
    Individual person at a client company.
    Contacts receive emails, access portal, sign documents.
    """
    __tablename__ = "contacts"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Personal details
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    mobile: Mapped[Optional[str]] = mapped_column(String(50))

    # Role
    job_title: Mapped[Optional[str]] = mapped_column(String(150))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Primary contact for the company"
    )
    is_decision_maker: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Can authorise payments/contracts"
    )

    # Portal access
    portal_access: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment="Can access client portal"
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Communication preferences
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    accepts_marketing: Mapped[bool] = mapped_column(Boolean, default=True)

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
    company: Mapped["Company"] = relationship(
        "Company",
        back_populates="contacts"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="contact"
    )
    interactions: Mapped[List["Interaction"]] = relationship(
        "Interaction",
        back_populates="contact"
    )
    magic_links: Mapped[List["MagicLink"]] = relationship(
        "MagicLink",
        back_populates="contact",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.full_name}', email='{self.email}')>"

    @property
    def full_name(self) -> str:
        """Full name of contact"""
        return f"{self.first_name} {self.last_name}"

    @property
    def display_name(self) -> str:
        """Name with title for formal use"""
        if self.job_title:
            return f"{self.full_name}, {self.job_title}"
        return self.full_name
