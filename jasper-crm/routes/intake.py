"""
JASPER CRM - Public Intake Form Route
Replaces Tally/Typeform - Self-hosted lead capture
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, timedelta
import re

from db import get_db, LeadTable, NotificationTable
from models import (
    Lead,
    LeadStatus,
    LeadSource,
    Sector,
    FundingStage,
    Notification,
    NotificationType,
    NotificationPriority,
)
from services.ai_router import ai_router

router = APIRouter(prefix="/intake", tags=["Public Intake"])


# --- Rate Limiting ---
rate_limit_store = {}
RATE_LIMIT = 3
RATE_WINDOW = timedelta(hours=1)


def check_rate_limit(ip: str) -> bool:
    """Check if IP is rate limited"""
    now = datetime.utcnow()
    if ip in rate_limit_store:
        record = rate_limit_store[ip]
        if now - record["timestamp"] > RATE_WINDOW:
            rate_limit_store[ip] = {"count": 1, "timestamp": now}
            return True
        if record["count"] >= RATE_LIMIT:
            return False
        record["count"] += 1
        return True
    rate_limit_store[ip] = {"count": 1, "timestamp": now}
    return True


# --- Form Configuration ---
FORM_CONFIG = {
    "sectors": [
        {"value": "renewable_energy", "label": "Renewable Energy"},
        {"value": "data_centres", "label": "Data Centres"},
        {"value": "agri_industrial", "label": "Agri-Industrial"},
        {"value": "climate_finance", "label": "Climate Finance"},
        {"value": "technology", "label": "Technology"},
        {"value": "manufacturing", "label": "Manufacturing"},
        {"value": "healthcare", "label": "Healthcare"},
        {"value": "infrastructure", "label": "Infrastructure"},
        {"value": "other", "label": "Other"},
    ],
    "funding_stages": [
        {"value": "seed", "label": "Seed / Pre-Revenue"},
        {"value": "series_a", "label": "Series A"},
        {"value": "series_b", "label": "Series B+"},
        {"value": "growth", "label": "Growth Stage"},
        {"value": "expansion", "label": "Expansion"},
        {"value": "established", "label": "Established Business"},
        {"value": "other", "label": "Other"},
    ],
    "funding_ranges": [
        {"value": "under_1m", "label": "Under R1 million"},
        {"value": "1m_10m", "label": "R1 - R10 million"},
        {"value": "10m_50m", "label": "R10 - R50 million"},
        {"value": "50m_100m", "label": "R50 - R100 million"},
        {"value": "100m_500m", "label": "R100 - R500 million"},
        {"value": "over_500m", "label": "Over R500 million"},
    ],
}


# --- Request Model ---
class IntakeFormSubmission(BaseModel):
    """Public intake form submission model"""
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    company: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    sector: str
    funding_stage: str
    funding_amount: Optional[str] = None
    message: str = Field(..., min_length=50, max_length=5000)
    referral_source: Optional[str] = None

    @validator("phone")
    def validate_phone(cls, v):
        if v:
            if not re.match(r"^[\d\s\+\-\(\)]+$", v):
                raise ValueError("Invalid phone number format")
        return v

    @validator("sector")
    def validate_sector(cls, v):
        valid = [s["value"] for s in FORM_CONFIG["sectors"]]
        if v not in valid:
            raise ValueError(f"Invalid sector. Must be one of: {', '.join(valid)}")
        return v

    @validator("funding_stage")
    def validate_funding_stage(cls, v):
        valid = [s["value"] for s in FORM_CONFIG["funding_stages"]]
        if v not in valid:
            raise ValueError(f"Invalid funding stage. Must be one of: {', '.join(valid)}")
        return v


@router.get("/config")
async def get_form_config():
    """Get intake form configuration (sectors, stages, etc.)"""
    return {
        "success": True,
        "config": FORM_CONFIG,
    }


@router.post("")
async def submit_intake_form(
    submission: IntakeFormSubmission,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Submit intake form - creates lead and notification

    This is the public endpoint that replaces Tally/Typeform
    """
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    forwarded_ip = request.headers.get("x-forwarded-for", client_ip)
    if not check_rate_limit(forwarded_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many submissions. Please try again later."
        )

    # Check for duplicate
    existing = db.query(LeadTable).filter(
        LeadTable.email == submission.email.lower()
    ).first()
    if existing:
        # Return success but don't create duplicate
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Thank you for your submission. Our team will review your enquiry and respond within 24-48 hours.",
                "reference": existing.id,
                "note": "We already have your details on file.",
            }
        )

    # Map string values to enums
    try:
        sector_enum = Sector(submission.sector)
        funding_stage_enum = FundingStage(submission.funding_stage)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid sector or funding stage")

    # Create lead
    lead = Lead(
        name=submission.name,
        email=submission.email.lower(),
        company=submission.company,
        phone=submission.phone,
        sector=sector_enum,
        funding_stage=funding_stage_enum,
        funding_amount=submission.funding_amount,
        message=submission.message,
        source=LeadSource.WEBSITE,
        referral_source=submission.referral_source,
        status=LeadStatus.NEW,
        tags=["intake_form"],
    )

    db_lead = LeadTable(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    # Create notification
    sector_label = next(
        (s["label"] for s in FORM_CONFIG["sectors"] if s["value"] == submission.sector),
        submission.sector
    )
    notification = Notification(
        type=NotificationType.LEAD,
        title="New Intake Form Submission",
        message=f"{submission.company} ({submission.name}) - {sector_label}",
        link="/clients",
        priority=NotificationPriority.HIGH,
        user_id="admin",
    )
    db_notification = NotificationTable(**notification.model_dump())
    db.add(db_notification)
    db.commit()

    # Queue AI qualification (background)
    async def qualify_background():
        try:
            result = await ai_router.qualify_lead(lead.model_dump())
            if result.get("success"):
                qual = result["qualification"]
                db_lead.qualification_score = qual.get("score", 5)
                db_lead.ai_recommended_package = qual.get("package")
                db_lead.ai_summary = qual.get("summary")
                db_lead.target_dfis = qual.get("target_dfis", [])
                db_lead.estimated_value = qual.get("estimated_value")
                db.commit()
        except Exception as e:
            print(f"AI qualification error: {e}")

    background_tasks.add_task(qualify_background)

    return {
        "success": True,
        "message": "Thank you for your submission. Our team will review your enquiry and respond within 24-48 hours.",
        "reference": lead.id,
    }
