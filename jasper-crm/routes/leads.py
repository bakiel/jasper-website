"""
JASPER CRM - Lead Routes
FastAPI routes for lead management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from db import get_db, LeadTable, NotificationTable
from models import (
    Lead,
    LeadCreate,
    LeadUpdate,
    LeadStatus,
    LeadSource,
    LeadPriority,
    Sector,
    LeadResponse,
    LeadListResponse,
    LeadStats,
    LeadStatsResponse,
    Notification,
    NotificationType,
    NotificationPriority,
)
from services.ai_router import ai_router

router = APIRouter(prefix="/leads", tags=["Leads"])


async def qualify_lead_background(lead_id: str, lead_data: dict, db: Session):
    """Background task to qualify lead with AI"""
    try:
        result = await ai_router.qualify_lead(lead_data)
        if result.get("success"):
            qual = result["qualification"]
            db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
            if db_lead:
                db_lead.qualification_score = qual.get("score", 5)
                db_lead.ai_recommended_package = qual.get("package")
                db_lead.ai_summary = qual.get("summary")
                db_lead.target_dfis = qual.get("target_dfis", [])
                db_lead.estimated_value = qual.get("estimated_value")
                db.commit()
    except Exception as e:
        print(f"AI qualification error: {e}")


@router.get("", response_model=LeadListResponse)
async def list_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    sector: Optional[Sector] = None,
    priority: Optional[LeadPriority] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all leads with optional filtering"""
    query = db.query(LeadTable)

    # Apply filters
    if status:
        query = query.filter(LeadTable.status == status)
    if source:
        query = query.filter(LeadTable.source == source)
    if sector:
        query = query.filter(LeadTable.sector == sector)
    if priority:
        query = query.filter(LeadTable.priority == priority)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (LeadTable.name.ilike(search_term)) |
            (LeadTable.company.ilike(search_term)) |
            (LeadTable.email.ilike(search_term))
        )

    # Get total count
    total = query.count()

    # Pagination
    offset = (page - 1) * limit
    leads = query.order_by(LeadTable.created_at.desc()).offset(offset).limit(limit).all()

    return LeadListResponse(
        leads=[Lead.model_validate(lead) for lead in leads],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit,
    )


@router.get("/stats", response_model=LeadStatsResponse)
async def get_lead_stats(db: Session = Depends(get_db)):
    """Get lead statistics"""
    total = db.query(LeadTable).count()

    # Count by status
    by_status = {}
    for status in LeadStatus:
        count = db.query(LeadTable).filter(LeadTable.status == status).count()
        by_status[status.value] = count

    # Count by source
    by_source = {}
    for source in LeadSource:
        count = db.query(LeadTable).filter(LeadTable.source == source).count()
        by_source[source.value] = count

    # Count by sector
    by_sector = {}
    for sector in Sector:
        count = db.query(LeadTable).filter(LeadTable.sector == sector).count()
        by_sector[sector.value] = count

    # Count by priority
    by_priority = {}
    for priority in LeadPriority:
        count = db.query(LeadTable).filter(LeadTable.priority == priority).count()
        by_priority[priority.value] = count

    # Average qualification score
    avg_score = db.query(func.avg(LeadTable.qualification_score)).scalar() or 0

    # Total estimated value
    total_value = db.query(func.sum(LeadTable.estimated_value)).scalar() or 0

    return LeadStatsResponse(
        stats=LeadStats(
            total=total,
            by_status=by_status,
            by_source=by_source,
            by_sector=by_sector,
            by_priority=by_priority,
            avg_qualification_score=round(avg_score, 1),
            total_estimated_value=total_value,
        )
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, db: Session = Depends(get_db)):
    """Get a specific lead by ID"""
    lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse(lead=Lead.model_validate(lead))


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead_data: LeadCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create a new lead"""
    # Check for duplicate email
    existing = db.query(LeadTable).filter(LeadTable.email == lead_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A lead with this email already exists (ID: {existing.id})"
        )

    # Create lead
    lead = Lead(**lead_data.model_dump())
    lead.email = lead.email.lower()

    db_lead = LeadTable(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    # Create notification
    notification = Notification(
        type=NotificationType.LEAD,
        title="New Lead Received",
        message=f"{lead.company} ({lead.name}) - {lead.sector.value}",
        link="/clients",
        priority=NotificationPriority.HIGH,
        user_id="admin",
    )
    db_notification = NotificationTable(**notification.model_dump())
    db.add(db_notification)
    db.commit()

    # Queue AI qualification in background
    background_tasks.add_task(
        qualify_lead_background,
        lead.id,
        lead.model_dump(),
        db,
    )

    return LeadResponse(lead=Lead.model_validate(db_lead))


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    updates: LeadUpdate,
    db: Session = Depends(get_db),
):
    """Update a lead"""
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lead, field, value)

    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)

    return LeadResponse(lead=Lead.model_validate(db_lead))


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    """Delete a lead"""
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(db_lead)
    db.commit()

    return {"success": True, "message": "Lead deleted"}


@router.post("/{lead_id}/qualify")
async def requalify_lead(
    lead_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Re-run AI qualification on a lead"""
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)

    # Queue AI qualification
    background_tasks.add_task(
        qualify_lead_background,
        lead.id,
        lead.model_dump(),
        db,
    )

    return {"success": True, "message": "Lead qualification queued"}
