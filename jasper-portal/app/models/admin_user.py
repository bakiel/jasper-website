"""
JASPER CRM - Admin User Model
Internal staff who manage clients and projects
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlalchemy import String, Text, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
import bcrypt

from app.models.base import Base


class AdminRole(str, Enum):
    """Admin role levels"""
    SUPER_ADMIN = "super_admin"  # Full access, can manage other admins
    ADMIN = "admin"              # Full access to CRM, projects, clients
    MANAGER = "manager"          # Can manage projects and view clients
    VIEWER = "viewer"            # Read-only access


class AdminUser(Base):
    """
    Internal admin user for managing the CRM.
    Separate from Contact (client users).
    """
    __tablename__ = "admin_users"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True
    )
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Google OAuth
    google_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)

    # Personal details
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Role and permissions
    role: Mapped[AdminRole] = mapped_column(
        SQLEnum(AdminRole),
        default=AdminRole.VIEWER,
        nullable=False
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Session tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_login_ip: Mapped[Optional[str]] = mapped_column(String(45))

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

    def __repr__(self):
        return f"<AdminUser(id={self.id}, email='{self.email}', role='{self.role}')>"

    @property
    def full_name(self) -> str:
        """Full name of admin"""
        return f"{self.first_name} {self.last_name}"

    def set_password(self, password: str) -> None:
        """Hash and set password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        if not self.password_hash:
            return False  # Google-only users have no password
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def can_manage_admins(self) -> bool:
        """Check if user can manage other admins"""
        return self.role == AdminRole.SUPER_ADMIN

    def can_manage_clients(self) -> bool:
        """Check if user can create/edit clients"""
        return self.role in [AdminRole.SUPER_ADMIN, AdminRole.ADMIN]

    def can_manage_projects(self) -> bool:
        """Check if user can create/edit projects"""
        return self.role in [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER]

    def can_view(self) -> bool:
        """Check if user can view data"""
        return self.is_active
