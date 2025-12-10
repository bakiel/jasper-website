"""
JASPER CRM - Invoice Model
Invoice tracking with crypto payment support
"""

from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Integer, Numeric, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
import enum

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project


class InvoiceType(str, enum.Enum):
    """Invoice types"""
    DEPOSIT = "deposit"   # 50% upfront
    FINAL = "final"       # 50% on delivery
    FULL = "full"         # 100% (rare)
    CUSTOM = "custom"     # Custom amount


class InvoiceStatus(str, enum.Enum):
    """Invoice payment status"""
    DRAFT = "draft"       # Not yet sent
    SENT = "sent"         # Sent to client
    VIEWED = "viewed"     # Client viewed
    PARTIAL = "partial"   # Partially paid
    PAID = "paid"         # Fully paid
    OVERDUE = "overdue"   # Past due date
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Payment methods"""
    BANK_TRANSFER = "bank_transfer"  # FNB
    PAYPAL = "paypal"
    USDT_TRC20 = "usdt_trc20"        # 3% discount
    USDC_ERC20 = "usdc_erc20"        # 3% discount
    BTC = "btc"                       # 3% discount
    OTHER = "other"


class Invoice(Base):
    """
    Invoice for project payments.
    Supports crypto payments with 3% discount.
    """
    __tablename__ = "invoices"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Invoice identification
    invoice_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        comment="Format: INV-2025-001"
    )

    # Type and amounts
    invoice_type: Mapped[InvoiceType] = mapped_column(
        SQLEnum(InvoiceType),
        default=InvoiceType.DEPOSIT
    )
    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Invoice amount in cents (or smallest unit)"
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="USD",
        nullable=False
    )

    # Crypto discount
    crypto_discount_applied: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="3% crypto discount applied"
    )
    discount_amount: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Discount amount in cents"
    )
    final_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Final amount after discounts"
    )

    # Status
    status: Mapped[InvoiceStatus] = mapped_column(
        SQLEnum(InvoiceStatus),
        default=InvoiceStatus.DRAFT,
        index=True
    )

    # Dates
    issue_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )
    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    viewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Payment details
    payment_method: Mapped[Optional[PaymentMethod]] = mapped_column(
        SQLEnum(PaymentMethod)
    )
    payment_reference: Mapped[Optional[str]] = mapped_column(
        String(255),
        comment="Transaction ID or reference"
    )
    payment_notes: Mapped[Optional[str]] = mapped_column(Text)

    # PDF storage
    pdf_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        comment="Path to generated PDF"
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text)

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
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="invoices"
    )

    def __repr__(self):
        return f"<Invoice(id={self.id}, number='{self.invoice_number}', status='{self.status}')>"

    @property
    def is_crypto_payment(self) -> bool:
        """Check if payment method is crypto"""
        return self.payment_method in [
            PaymentMethod.USDT_TRC20,
            PaymentMethod.USDC_ERC20,
            PaymentMethod.BTC
        ]

    @property
    def is_overdue(self) -> bool:
        """Check if invoice is overdue"""
        if self.status in [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]:
            return False
        return date.today() > self.due_date

    @property
    def days_overdue(self) -> int:
        """Days past due date"""
        if not self.is_overdue:
            return 0
        return (date.today() - self.due_date).days

    @property
    def amount_display(self) -> str:
        """Formatted amount for display"""
        return f"{self.currency} {self.final_amount:,.2f}"

    def apply_crypto_discount(self, discount_rate: float = 0.03):
        """Apply 3% crypto discount"""
        self.crypto_discount_applied = True
        self.discount_amount = int(self.amount * discount_rate)
        self.final_amount = self.amount - self.discount_amount

    def mark_sent(self):
        """Mark invoice as sent"""
        self.status = InvoiceStatus.SENT
        self.sent_at = datetime.utcnow()

    def mark_viewed(self):
        """Mark invoice as viewed"""
        if self.status == InvoiceStatus.SENT:
            self.status = InvoiceStatus.VIEWED
        self.viewed_at = datetime.utcnow()

    def mark_paid(
        self,
        payment_method: PaymentMethod,
        reference: str = None,
        notes: str = None
    ):
        """Mark invoice as paid"""
        self.status = InvoiceStatus.PAID
        self.paid_at = datetime.utcnow()
        self.payment_method = payment_method
        self.payment_reference = reference
        self.payment_notes = notes

        # Apply crypto discount if applicable
        if self.is_crypto_payment and not self.crypto_discount_applied:
            self.apply_crypto_discount()

    def check_overdue(self):
        """Update status if overdue"""
        if self.is_overdue and self.status in [InvoiceStatus.SENT, InvoiceStatus.VIEWED]:
            self.status = InvoiceStatus.OVERDUE

    @classmethod
    def generate_number(cls, year: int = None, sequence: int = 1) -> str:
        """Generate invoice number: INV-2025-001"""
        if year is None:
            year = datetime.now().year
        return f"INV-{year}-{sequence:03d}"

    @classmethod
    def create_deposit_invoice(cls, project: "Project") -> "Invoice":
        """Create 50% deposit invoice for project"""
        from datetime import timedelta

        return cls(
            project_id=project.id,
            invoice_number=cls.generate_number(),  # Will need proper sequencing
            invoice_type=InvoiceType.DEPOSIT,
            amount=project.deposit_amount,
            currency=project.currency.value,
            final_amount=project.deposit_amount,
            due_date=date.today() + timedelta(days=7)
        )

    @classmethod
    def create_final_invoice(cls, project: "Project") -> "Invoice":
        """Create 50% final invoice for project"""
        from datetime import timedelta

        return cls(
            project_id=project.id,
            invoice_number=cls.generate_number(),  # Will need proper sequencing
            invoice_type=InvoiceType.FINAL,
            amount=project.final_amount,
            currency=project.currency.value,
            final_amount=project.final_amount,
            due_date=date.today() + timedelta(days=14)
        )
