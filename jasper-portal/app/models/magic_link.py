"""
JASPER CRM - Magic Link Model
Passwordless authentication tokens
"""

from datetime import datetime, timedelta
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import secrets

from app.models.base import Base
from app.core.config import get_settings

if TYPE_CHECKING:
    from app.models.contact import Contact

settings = get_settings()


class MagicLink(Base):
    """
    Magic link for passwordless authentication.
    Sent via email, expires after configured time.
    """
    __tablename__ = "magic_links"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key
    contact_id: Mapped[int] = mapped_column(
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Token
    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False
    )

    # Status
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Expiry
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    # Security
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        comment="IP that requested the link"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        comment="Browser user agent"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    contact: Mapped["Contact"] = relationship(
        "Contact",
        back_populates="magic_links"
    )

    def __repr__(self):
        status = "used" if self.used else ("expired" if self.is_expired else "valid")
        return f"<MagicLink(id={self.id}, status='{status}')>"

    @property
    def is_expired(self) -> bool:
        """Check if link has expired"""
        return datetime.utcnow() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if link is valid (not used and not expired)"""
        return not self.used and not self.is_expired

    @property
    def minutes_remaining(self) -> int:
        """Minutes until expiry"""
        if self.is_expired:
            return 0
        remaining = self.expires_at - datetime.utcnow()
        return int(remaining.total_seconds() / 60)

    @property
    def login_url(self) -> str:
        """Full URL for magic link login"""
        return f"{settings.FRONTEND_URL}/auth/verify?token={self.token}"

    def mark_used(self):
        """Mark link as used"""
        self.used = True
        self.used_at = datetime.utcnow()

    @classmethod
    def generate_token(cls) -> str:
        """Generate secure random token"""
        return secrets.token_urlsafe(48)

    @classmethod
    def create_for_contact(
        cls,
        contact_id: int,
        ip_address: str = None,
        user_agent: str = None,
        expiry_minutes: int = None
    ) -> "MagicLink":
        """Create a new magic link for a contact"""
        if expiry_minutes is None:
            expiry_minutes = settings.MAGIC_LINK_EXPIRE_MINUTES

        return cls(
            contact_id=contact_id,
            token=cls.generate_token(),
            expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes),
            ip_address=ip_address,
            user_agent=user_agent
        )
