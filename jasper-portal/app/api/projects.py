"""
JASPER Client Portal - Projects API
Project management, tracking, and deliverables with real database
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from app.models.base import get_db
from app.models.project import Project, ProjectStage, Package, PACKAGE_PRICING
from app.models.company import Company
from app.models.contact import Contact
from app.models.milestone import Milestone

router = APIRouter()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class ProjectCreate(BaseModel):
    company_id: int
    contact_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    package: Package = Package.GROWTH
    value: Optional[int] = None  # If None, uses package default
    currency: str = "USD"
    project_sector: Optional[str] = None
    project_location: Optional[str] = None
    funding_amount: Optional[int] = None
    target_dfis: Optional[List[str]] = None


class ProjectResponse(BaseModel):
    id: int
    reference: str
    company_id: int
    contact_id: Optional[int]
    name: str
    description: Optional[str]
    stage: ProjectStage
    package: Package
    value: int
    currency: str
    inquiry_date: date
    start_date: Optional[date]
    target_completion: Optional[date]
    actual_completion: Optional[date]
    revision_rounds_used: int
    revision_rounds_total: int
    progress_percent: int
    project_sector: Optional[str]
    project_location: Optional[str]
    funding_amount: Optional[int]
    target_dfis: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MilestoneResponse(BaseModel):
    id: int
    name: str
    order: int
    due_date: Optional[date]
    completed: bool
    completed_date: Optional[date]
    description: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[ProjectStage] = None
    project_sector: Optional[str] = None
    project_location: Optional[str] = None


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_reference(db: Session, year: int = None) -> str:
    """Generate unique project reference: JASP-YYYY-XXX"""
    if year is None:
        year = datetime.now().year

    pattern = f"JASP-{year}-%"
    count = db.execute(
        select(func.count(Project.id))
        .where(Project.reference.like(pattern))
    ).scalar() or 0

    return f"JASP-{year}-{count + 1:03d}"


# ============================================
# PROJECT ENDPOINTS
# ============================================

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new project for a company.
    Associates package pricing and deliverables.
    """
    # Verify company exists
    company = db.execute(
        select(Company).where(Company.id == data.company_id)
    ).scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get package info for defaults
    pkg_info = PACKAGE_PRICING.get(data.package, {})
    value = data.value or pkg_info.get("price", 12000) * 100  # Store in cents
    revision_rounds = pkg_info.get("revision_rounds", 2)

    # Calculate timeline
    timeline_weeks = pkg_info.get("timeline_weeks_max", 6)
    target_completion = date.today() + timedelta(weeks=timeline_weeks)

    # Generate reference
    reference = generate_reference(db)

    project = Project(
        company_id=data.company_id,
        contact_id=data.contact_id,
        name=data.name,
        reference=reference,
        description=data.description,
        stage=ProjectStage.INQUIRY,
        package=data.package,
        value=value,
        currency=data.currency,
        target_completion=target_completion,
        revision_rounds_total=revision_rounds,
        project_sector=data.project_sector,
        project_location=data.project_location,
        funding_amount=data.funding_amount,
        target_dfis=data.target_dfis or []
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    company_id: Optional[int] = None,
    stage: Optional[ProjectStage] = None,
    package: Optional[Package] = None,
    db: Session = Depends(get_db)
):
    """List all projects with pagination and filters"""
    query = select(Project)

    if company_id:
        query = query.where(Project.company_id == company_id)
    if stage:
        query = query.where(Project.stage == stage)
    if package:
        query = query.where(Project.package == package)

    query = query.order_by(Project.created_at.desc())

    # Count total
    count_query = select(func.count(Project.id))
    if company_id:
        count_query = count_query.where(Project.company_id == company_id)
    if stage:
        count_query = count_query.where(Project.stage == stage)
    if package:
        count_query = count_query.where(Project.package == package)
    total = db.execute(count_query).scalar()

    # Paginate
    offset = (page - 1) * page_size
    projects = db.execute(
        query.offset(offset).limit(page_size)
    ).scalars().all()

    return ProjectListResponse(
        projects=projects,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project details"""
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project information"""
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(project, field, value)

    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)

    return project


@router.post("/{project_id}/advance-stage", response_model=ProjectResponse)
async def advance_stage(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Advance project to the next pipeline stage"""
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.advance_stage()
    db.commit()
    db.refresh(project)

    return project


@router.get("/{project_id}/milestones", response_model=List[MilestoneResponse])
async def get_project_milestones(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project milestones"""
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.milestones


class MilestoneUpdate(BaseModel):
    completed: Optional[bool] = None
    notes: Optional[str] = None


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    project_id: int,
    milestone_id: int,
    data: MilestoneUpdate,
    db: Session = Depends(get_db)
):
    """Update a milestone (mark complete, add notes)"""
    milestone = db.execute(
        select(Milestone)
        .where(Milestone.id == milestone_id)
        .where(Milestone.project_id == project_id)
    ).scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if data.completed is not None:
        milestone.completed = data.completed
        if data.completed:
            milestone.completed_date = date.today()
        else:
            milestone.completed_date = None

    if data.notes is not None:
        milestone.notes = data.notes

    milestone.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(milestone)

    return milestone


@router.get("/{project_id}/timeline")
async def get_project_timeline(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project timeline with milestones"""
    project = db.execute(
        select(Project).where(Project.id == project_id)
    ).scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pkg_info = project.package_info
    total_weeks = pkg_info.get("timeline_weeks_max", 6)

    milestones = [
        {
            "id": m.id,
            "name": m.name,
            "order": m.order,
            "due_date": m.due_date.isoformat() if m.due_date else None,
            "completed": m.completed,
            "completed_date": m.completed_date.isoformat() if m.completed_date else None
        }
        for m in project.milestones
    ]

    return {
        "project_id": project_id,
        "reference": project.reference,
        "total_weeks": total_weeks,
        "current_progress": project.progress_percent,
        "stage": project.stage.value,
        "milestones": milestones
    }
