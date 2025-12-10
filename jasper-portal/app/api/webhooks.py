"""
JASPER Client Portal - Webhooks API
Integration endpoints for payment processors and external services
"""

from fastapi import APIRouter, HTTPException, Request, Header, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from datetime import datetime
import hashlib
import hmac

from app.models.base import get_db
from app.models.invoice import Invoice, InvoiceStatus, PaymentMethod
from app.models.company import Company, CompanyStatus
from app.models.contact import Contact
from app.models.interaction import Interaction, InteractionType
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.post("/payment/crypto")
async def crypto_payment_webhook(
    request: Request,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook for crypto payment notifications.
    Called by blockchain monitoring service when payment detected.
    """
    body = await request.body()

    # Verify signature (in production)
    # if not verify_signature(body, x_signature):
    #     raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()

    tx_hash = data.get("tx_hash")
    wallet_address = data.get("to_address")
    amount = data.get("amount")
    currency = data.get("currency")  # USDT, USDC, BTC
    invoice_ref = data.get("memo") or data.get("reference")

    # Find matching invoice
    invoice = db.execute(
        select(Invoice).where(Invoice.invoice_number == invoice_ref)
    ).scalar_one_or_none()

    if invoice:
        # Map crypto currency to payment method
        crypto_methods = {
            "USDT": PaymentMethod.USDT,
            "USDC": PaymentMethod.USDC,
            "BTC": PaymentMethod.BITCOIN
        }
        payment_method = crypto_methods.get(currency.upper(), PaymentMethod.CRYPTO_OTHER)

        invoice.mark_paid(
            payment_method=payment_method,
            reference=tx_hash,
            notes=f"Crypto payment via {currency}"
        )
        db.commit()

        return {
            "status": "processed",
            "invoice_number": invoice.invoice_number,
            "tx_hash": tx_hash
        }

    return {
        "status": "no_match",
        "message": "No matching invoice found for this payment"
    }


@router.post("/payment/paypal")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    PayPal IPN (Instant Payment Notification) webhook.
    Processes PayPal payment confirmations.
    """
    data = await request.json()

    event_type = data.get("event_type")
    resource = data.get("resource", {})

    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        payment_id = resource.get("id")
        amount = resource.get("amount", {}).get("value")
        custom_id = resource.get("custom_id")  # Invoice number

        # Find and update invoice
        invoice = db.execute(
            select(Invoice).where(Invoice.invoice_number == custom_id)
        ).scalar_one_or_none()

        if invoice:
            invoice.mark_paid(
                payment_method=PaymentMethod.PAYPAL,
                reference=payment_id,
                notes="PayPal payment"
            )
            db.commit()

    return {"status": "received"}


@router.post("/contact-form")
async def contact_form_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook for contact form submissions from main website.
    Creates new company and contact record in pipeline.
    """
    data = await request.json()

    name_parts = data.get("name", "").split()
    first_name = name_parts[0] if name_parts else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    # Create company
    company = Company(
        name=data.get("company", "Not provided"),
        status=CompanyStatus.LEAD,
        country=data.get("country", "Unknown"),
        email=data.get("email"),
        phone=data.get("phone"),
        lead_source=data.get("source", "Website"),
        notes=data.get("message")
    )
    db.add(company)
    db.flush()

    # Create contact
    contact = Contact(
        company_id=company.id,
        first_name=first_name,
        last_name=last_name,
        email=data.get("email"),
        phone=data.get("phone"),
        job_title=data.get("role"),
        is_primary=True,
        is_decision_maker=True
    )
    db.add(contact)

    # Log interaction
    interaction = Interaction(
        company_id=company.id,
        contact_id=contact.id,
        interaction_type=InteractionType.FORM_SUBMITTED,
        subject="Website Contact Form",
        content=data.get("message"),
        created_by="website"
    )
    db.add(interaction)

    db.commit()

    return {
        "status": "created",
        "company_id": company.id,
        "contact_id": contact.id,
        "pipeline_stage": "inquiry"
    }


@router.post("/n8n/workflow-update")
async def n8n_workflow_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook for n8n workflow automation updates.
    Receives status updates from automated workflows.
    """
    data = await request.json()

    workflow_id = data.get("workflow_id")
    company_id = data.get("company_id") or data.get("client_id")
    action = data.get("action")
    result = data.get("result")

    # Log workflow execution
    print(f"[N8N] Workflow {workflow_id} for company {company_id}: {action} -> {result}")

    # Update company based on action
    if action == "email_sent" and company_id:
        company = db.execute(
            select(Company).where(Company.id == int(company_id))
        ).scalar_one_or_none()

        if company:
            company.updated_at = datetime.utcnow()
            db.commit()

    return {"status": "acknowledged", "workflow_id": workflow_id}


def verify_signature(body: bytes, signature: str, secret: str = None) -> bool:
    """Verify webhook signature for security"""
    if not secret:
        secret = settings.SECRET_KEY

    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature or "")
