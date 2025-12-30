"""
JASPER CRM - Webhook Routes

Handles inbound webhooks from:
- WhatsApp Business API
- Email (via forwarding/polling service)
- LinkedIn (future)

All inbound messages are routed through the AgenticBrain
for AI-powered processing and response.
"""

import os
import hmac
import hashlib
import logging
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from orchestrator.events import message_received_event, lead_created_event, EventType
from services.comms_agent import comms_agent

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

# Webhook secrets for verification
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "jasper-whatsapp-verify")
WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")
EMAIL_WEBHOOK_SECRET = os.getenv("EMAIL_WEBHOOK_SECRET", "jasper-email-secret")


# =============================================================================
# REQUEST MODELS
# =============================================================================

class WhatsAppMessage(BaseModel):
    """WhatsApp inbound message structure"""
    from_number: str = Field(..., alias="from")
    id: str
    timestamp: str
    type: str
    text: Optional[Dict[str, str]] = None
    button: Optional[Dict[str, str]] = None
    interactive: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class EmailWebhookPayload(BaseModel):
    """Email webhook payload from email service"""
    message_id: str
    from_email: str
    from_name: Optional[str] = None
    to_email: str
    subject: str
    body_text: str
    body_html: Optional[str] = None
    timestamp: Optional[str] = None
    attachments: Optional[List[Dict]] = None
    headers: Optional[Dict[str, str]] = None


class ManualMessageRequest(BaseModel):
    """Manual message input for testing or manual entry"""
    lead_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    message: str
    channel: str = "whatsapp"
    auto_respond: bool = True


# =============================================================================
# WHATSAPP WEBHOOKS
# =============================================================================

@router.get("/whatsapp")
async def whatsapp_verify(request: Request):
    """
    WhatsApp webhook verification (required by Meta).

    Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge.
    We verify the token and echo back the challenge.
    """
    params = dict(request.query_params)

    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        return int(challenge)
    else:
        logger.warning(f"WhatsApp verification failed: mode={mode}, token={token}")
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle inbound WhatsApp messages from Meta Business API.

    Flow:
    1. Verify webhook signature
    2. Extract message data
    3. Find or create lead
    4. Route through AgenticBrain
    5. Send AI response
    """
    # Verify signature (optional but recommended)
    if WHATSAPP_APP_SECRET:
        signature = request.headers.get("X-Hub-Signature-256", "")
        body = await request.body()
        expected = "sha256=" + hmac.new(
            WHATSAPP_APP_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            logger.warning("WhatsApp signature verification failed")
            raise HTTPException(status_code=403, detail="Invalid signature")

    # Parse payload
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse WhatsApp payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Extract messages from payload
    messages = []
    try:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    messages.append({
                        "from_number": msg.get("from"),
                        "message_id": msg.get("id"),
                        "timestamp": msg.get("timestamp"),
                        "type": msg.get("type"),
                        "text": msg.get("text", {}).get("body") if msg.get("type") == "text" else None,
                        "contacts": value.get("contacts", [])
                    })
    except Exception as e:
        logger.error(f"Failed to extract WhatsApp messages: {e}")
        return {"status": "ok"}  # Always return 200 to Meta

    # Process each message in background
    for msg in messages:
        if msg.get("text"):
            background_tasks.add_task(
                process_whatsapp_message,
                phone=msg["from_number"],
                message=msg["text"],
                message_id=msg["message_id"],
                contacts=msg.get("contacts", [])
            )

    return {"status": "ok"}


async def process_whatsapp_message(
    phone: str,
    message: str,
    message_id: str,
    contacts: List[Dict] = None
):
    """
    Process a WhatsApp message through the AgenticBrain.

    1. Find existing lead by phone or create new
    2. Create message_received event
    3. Generate AI response
    4. Send response via WhatsApp
    """
    logger.info(f"Processing WhatsApp from {phone}: {message[:50]}...")

    try:
        # Import here to avoid circular imports
        from db.leads import get_lead_by_phone, create_lead
        from app.main import app

        # Get brain from app state
        brain = getattr(app.state, 'agentic_brain', None)

        # Find or create lead
        lead = await get_lead_by_phone(phone)

        if not lead:
            # Create new lead from WhatsApp
            contact_name = "WhatsApp User"
            if contacts and len(contacts) > 0:
                profile = contacts[0].get("profile", {})
                contact_name = profile.get("name", "WhatsApp User")

            lead = await create_lead({
                "name": contact_name,
                "phone": phone,
                "source": "whatsapp",
                "message": message,
            })
            logger.info(f"Created new lead from WhatsApp: {lead.id}")

            # Trigger lead_created event through brain
            if brain:
                event = lead_created_event(lead.id, "whatsapp", {"phone": phone})
                await brain.handle_event(event)

        # Generate AI response
        response = await comms_agent.generate_response(
            lead=lead,
            message=message,
            channel="whatsapp"
        )

        if response.get("reply"):
            # Send response
            await comms_agent.send_whatsapp(phone, response["reply"])
            logger.info(f"Sent WhatsApp response to {phone}")

            # Check for escalation
            if response.get("escalate"):
                from services.owner_notify import OwnerNotifier
                notifier = OwnerNotifier()
                await notifier.send_whatsapp(
                    f"⚠️ *Escalation from WhatsApp*\n\n"
                    f"Lead: {lead.name}\n"
                    f"Phone: {phone}\n"
                    f"Message: {message}\n"
                    f"Reason: {response.get('escalate_reason', 'AI flagged for review')}"
                )

        # Create message_received event for tracking
        if brain:
            event = message_received_event(
                lead_id=lead.id,
                channel="whatsapp",
                content=message,
                from_address=phone
            )
            await brain.handle_event(event)

    except Exception as e:
        logger.error(f"WhatsApp processing error: {e}")


# =============================================================================
# EMAIL WEBHOOKS
# =============================================================================

@router.post("/email")
async def email_webhook(
    payload: EmailWebhookPayload,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle inbound emails from email forwarding/polling service.

    This endpoint receives emails that are:
    - Forwarded from models@jasperfinance.org
    - Polled from IMAP inbox
    - Sent by email tracking service

    Flow:
    1. Verify webhook secret
    2. Find or create lead by email
    3. Route through AgenticBrain
    4. Send AI response
    """
    # Verify webhook secret
    secret = request.headers.get("X-Webhook-Secret", "")
    if secret != EMAIL_WEBHOOK_SECRET:
        logger.warning("Email webhook secret mismatch")
        raise HTTPException(status_code=403, detail="Invalid secret")

    # Process in background
    background_tasks.add_task(
        process_email_message,
        from_email=payload.from_email,
        from_name=payload.from_name,
        subject=payload.subject,
        body=payload.body_text,
        message_id=payload.message_id
    )

    return {"status": "queued", "message_id": payload.message_id}


async def process_email_message(
    from_email: str,
    from_name: Optional[str],
    subject: str,
    body: str,
    message_id: str
):
    """
    Process an inbound email through the AgenticBrain.
    """
    logger.info(f"Processing email from {from_email}: {subject}")

    try:
        from db.leads import get_lead_by_email, create_lead
        from app.main import app

        brain = getattr(app.state, 'agentic_brain', None)

        # Find or create lead
        lead = await get_lead_by_email(from_email)

        if not lead:
            lead = await create_lead({
                "name": from_name or from_email.split("@")[0],
                "email": from_email,
                "source": "email",
                "message": f"Subject: {subject}\n\n{body[:500]}",
            })
            logger.info(f"Created new lead from email: {lead.id}")

            if brain:
                event = lead_created_event(lead.id, "email", {"email": from_email})
                await brain.handle_event(event)

        # Generate AI response
        response = await comms_agent.generate_response(
            lead=lead,
            message=f"Subject: {subject}\n\n{body}",
            channel="email"
        )

        if response.get("reply"):
            # Generate subject for reply
            reply_subject = f"Re: {subject}" if not subject.startswith("Re:") else subject

            await comms_agent.send_email(
                to_email=from_email,
                subject=reply_subject,
                body=response["reply"]
            )
            logger.info(f"Sent email response to {from_email}")

        # Track event
        if brain:
            event = message_received_event(
                lead_id=lead.id,
                channel="email",
                content=body,
                from_address=from_email
            )
            await brain.handle_event(event)

    except Exception as e:
        logger.error(f"Email processing error: {e}")


# =============================================================================
# MANUAL MESSAGE INPUT
# =============================================================================

@router.post("/message")
async def manual_message(
    payload: ManualMessageRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Manually input a message for AI processing.

    Useful for:
    - Testing the AI responses
    - Entering messages received through other channels
    - Manual lead follow-up

    Example:
        POST /api/v1/webhooks/message
        {
            "phone": "+27651234567",
            "name": "John Doe",
            "company": "ABC Corp",
            "message": "I'm interested in your DFI modeling services",
            "channel": "whatsapp",
            "auto_respond": true
        }
    """
    try:
        from db.leads import get_lead_by_phone, get_lead_by_email, get_lead, create_lead
        from app.main import app

        brain = getattr(app.state, 'agentic_brain', None)

        # Find existing lead
        lead = None
        if payload.lead_id:
            lead = await get_lead(payload.lead_id)
        elif payload.phone:
            lead = await get_lead_by_phone(payload.phone)
        elif payload.email:
            lead = await get_lead_by_email(payload.email)

        # Create if not found
        if not lead:
            lead = await create_lead({
                "name": payload.name or "Manual Entry",
                "phone": payload.phone,
                "email": payload.email,
                "company": payload.company,
                "source": f"manual_{payload.channel}",
                "message": payload.message,
            })
            logger.info(f"Created lead from manual input: {lead.id}")

        # Generate response
        response = await comms_agent.generate_response(
            lead=lead,
            message=payload.message,
            channel=payload.channel
        )

        result = {
            "lead_id": lead.id,
            "intent": response.get("intent"),
            "ai_response": response.get("reply"),
            "escalate": response.get("escalate", False),
            "sent": False
        }

        # Auto-respond if enabled
        if payload.auto_respond and response.get("reply"):
            if payload.channel == "whatsapp" and payload.phone:
                send_result = await comms_agent.send_whatsapp(payload.phone, response["reply"])
                result["sent"] = send_result.get("success", False)
            elif payload.channel == "email" and payload.email:
                send_result = await comms_agent.send_email(
                    to_email=payload.email,
                    subject="Re: Your inquiry to JASPER",
                    body=response["reply"]
                )
                result["sent"] = send_result.get("success", False)

        # Track event in background
        if brain:
            background_tasks.add_task(
                brain.handle_event,
                message_received_event(
                    lead_id=lead.id,
                    channel=payload.channel,
                    content=payload.message,
                    from_address=payload.phone or payload.email or "manual"
                )
            )

        return result

    except Exception as e:
        logger.error(f"Manual message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# LEAD COLLECTION FORM
# =============================================================================

@router.post("/lead")
async def collect_lead(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Lead collection endpoint for website forms.

    Accepts form data or JSON with lead details.
    Routes through AgenticBrain for qualification and outreach.

    Expected fields:
    - name (required)
    - email (required)
    - phone (optional)
    - company (optional)
    - sector (optional)
    - funding_stage (optional)
    - funding_amount (optional)
    - message (optional)
    - source (optional, defaults to 'website')
    """
    try:
        # Accept both JSON and form data
        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type:
            data = await request.json()
        else:
            form = await request.form()
            data = dict(form)

        # Validate required fields
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="Name is required")
        if not data.get("email"):
            raise HTTPException(status_code=400, detail="Email is required")

        from db.leads import create_lead
        from app.main import app

        brain = getattr(app.state, 'agentic_brain', None)

        # Create lead
        lead = await create_lead({
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "company": data.get("company"),
            "sector": data.get("sector"),
            "funding_stage": data.get("funding_stage"),
            "deal_size": float(data.get("funding_amount", 0) or 0),
            "message": data.get("message"),
            "source": data.get("source", "website"),
        })

        logger.info(f"Collected new lead: {lead.id} - {lead.name}")

        # Process through AgenticBrain in background
        if brain:
            background_tasks.add_task(
                brain.handle_event,
                lead_created_event(
                    lead_id=lead.id,
                    source=data.get("source", "website"),
                    data=data
                )
            )

        return {
            "success": True,
            "lead_id": lead.id,
            "message": "Thank you for your inquiry. We'll be in touch shortly."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lead collection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CONTACT FORM WEBHOOK (from jasper-api)
# =============================================================================

class ContactFormPayload(BaseModel):
    """Contact form submission from jasper-api"""
    name: str
    email: str
    company: str
    phone: Optional[str] = None
    sector: Optional[str] = None
    funding_stage: Optional[str] = None
    funding_amount: Optional[str] = None
    message: Optional[str] = None
    source: str = "website_contact_form"
    reference: Optional[str] = None


@router.post("/contact-form")
async def contact_form_webhook(
    payload: ContactFormPayload,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Webhook for contact form submissions from jasper-api.

    This endpoint:
    1. Creates a lead in the CRM database
    2. Triggers AI qualification via AgenticBrain
    3. Schedules initial outreach via CommsAgent

    Called by: jasper-api/api/contact.js
    """
    # Optional: Verify webhook secret
    webhook_secret = os.getenv("WEBHOOK_SECRET", "")
    provided_secret = request.headers.get("X-Webhook-Secret", "")

    if webhook_secret and provided_secret != webhook_secret:
        logger.warning("Contact form webhook secret mismatch")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        from db.leads import create_lead, get_lead_by_email
        from app.main import app

        brain = getattr(app.state, 'agentic_brain', None)

        # Check for existing lead
        existing_lead = await get_lead_by_email(payload.email.lower())
        if existing_lead:
            logger.info(f"Contact form: Existing lead found for {payload.email}")
            return {
                "success": True,
                "lead_id": existing_lead.id,
                "message": "Lead already exists",
                "is_existing": True
            }

        # Map sector values (contact form uses kebab-case, CRM uses snake_case)
        sector_map = {
            "renewable-energy": "renewable_energy",
            "data-centres": "data_centres",
            "agri-industrial": "agri_industrial",
            "climate-finance": "climate_finance",
            "technology": "technology",
            "manufacturing": "manufacturing",
            "other": "other"
        }

        stage_map = {
            "seed": "seed",
            "series-a": "series_a",
            "series-b": "series_b",
            "growth": "growth",
            "expansion": "expansion",
            "other": "other"
        }

        # Create lead - handle None values for sector/funding_stage
        lead = await create_lead({
            "name": payload.name,
            "email": payload.email.lower(),
            "phone": payload.phone,
            "company": payload.company,
            "sector": sector_map.get(payload.sector, "other") if payload.sector else "other",
            "funding_stage": stage_map.get(payload.funding_stage, "other") if payload.funding_stage else "other",
            "funding_amount": payload.funding_amount,
            "message": payload.message,
            "source": payload.source or "website_contact_form",
            "tags": ["contact_form", payload.reference] if payload.reference else ["contact_form"],
        })

        logger.info(f"Contact form: Created lead {lead.id} for {payload.email}")

        # Trigger AgenticBrain for AI qualification and outreach
        if brain:
            background_tasks.add_task(
                brain.handle_event,
                lead_created_event(
                    lead_id=lead.id,
                    source="website_contact_form",
                    data={
                        "name": payload.name,
                        "email": payload.email,
                        "company": payload.company,
                        "sector": payload.sector,
                        "funding_stage": payload.funding_stage,
                        "message": payload.message,
                        "reference": payload.reference,
                    }
                )
            )
            logger.info(f"Contact form: Queued AgenticBrain processing for {lead.id}")

        # Queue initial outreach email via CommsAgent
        async def send_initial_outreach():
            try:
                result = await comms_agent.initial_outreach(
                    lead={
                        "id": lead.id,
                        "name": payload.name,
                        "email": payload.email,
                        "company": payload.company,
                        "sector": payload.sector,
                        "funding_stage": payload.funding_stage,
                        "message": payload.message,
                        "source": "website_contact_form",
                    },
                    channel="email"
                )
                if result.get("body"):
                    await comms_agent.send_email(
                        to_email=payload.email,
                        subject=result.get("subject", "Thank you for contacting JASPER"),
                        body=result["body"]
                    )
                    logger.info(f"Contact form: Sent AI outreach to {payload.email}")
            except Exception as e:
                logger.error(f"Contact form outreach error: {e}")

        background_tasks.add_task(send_initial_outreach)

        return {
            "success": True,
            "lead_id": lead.id,
            "message": "Lead created successfully",
            "is_existing": False
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Contact form webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CONVERSATION HISTORY
# =============================================================================

@router.get("/conversation/{lead_id}")
async def get_conversation(lead_id: str):
    """
    Get conversation history for a lead.

    Returns all messages exchanged with the lead across all channels.
    """
    try:
        from db.messages import get_messages_for_lead

        messages = await get_messages_for_lead(lead_id)

        return {
            "lead_id": lead_id,
            "messages": messages,
            "count": len(messages)
        }

    except Exception as e:
        logger.error(f"Conversation fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
