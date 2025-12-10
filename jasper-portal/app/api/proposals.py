"""
JASPER Client Portal - Proposals API
Proposal/quote generation with PDF templates and package pricing
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime, timedelta, date
from pydantic import BaseModel
from pathlib import Path

from app.core.config import get_settings
from app.models.base import get_db
from app.models.project import Project, Package, PACKAGE_PRICING
from app.models.company import Company
from app.services.documents import document_service
from app.services.email import email_service

router = APIRouter()
settings = get_settings()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class ProposalCreate(BaseModel):
    """Request to create a proposal"""
    company_id: int
    project_name: str
    project_description: str
    package: Package
    custom_price: Optional[int] = None  # Override package price (in cents)
    custom_timeline_weeks: Optional[int] = None
    custom_deliverables: Optional[List[str]] = None
    notes: Optional[str] = None


class ProposalResponse(BaseModel):
    """Proposal details"""
    id: int
    proposal_number: str
    company_id: int
    company_name: str
    project_name: str
    project_description: str
    package: Package
    price: int  # In cents
    timeline_weeks: int
    deliverables: List[str]
    valid_until: date
    status: str
    pdf_path: Optional[str]
    created_at: datetime


class ProposalListResponse(BaseModel):
    proposals: List[ProposalResponse]
    total: int
    page: int
    page_size: int


class PackageInfoResponse(BaseModel):
    """Package pricing and details"""
    package: Package
    name: str
    price_usd: int
    price_display: str
    timeline_weeks: int
    revision_rounds: int
    deliverables: List[str]


# ============================================
# PACKAGE DELIVERABLES TEMPLATES
# ============================================

PACKAGE_DELIVERABLES = {
    Package.GROWTH: [
        "12-sheet integrated financial model",
        "Business plan executive summary (15-20 pages)",
        "Investment highlights presentation",
        "Model documentation",
        "2 revision rounds included",
    ],
    Package.INSTITUTIONAL: [
        "28-sheet integrated financial model",
        "Full business plan (60+ pages)",
        "Executive summary",
        "Investment memorandum",
        "DFI-formatted package",
        "Model documentation",
        "3 revision rounds included",
    ],
    Package.INFRASTRUCTURE: [
        "40+ sheet integrated financial model",
        "Comprehensive business plan (80+ pages)",
        "Executive summary",
        "Investment memorandum",
        "Multi-DFI package formatting",
        "Due diligence data room preparation",
        "Sensitivity analysis report",
        "Model documentation",
        "4 revision rounds included",
    ],
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_proposal_number(db: Session, year: int = None) -> str:
    """Generate unique proposal number: PROP-YYYY-XXX"""
    if year is None:
        year = datetime.now().year

    # For now, count existing proposals by checking project names
    # In production, would have a separate proposals table
    count = db.execute(
        select(func.count(Project.id))
        .where(Project.created_at >= datetime(year, 1, 1))
    ).scalar() or 0

    return f"PROP-{year}-{count + 1:03d}"


async def send_proposal_email(
    company: Company,
    proposal_number: str,
    project_name: str,
    package_name: str,
    price: float,
    timeline_weeks: int,
    pdf_path: str
):
    """Send proposal email to client"""
    contact = company.primary_contact

    if not contact or not contact.email:
        print(f"[EMAIL] No contact email for proposal {proposal_number}")
        return

    proposal_url = f"{settings.FRONTEND_URL}/proposals/{proposal_number}"

    await email_service.send_proposal(
        email=contact.email,
        first_name=contact.first_name,
        project_name=project_name,
        package_name=package_name,
        price=price,
        timeline_weeks=timeline_weeks,
        proposal_url=proposal_url
    )
    print(f"[EMAIL] Proposal {proposal_number} sent to {contact.email}")


# ============================================
# PACKAGE INFO ENDPOINTS
# ============================================

@router.get("/packages", response_model=List[PackageInfoResponse])
async def list_packages():
    """Get all available packages with pricing"""
    packages = []
    for package in Package:
        pricing = PACKAGE_PRICING[package]
        packages.append(PackageInfoResponse(
            package=package,
            name=package.value.title(),
            price_usd=pricing["price"],
            price_display=f"${pricing['price'] / 100:,.0f}",
            timeline_weeks=pricing["timeline_weeks"],
            revision_rounds=pricing["revisions"],
            deliverables=PACKAGE_DELIVERABLES.get(package, [])
        ))
    return packages


@router.get("/packages/{package}", response_model=PackageInfoResponse)
async def get_package_info(package: Package):
    """Get specific package details"""
    pricing = PACKAGE_PRICING.get(package)
    if not pricing:
        raise HTTPException(status_code=404, detail="Package not found")

    return PackageInfoResponse(
        package=package,
        name=package.value.title(),
        price_usd=pricing["price"],
        price_display=f"${pricing['price'] / 100:,.0f}",
        timeline_weeks=pricing["timeline_weeks"],
        revision_rounds=pricing["revisions"],
        deliverables=PACKAGE_DELIVERABLES.get(package, [])
    )


# ============================================
# PROPOSAL ENDPOINTS
# ============================================

@router.post("/", response_model=ProposalResponse, status_code=201)
async def create_proposal(
    data: ProposalCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new proposal for a company.
    Uses package pricing and deliverables, with optional customisation.
    """
    # Get company
    company = db.execute(
        select(Company).where(Company.id == data.company_id)
    ).scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get package pricing
    pricing = PACKAGE_PRICING.get(data.package)
    if not pricing:
        raise HTTPException(status_code=400, detail="Invalid package")

    # Use custom values or defaults
    price = data.custom_price if data.custom_price else pricing["price"]
    timeline = data.custom_timeline_weeks if data.custom_timeline_weeks else pricing["timeline_weeks"]
    deliverables = data.custom_deliverables if data.custom_deliverables else PACKAGE_DELIVERABLES.get(data.package, [])

    # Generate proposal number
    proposal_number = generate_proposal_number(db)

    # For now, create a project in "proposal" stage
    # In production, might have separate Proposal model
    project = Project(
        company_id=data.company_id,
        contact_id=company.primary_contact.id if company.primary_contact else None,
        name=data.project_name,
        description=data.project_description,
        package=data.package,
        value=price,
        currency="USD",
        stage="proposal_sent",
        notes=data.notes
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # Get contact for PDF
    contact = company.primary_contact

    # Generate PDF
    pdf_path = await document_service.generate_proposal(
        client_name=f"{contact.first_name} {contact.last_name}" if contact else "",
        client_company=company.name,
        project_name=data.project_name,
        project_description=data.project_description,
        package_name=f"{data.package.value.title()} Package",
        price=price / 100,  # Convert cents to dollars
        timeline_weeks=timeline,
        deliverables=deliverables,
        output_filename=f"Proposal_{proposal_number}.pdf"
    )

    # Queue email
    package_name = f"{data.package.value.title()} Package"
    background_tasks.add_task(
        send_proposal_email,
        company,
        proposal_number,
        data.project_name,
        package_name,
        price / 100,  # Convert cents to dollars
        timeline,
        pdf_path
    )

    return ProposalResponse(
        id=project.id,
        proposal_number=proposal_number,
        company_id=company.id,
        company_name=company.name,
        project_name=data.project_name,
        project_description=data.project_description,
        package=data.package,
        price=price,
        timeline_weeks=timeline,
        deliverables=deliverables,
        valid_until=date.today() + timedelta(days=14),
        status="sent",
        pdf_path=pdf_path,
        created_at=project.created_at
    )


@router.get("/{proposal_id}/pdf")
async def get_proposal_pdf(
    proposal_id: int,
    regenerate: bool = False,
    db: Session = Depends(get_db)
):
    """Get or regenerate proposal PDF"""
    project = db.execute(
        select(Project).where(Project.id == proposal_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Proposal not found")

    company = project.company
    contact = company.primary_contact

    # Get package details
    pricing = PACKAGE_PRICING.get(project.package, {})
    timeline = pricing.get("timeline_weeks", 4)
    deliverables = PACKAGE_DELIVERABLES.get(project.package, [])

    # Generate PDF
    proposal_number = f"PROP-{project.created_at.year}-{project.id:03d}"
    pdf_path = await document_service.generate_proposal(
        client_name=f"{contact.first_name} {contact.last_name}" if contact else "",
        client_company=company.name,
        project_name=project.name,
        project_description=project.description or "",
        package_name=f"{project.package.value.title()} Package" if project.package else "Custom Package",
        price=project.value / 100 if project.value else 0,
        timeline_weeks=timeline,
        deliverables=deliverables,
        output_filename=f"Proposal_{proposal_number}.pdf"
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Proposal_{proposal_number}.pdf"
    )


@router.post("/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Accept a proposal - moves project to deposit stage.
    Generates deposit invoice automatically.
    """
    project = db.execute(
        select(Project).where(Project.id == proposal_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Update project stage
    project.stage = "deposit_pending"
    db.commit()

    # In production: create deposit invoice here
    # from app.api.invoices import create_invoice
    # background_tasks.add_task(create_deposit_invoice, project.id)

    return {
        "message": "Proposal accepted",
        "project_id": project.id,
        "next_step": "Deposit invoice will be generated"
    }


@router.post("/{proposal_id}/reject")
async def reject_proposal(
    proposal_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Reject a proposal"""
    project = db.execute(
        select(Project).where(Project.id == proposal_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Update project stage
    project.stage = "lost"
    if reason:
        project.notes = f"Rejected: {reason}\n\n{project.notes or ''}"

    db.commit()

    return {
        "message": "Proposal rejected",
        "project_id": project.id
    }


# ============================================
# QUICK QUOTE ENDPOINT
# ============================================

@router.post("/quick-quote")
async def generate_quick_quote(
    company_name: str,
    contact_name: str,
    project_name: str,
    project_description: str,
    package: Package
):
    """
    Generate a quick quote PDF without creating database records.
    Useful for initial discussions before formal proposal.
    """
    pricing = PACKAGE_PRICING.get(package)
    if not pricing:
        raise HTTPException(status_code=400, detail="Invalid package")

    deliverables = PACKAGE_DELIVERABLES.get(package, [])

    # Generate PDF
    quote_number = f"QQ-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    pdf_path = await document_service.generate_proposal(
        client_name=contact_name,
        client_company=company_name,
        project_name=project_name,
        project_description=project_description,
        package_name=f"{package.value.title()} Package",
        price=pricing["price"] / 100,
        timeline_weeks=pricing["timeline_weeks"],
        deliverables=deliverables,
        output_filename=f"Quote_{quote_number}.pdf"
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Quote_{quote_number}.pdf"
    )
