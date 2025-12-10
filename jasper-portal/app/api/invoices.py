"""
JASPER Client Portal - Invoices API
Invoice generation, payment tracking, crypto discounts with real database
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime, timedelta, date
from pydantic import BaseModel, EmailStr
from pathlib import Path

from app.core.config import get_settings
from app.models.base import get_db
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus, PaymentMethod
from app.models.project import Project
from app.services.documents import document_service
from app.services.email import email_service

router = APIRouter()
settings = get_settings()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class InvoiceCreate(BaseModel):
    project_id: int
    invoice_type: InvoiceType = InvoiceType.DEPOSIT
    amount: Optional[int] = None  # If None, calculates from project
    currency: str = "USD"
    due_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    project_id: int
    invoice_type: InvoiceType
    amount: int
    currency: str
    final_amount: int
    crypto_discount_applied: bool
    discount_amount: int
    status: InvoiceStatus
    issue_date: date
    due_date: date
    sent_at: Optional[datetime]
    viewed_at: Optional[datetime]
    paid_at: Optional[datetime]
    payment_method: Optional[PaymentMethod]
    payment_reference: Optional[str]
    pdf_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class MarkPaidRequest(BaseModel):
    payment_method: PaymentMethod
    reference: Optional[str] = None
    notes: Optional[str] = None


class CryptoPaymentResponse(BaseModel):
    invoice_number: str
    original_amount: int
    discounted_amount: int
    discount_percent: str
    currency: str
    wallets: dict
    instructions: List[str]


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_invoice_number(db: Session, year: int = None) -> str:
    """Generate unique invoice number: INV-YYYY-XXX"""
    if year is None:
        year = datetime.now().year

    # Count existing invoices for this year
    pattern = f"INV-{year}-%"
    count = db.execute(
        select(func.count(Invoice.id))
        .where(Invoice.invoice_number.like(pattern))
    ).scalar() or 0

    return f"INV-{year}-{count + 1:03d}"


async def send_invoice_email(invoice: Invoice, project: Project):
    """Send invoice email to client"""
    company = project.company
    contact = company.primary_contact

    if not contact or not contact.email:
        print(f"[EMAIL] No contact email for invoice {invoice.invoice_number}")
        return

    invoice_url = f"{settings.FRONTEND_URL}/invoices/{invoice.id}"

    await email_service.send_invoice(
        email=contact.email,
        first_name=contact.first_name,
        invoice_number=invoice.invoice_number,
        project_name=project.name,
        amount=invoice.final_amount / 100,  # Convert cents to dollars
        currency=invoice.currency,
        due_date=invoice.due_date.strftime("%d %B %Y"),
        invoice_type=invoice.invoice_type.value,
        invoice_url=invoice_url
    )
    print(f"[EMAIL] Invoice {invoice.invoice_number} sent to {contact.email}")


async def send_payment_confirmation(invoice: Invoice, project: Project):
    """Send payment confirmation email"""
    company = project.company
    contact = company.primary_contact

    if not contact or not contact.email:
        print(f"[EMAIL] No contact email for payment confirmation {invoice.invoice_number}")
        return

    await email_service.send_payment_confirmation(
        email=contact.email,
        first_name=contact.first_name,
        invoice_number=invoice.invoice_number,
        amount=invoice.final_amount / 100,
        currency=invoice.currency,
        payment_method=invoice.payment_method.value if invoice.payment_method else "Unknown",
        paid_date=invoice.paid_at.strftime("%d %B %Y") if invoice.paid_at else "",
        invoice_type=invoice.invoice_type.value,
        crypto_discount=invoice.crypto_discount_applied
    )
    print(f"[EMAIL] Payment confirmation sent for {invoice.invoice_number}")


# ============================================
# INVOICE ENDPOINTS
# ============================================

@router.post("/", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new invoice for a project.
    Supports deposit (50%), balance (50%), or full payment.
    """
    # Get project
    project = db.execute(
        select(Project).where(Project.id == data.project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Calculate amount if not provided
    if data.amount is None:
        if data.invoice_type == InvoiceType.DEPOSIT:
            amount = project.deposit_amount
        elif data.invoice_type == InvoiceType.FINAL:
            amount = project.final_amount
        else:
            amount = project.value
    else:
        amount = data.amount

    # Generate invoice number
    invoice_number = generate_invoice_number(db)

    # Create invoice
    invoice = Invoice(
        project_id=data.project_id,
        invoice_number=invoice_number,
        invoice_type=data.invoice_type,
        amount=amount,
        currency=data.currency,
        final_amount=amount,  # Will be adjusted if crypto discount applied
        due_date=data.due_date or (date.today() + timedelta(days=7)),
        notes=data.notes
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Generate PDF
    background_tasks.add_task(
        generate_invoice_pdf,
        invoice.id,
        db
    )

    # Queue email notification
    background_tasks.add_task(send_invoice_email, invoice, project)

    return invoice


@router.get("/", response_model=InvoiceListResponse)
async def list_invoices(
    project_id: Optional[int] = None,
    status: Optional[InvoiceStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all invoices with pagination and filters"""
    query = select(Invoice)

    if project_id:
        query = query.where(Invoice.project_id == project_id)
    if status:
        query = query.where(Invoice.status == status)

    query = query.order_by(Invoice.created_at.desc())

    # Count total
    count_query = select(func.count(Invoice.id))
    if project_id:
        count_query = count_query.where(Invoice.project_id == project_id)
    if status:
        count_query = count_query.where(Invoice.status == status)
    total = db.execute(count_query).scalar()

    # Paginate
    offset = (page - 1) * page_size
    invoices = db.execute(
        query.offset(offset).limit(page_size)
    ).scalars().all()

    return InvoiceListResponse(
        invoices=invoices,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """Get invoice details"""
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice


@router.post("/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(
    invoice_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Mark invoice as sent and email to client"""
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.mark_sent()
    db.commit()
    db.refresh(invoice)

    # Queue email
    project = db.execute(
        select(Project).where(Project.id == invoice.project_id)
    ).scalar_one()
    background_tasks.add_task(send_invoice_email, invoice, project)

    return invoice


@router.post("/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_invoice_paid(
    invoice_id: int,
    data: MarkPaidRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Mark invoice as paid.
    Applies 3% discount for crypto payments.
    """
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.mark_paid(
        payment_method=data.payment_method,
        reference=data.reference,
        notes=data.notes
    )

    db.commit()
    db.refresh(invoice)

    # Queue confirmation email
    project = db.execute(
        select(Project).where(Project.id == invoice.project_id)
    ).scalar_one()
    background_tasks.add_task(send_payment_confirmation, invoice, project)

    return invoice


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(
    invoice_id: int,
    regenerate: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get or generate invoice PDF.
    Uses the V3 template with JASPER design system.
    """
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Check if PDF exists
    if invoice.pdf_path and Path(invoice.pdf_path).exists() and not regenerate:
        return FileResponse(
            invoice.pdf_path,
            media_type="application/pdf",
            filename=f"Invoice_{invoice.invoice_number}.pdf"
        )

    # Generate PDF
    project = db.execute(
        select(Project).where(Project.id == invoice.project_id)
    ).scalar_one()

    company = project.company
    contact = company.primary_contact

    pdf_path = await document_service.generate_invoice(
        invoice_number=invoice.invoice_number,
        client_name=f"{contact.first_name} {contact.last_name}" if contact else "",
        client_company=company.name,
        client_email=contact.email if contact else "",
        project_name=project.name,
        package_name=project.package.value.title() if project.package else "",
        amount=invoice.final_amount / 100,  # Convert cents to dollars
        currency=invoice.currency,
        invoice_type=invoice.invoice_type.value.title(),
        total_amount=project.value / 100 if project.value else None,
        output_filename=f"Invoice_{invoice.invoice_number}.pdf"
    )

    # Update invoice with PDF path
    invoice.pdf_path = pdf_path
    db.commit()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Invoice_{invoice.invoice_number}.pdf"
    )


@router.get("/{invoice_id}/crypto-payment", response_model=CryptoPaymentResponse)
async def get_crypto_payment_info(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """
    Get crypto payment information with QR codes.
    Returns wallet addresses and discounted amount.
    """
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Calculate discounted amount (3% off)
    discounted_amount = int(invoice.amount * (1 - settings.CRYPTO_DISCOUNT))

    return CryptoPaymentResponse(
        invoice_number=invoice.invoice_number,
        original_amount=invoice.amount,
        discounted_amount=discounted_amount,
        discount_percent=f"{int(settings.CRYPTO_DISCOUNT * 100)}%",
        currency=invoice.currency,
        wallets={
            "usdt_trc20": {
                "address": settings.USDT_TRC20,
                "network": "TRC20 (Tron)",
                "qr_url": "/static/images/qr_usdt.png"
            },
            "usdc_erc20": {
                "address": settings.USDC_ERC20,
                "network": "ERC20 (Ethereum)",
                "qr_url": "/static/images/qr_usdc.png"
            },
            "btc": {
                "address": settings.BTC_ADDRESS,
                "network": "Bitcoin Mainnet",
                "qr_url": "/static/images/qr_btc.png"
            }
        },
        instructions=[
            f"Send exactly {invoice.currency} {discounted_amount / 100:,.2f} worth of crypto",
            "USDT must be sent on TRC20 (Tron) network",
            "USDC must be sent on ERC20 (Ethereum) network",
            "BTC on Bitcoin mainnet only",
            f"Include '{invoice.invoice_number}' in memo if possible",
            f"Email {settings.COMPANY_EMAIL} with TX hash after payment"
        ]
    )


@router.get("/{invoice_id}/crypto-payment/pdf")
async def get_crypto_payment_pdf(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """Generate crypto payment page PDF with QR codes"""
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pdf_path = await document_service.generate_crypto_payment_page(
        invoice_number=invoice.invoice_number,
        amount=invoice.amount / 100,
        currency=invoice.currency,
        output_filename=f"Crypto_Payment_{invoice.invoice_number}.pdf"
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Crypto_Payment_{invoice.invoice_number}.pdf"
    )


# ============================================
# BACKGROUND TASKS
# ============================================

async def generate_invoice_pdf(invoice_id: int, db: Session):
    """Background task to generate invoice PDF"""
    invoice = db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    ).scalar_one_or_none()

    if not invoice:
        return

    project = db.execute(
        select(Project).where(Project.id == invoice.project_id)
    ).scalar_one()

    company = project.company
    contact = company.primary_contact

    pdf_path = await document_service.generate_invoice(
        invoice_number=invoice.invoice_number,
        client_name=f"{contact.first_name} {contact.last_name}" if contact else "",
        client_company=company.name,
        client_email=contact.email if contact else "",
        project_name=project.name,
        package_name=project.package.value.title() if project.package else "",
        amount=invoice.final_amount / 100,
        currency=invoice.currency,
        invoice_type=invoice.invoice_type.value.title(),
        total_amount=project.value / 100 if project.value else None
    )

    invoice.pdf_path = pdf_path
    db.commit()
