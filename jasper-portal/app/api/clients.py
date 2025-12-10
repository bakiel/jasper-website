"""
JASPER Client Portal - Clients API
Company and contact management with real database
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.core.config import get_settings
from app.models.base import get_db
from app.models.company import Company, CompanyStatus, Industry
from app.models.contact import Contact
from app.models.interaction import Interaction
from app.services.crm import CRMService
from app.services.email import email_service

router = APIRouter()
settings = get_settings()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    job_title: Optional[str] = None
    is_primary: bool = False
    is_decision_maker: bool = False


class ContactResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    job_title: Optional[str]
    is_primary: bool
    is_decision_maker: bool
    portal_access: bool
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class CompanyCreate(BaseModel):
    name: str
    trading_name: Optional[str] = None
    industry: Industry = Industry.OTHER
    country: str = "South Africa"
    city: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    lead_source: Optional[str] = None
    referred_by: Optional[str] = None
    dfi_targets: Optional[List[str]] = []
    project_value_min: Optional[int] = None
    project_value_max: Optional[int] = None
    notes: Optional[str] = None
    # Primary contact (created with company)
    primary_contact: Optional[ContactCreate] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    trading_name: Optional[str]
    industry: Industry
    status: CompanyStatus
    country: str
    city: Optional[str]
    website: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    lead_source: Optional[str]
    dfi_targets: Optional[List[str]]
    project_value_min: Optional[int]
    project_value_max: Optional[int]
    created_at: datetime
    updated_at: datetime
    contacts: List[ContactResponse] = []

    class Config:
        from_attributes = True


class CompanyListResponse(BaseModel):
    companies: List[CompanyResponse]
    total: int
    page: int
    page_size: int


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    trading_name: Optional[str] = None
    industry: Optional[Industry] = None
    status: Optional[CompanyStatus] = None
    country: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dfi_targets: Optional[List[str]] = None
    notes: Optional[str] = None


class InteractionResponse(BaseModel):
    id: int
    type: str
    icon: str
    subject: str
    content: Optional[str]
    created_at: datetime
    created_by: str


# ============================================
# DEPENDENCIES
# ============================================

def get_crm(db: Session = Depends(get_db)) -> CRMService:
    return CRMService(db)


# ============================================
# COMPANY ENDPOINTS
# ============================================

@router.post("/", response_model=CompanyResponse, status_code=201)
async def create_company(
    data: CompanyCreate,
    crm: CRMService = Depends(get_crm)
):
    """
    Create a new company/client.
    Optionally include primary contact in same request.
    """
    # Create company
    company = crm.create_company(
        name=data.name,
        trading_name=data.trading_name,
        industry=data.industry,
        country=data.country,
        city=data.city,
        website=data.website,
        phone=data.phone,
        email=data.email,
        lead_source=data.lead_source,
        referred_by=data.referred_by,
        dfi_targets=data.dfi_targets,
        project_value_min=data.project_value_min,
        project_value_max=data.project_value_max,
        notes=data.notes
    )

    # Create primary contact if provided
    if data.primary_contact:
        crm.create_contact(
            company_id=company.id,
            first_name=data.primary_contact.first_name,
            last_name=data.primary_contact.last_name,
            email=data.primary_contact.email,
            phone=data.primary_contact.phone,
            job_title=data.primary_contact.job_title,
            is_primary=True,
            is_decision_maker=data.primary_contact.is_decision_maker
        )

    # Refresh to get contacts
    company = crm.get_company(company.id)
    return company


@router.get("/", response_model=CompanyListResponse)
async def list_companies(
    status: Optional[CompanyStatus] = None,
    industry: Optional[Industry] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    crm: CRMService = Depends(get_crm)
):
    """
    List companies with optional filters.
    """
    offset = (page - 1) * page_size
    companies = crm.get_companies(
        status=status,
        industry=industry,
        search=search,
        limit=page_size,
        offset=offset
    )

    return CompanyListResponse(
        companies=companies,
        total=len(companies),
        page=page,
        page_size=page_size
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    crm: CRMService = Depends(get_crm)
):
    """Get company details with contacts"""
    company = crm.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    data: CompanyUpdate,
    crm: CRMService = Depends(get_crm)
):
    """Update company details"""
    updates = data.model_dump(exclude_unset=True)
    company = crm.update_company(company_id, **updates)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}/status")
async def update_company_status(
    company_id: int,
    status: CompanyStatus,
    crm: CRMService = Depends(get_crm)
):
    """Update company pipeline status"""
    company = crm.update_company_status(
        company_id=company_id,
        new_status=status,
        updated_by="admin"  # Would come from auth
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": f"Status updated to {status.value}", "company_id": company_id}


# ============================================
# CONTACT ENDPOINTS
# ============================================

@router.post("/{company_id}/contacts", response_model=ContactResponse, status_code=201)
async def add_contact(
    company_id: int,
    data: ContactCreate,
    crm: CRMService = Depends(get_crm)
):
    """Add a contact to a company"""
    company = crm.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    contact = crm.create_contact(
        company_id=company_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        job_title=data.job_title,
        is_primary=data.is_primary,
        is_decision_maker=data.is_decision_maker
    )
    return contact


@router.get("/{company_id}/contacts", response_model=List[ContactResponse])
async def list_contacts(
    company_id: int,
    crm: CRMService = Depends(get_crm)
):
    """List all contacts for a company"""
    company = crm.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.contacts


@router.get("/{company_id}/timeline", response_model=List[InteractionResponse])
async def get_company_timeline(
    company_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Get activity timeline for a company"""
    from sqlalchemy import select

    interactions = db.execute(
        select(Interaction)
        .where(Interaction.company_id == company_id)
        .where(Interaction.internal_only == False)
        .order_by(Interaction.created_at.desc())
        .limit(limit)
    ).scalars().all()

    return [
        InteractionResponse(
            id=i.id,
            type=i.interaction_type.value,
            icon=i.display_icon,
            subject=i.subject,
            content=i.content,
            created_at=i.created_at,
            created_by=i.created_by
        )
        for i in interactions
    ]


# ============================================
# PORTAL INVITE ENDPOINTS
# ============================================

class SendInviteRequest(BaseModel):
    contact_id: int


class SendInviteResponse(BaseModel):
    success: bool
    message: str


@router.post("/{company_id}/send-invite", response_model=SendInviteResponse)
async def send_portal_invite(
    company_id: int,
    data: SendInviteRequest,
    background_tasks: BackgroundTasks,
    crm: CRMService = Depends(get_crm)
):
    """
    Send a magic link invitation to a contact for portal access.
    Enables portal_access on the contact and sends login email.
    """
    # Verify company exists
    company = crm.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Find the contact
    contact = None
    for c in company.contacts:
        if c.id == data.contact_id:
            contact = c
            break

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Enable portal access
    crm.enable_portal_access(contact.id)

    # Create magic link
    magic_link = crm.create_magic_link(
        email=contact.email,
        ip_address="admin-invite",
        user_agent="Admin Portal Invite"
    )

    if not magic_link:
        raise HTTPException(status_code=500, detail="Failed to create magic link")

    # Send invite email in background
    background_tasks.add_task(
        email_service.send_magic_link,
        email=contact.email,
        first_name=contact.first_name,
        magic_link=magic_link.login_url
    )

    return SendInviteResponse(
        success=True,
        message=f"Portal invitation sent to {contact.email}"
    )
