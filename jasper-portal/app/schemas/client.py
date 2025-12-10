"""
JASPER Client Portal - Client Schemas (Pydantic Models)
Based on ONBOARDING_SYSTEM.md and FORMS.md specifications
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


# ============================================
# ENUMS - Pipeline Stages & Status
# ============================================

class PipelineStage(str, Enum):
    """8-stage workflow from ONBOARDING_SYSTEM.md"""
    INQUIRY = "inquiry"           # Stage 1: Initial contact
    QUALIFY = "qualify"           # Stage 2: Lead qualification
    INTAKE = "intake"             # Stage 3: Full intake form
    PROPOSAL = "proposal"         # Stage 4: Proposal sent
    DEPOSIT = "deposit"           # Stage 5: Awaiting deposit
    PRODUCTION = "production"     # Stage 6: Work in progress
    DRAFT = "draft"               # Stage 7: Draft delivery
    FINAL = "final"               # Stage 8: Project complete


class ClientStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"
    ARCHIVED = "archived"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"


class ProjectType(str, Enum):
    SOLAR = "solar"
    WIND = "wind"
    HYDRO = "hydro"
    BIOMASS = "biomass"
    BATTERY = "battery"
    HYBRID = "hybrid"
    OTHER = "other"


class FundingSource(str, Enum):
    IFC = "ifc"
    DFI = "dfi"
    COMMERCIAL_BANK = "commercial_bank"
    PRIVATE_EQUITY = "private_equity"
    FAMILY_OFFICE = "family_office"
    SOVEREIGN_FUND = "sovereign_fund"
    OTHER = "other"


class Package(str, Enum):
    GROWTH = "growth"             # $12,000
    INSTITUTIONAL = "institutional"  # $25,000
    INFRASTRUCTURE = "infrastructure"  # $45,000


# ============================================
# BASE SCHEMAS
# ============================================

class ClientBase(BaseModel):
    """Base client fields - Quick Contact Form (10 fields)"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    company: str = Field(..., min_length=1, max_length=200)
    role: Optional[str] = None
    country: Optional[str] = None
    project_type: Optional[ProjectType] = None
    project_capacity: Optional[str] = None  # e.g., "50MW"
    how_heard: Optional[str] = None
    message: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            # Remove spaces and validate basic format
            v = v.replace(' ', '').replace('-', '')
            if len(v) < 10:
                raise ValueError('Phone number too short')
        return v


class ClientIntakeBase(BaseModel):
    """Full Intake Form (50+ fields from FORMS.md)"""

    # Project Overview
    project_name: str = Field(..., max_length=200)
    project_description: str = Field(..., max_length=2000)
    project_type: ProjectType
    capacity_mw: Optional[float] = None
    location_country: str
    location_region: Optional[str] = None
    location_coordinates: Optional[str] = None

    # Financial Requirements
    total_capex: Optional[float] = None
    funding_required: Optional[float] = None
    funding_sources: Optional[List[FundingSource]] = None
    target_funding_date: Optional[datetime] = None
    current_funding_status: Optional[str] = None

    # Project Status
    feasibility_complete: bool = False
    environmental_approval: bool = False
    grid_connection_secured: bool = False
    land_rights_secured: bool = False
    ppa_status: Optional[str] = None  # Power Purchase Agreement
    epc_identified: bool = False

    # Timeline
    expected_cod: Optional[datetime] = None  # Commercial Operation Date
    construction_start: Optional[datetime] = None

    # Documents Available
    has_feasibility_study: bool = False
    has_environmental_impact: bool = False
    has_grid_study: bool = False
    has_financial_model: bool = False
    has_legal_docs: bool = False

    # Additional Info
    previous_funding_experience: Optional[str] = None
    specific_requirements: Optional[str] = None
    preferred_package: Optional[Package] = None
    budget_flexibility: Optional[str] = None


# ============================================
# CREATE SCHEMAS (API Input)
# ============================================

class ClientCreate(ClientBase):
    """Create new client from Quick Contact Form"""
    pass


class ClientIntakeCreate(ClientIntakeBase):
    """Create intake submission"""
    client_id: uuid.UUID


class ProjectCreate(BaseModel):
    """Create a new project"""
    client_id: uuid.UUID
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    package: Package
    price: float
    timeline_weeks: int = 4
    deliverables: List[str] = []


class InvoiceCreate(BaseModel):
    """Create a new invoice"""
    project_id: uuid.UUID
    invoice_type: str = "deposit"  # deposit, balance, full
    amount: float
    currency: str = "USD"
    due_date: Optional[datetime] = None


class DocumentCreate(BaseModel):
    """Create document metadata"""
    project_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    category: str  # intake, deliverable, contract, other


# ============================================
# RESPONSE SCHEMAS (API Output)
# ============================================

class ClientResponse(ClientBase):
    """Client response with computed fields"""
    id: uuid.UUID
    status: ClientStatus
    pipeline_stage: PipelineStage
    created_at: datetime
    updated_at: datetime
    last_activity: Optional[datetime] = None
    total_projects: int = 0
    total_revenue: float = 0.0

    class Config:
        from_attributes = True


class ClientDetailResponse(ClientResponse):
    """Detailed client with intake data"""
    intake: Optional[ClientIntakeBase] = None


class ProjectResponse(BaseModel):
    """Project response"""
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    description: Optional[str]
    package: Package
    price: float
    timeline_weeks: int
    deliverables: List[str]
    status: str
    progress_percent: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Invoice response"""
    id: uuid.UUID
    invoice_number: str
    project_id: uuid.UUID
    invoice_type: str
    amount: float
    currency: str
    status: PaymentStatus
    due_date: Optional[datetime]
    paid_date: Optional[datetime]
    payment_method: Optional[str]
    crypto_discount_applied: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    """Document response"""
    id: uuid.UUID
    project_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    category: str
    download_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ============================================
# LIST/PAGINATION SCHEMAS
# ============================================

class PaginationMeta(BaseModel):
    """Pagination metadata"""
    total: int
    page: int
    per_page: int
    pages: int


class ClientListResponse(BaseModel):
    """Paginated client list"""
    data: List[ClientResponse]
    meta: PaginationMeta


class ProjectListResponse(BaseModel):
    """Paginated project list"""
    data: List[ProjectResponse]
    meta: PaginationMeta


class InvoiceListResponse(BaseModel):
    """Paginated invoice list"""
    data: List[InvoiceResponse]
    meta: PaginationMeta


# ============================================
# DASHBOARD SCHEMAS
# ============================================

class ClientDashboard(BaseModel):
    """Client dashboard summary"""
    client: ClientResponse
    active_projects: List[ProjectResponse]
    pending_invoices: List[InvoiceResponse]
    recent_documents: List[DocumentResponse]
    next_milestone: Optional[str] = None
    notifications: List[str] = []


class AdminDashboard(BaseModel):
    """Admin dashboard summary"""
    total_clients: int
    active_projects: int
    pipeline_summary: dict  # Stage -> count
    revenue_this_month: float
    pending_payments: float
    recent_inquiries: List[ClientResponse]
