"""
JASPER CRM - Lead Database Operations

Standalone functions for lead CRUD operations.
Used by vision routes and other services that need direct lead access.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .database import SessionLocal
from .tables import LeadTable
from models.lead import (
    Lead,
    LeadStatus,
    LeadSource,
    Sector,
    FundingStage,
    LeadPriority,
)

logger = logging.getLogger(__name__)


async def create_lead(lead_data: Dict[str, Any]) -> LeadTable:
    """
    Create a new lead from a dictionary.

    Used by vision routes for business card imports and other
    services that need to create leads outside of FastAPI routes.

    Args:
        lead_data: Dictionary with lead fields:
            - name (required)
            - email (required)
            - company (optional, defaults to "Unknown")
            - phone (optional)
            - job_title (optional, stored in notes)
            - source (optional, defaults to "other")
            - message (optional)
            - tags (optional, list of strings)
            - sector (optional, defaults to "other")
            - funding_stage (optional, defaults to "other")

    Returns:
        LeadTable: The created lead database object

    Raises:
        ValueError: If required fields are missing or duplicate email
    """
    db = SessionLocal()

    try:
        # Validate required fields
        email = lead_data.get("email")
        name = lead_data.get("name")

        if not email:
            raise ValueError("Email is required")
        if not name:
            raise ValueError("Name is required")

        email = email.lower().strip()

        # Check for duplicate email
        existing = db.query(LeadTable).filter(LeadTable.email == email).first()
        if existing:
            logger.info(f"Lead already exists for email {email}, returning existing")
            return existing

        # Parse source
        source_str = lead_data.get("source", "other").lower()
        try:
            source = LeadSource(source_str)
        except ValueError:
            source = LeadSource.OTHER

        # Parse sector
        sector_str = lead_data.get("sector", "other").lower()
        try:
            sector = Sector(sector_str)
        except ValueError:
            sector = Sector.OTHER

        # Parse funding stage
        funding_str = lead_data.get("funding_stage", "other").lower()
        try:
            funding_stage = FundingStage(funding_str)
        except ValueError:
            funding_stage = FundingStage.OTHER

        # Build notes with job title if provided
        notes_parts = []
        if lead_data.get("job_title"):
            notes_parts.append(f"Job Title: {lead_data['job_title']}")
        if lead_data.get("message"):
            notes_parts.append(lead_data["message"])
        notes = "\n".join(notes_parts) if notes_parts else None

        # Create Lead pydantic model first for ID generation
        lead = Lead(
            name=name.strip(),
            email=email,
            company=lead_data.get("company", "Unknown").strip(),
            phone=lead_data.get("phone"),
            sector=sector,
            funding_stage=funding_stage,
            source=source,
            status=LeadStatus.NEW,
            priority=LeadPriority.MEDIUM,
            message=lead_data.get("message"),
            notes=notes,
            tags=lead_data.get("tags", []),
        )

        # Create database record
        db_lead = LeadTable(**lead.model_dump())
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)

        logger.info(f"Created lead: {db_lead.id} ({email})")
        return db_lead

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create lead: {e}")
        raise
    finally:
        db.close()


async def get_lead_by_email(email: str) -> Optional[LeadTable]:
    """
    Get a lead by email address.

    Args:
        email: Email address to search

    Returns:
        LeadTable or None if not found
    """
    db = SessionLocal()
    try:
        return db.query(LeadTable).filter(
            LeadTable.email == email.lower().strip()
        ).first()
    finally:
        db.close()


async def get_lead_by_id(lead_id: str) -> Optional[LeadTable]:
    """
    Get a lead by ID.

    Args:
        lead_id: Lead ID to search

    Returns:
        LeadTable or None if not found
    """
    db = SessionLocal()
    try:
        return db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    finally:
        db.close()


async def update_lead(lead_id: str, updates: Dict[str, Any]) -> Optional[LeadTable]:
    """
    Update a lead by ID.

    Args:
        lead_id: Lead ID to update
        updates: Dictionary of field updates

    Returns:
        Updated LeadTable or None if not found
    """
    db = SessionLocal()
    try:
        db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
        if not db_lead:
            return None

        for field, value in updates.items():
            if hasattr(db_lead, field):
                setattr(db_lead, field, value)

        db_lead.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_lead)

        return db_lead
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update lead {lead_id}: {e}")
        raise
    finally:
        db.close()
