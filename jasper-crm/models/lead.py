"""
JASPER CRM - Lead Models
Pydantic models for lead management
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class LeadStatus(str, Enum):
    """Lead pipeline stages"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    INTAKE_SENT = "intake_sent"
    INTAKE_COMPLETE = "intake_complete"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class LeadSource(str, Enum):
    """Lead acquisition source"""
    WEBSITE = "website"
    REFERRAL = "referral"
    LINKEDIN = "linkedin"
    EMAIL = "email"
    COLD_CALL = "cold_call"
    CONFERENCE = "conference"
    DFI_PARTNER = "dfi_partner"
    OTHER = "other"


class Sector(str, Enum):
    """JASPER target sectors"""
    RENEWABLE_ENERGY = "renewable_energy"
    DATA_CENTRES = "data_centres"
    AGRI_INDUSTRIAL = "agri_industrial"
    CLIMATE_FINANCE = "climate_finance"
    TECHNOLOGY = "technology"
    MANUFACTURING = "manufacturing"
    HEALTHCARE = "healthcare"
    INFRASTRUCTURE = "infrastructure"
    OTHER = "other"


class FundingStage(str, Enum):
    """Company funding stage"""
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    GROWTH = "growth"
    EXPANSION = "expansion"
    ESTABLISHED = "established"
    OTHER = "other"


class LeadPriority(str, Enum):
    """Lead priority classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# --- Base Models ---

class LeadBase(BaseModel):
    """Base lead fields"""
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    company: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    sector: Sector
    funding_stage: FundingStage
    funding_amount: Optional[str] = None  # e.g., "R10M-R50M"
    message: Optional[str] = Field(None, max_length=5000)

    @validator('phone')
    def validate_phone(cls, v):
        if v:
            # Basic phone validation - allow digits, spaces, +, -, ()
            import re
            if not re.match(r'^[\d\s\+\-\(\)]+$', v):
                raise ValueError('Invalid phone number format')
        return v


class LeadCreate(LeadBase):
    """Model for creating a new lead"""
    source: LeadSource = LeadSource.WEBSITE
    referral_source: Optional[str] = None


class LeadUpdate(BaseModel):
    """Model for updating a lead"""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    company: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    sector: Optional[Sector] = None
    funding_stage: Optional[FundingStage] = None
    funding_amount: Optional[str] = None
    message: Optional[str] = Field(None, max_length=5000)
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    qualification_score: Optional[int] = Field(None, ge=1, le=10)
    assigned_to: Optional[str] = None
    target_dfis: Optional[List[str]] = None
    notes: Optional[str] = None


class Lead(LeadBase):
    """Complete lead model with all fields"""
    id: str = Field(default_factory=lambda: f"LEAD-{uuid.uuid4().hex[:8].upper()}")
    source: LeadSource = LeadSource.WEBSITE
    referral_source: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    priority: LeadPriority = LeadPriority.MEDIUM
    qualification_score: int = Field(default=5, ge=1, le=10)
    assigned_to: Optional[str] = None
    target_dfis: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_contacted_at: Optional[datetime] = None

    # Computed/AI fields
    ai_summary: Optional[str] = None
    ai_recommended_package: Optional[str] = None  # Foundation/Professional/Enterprise
    estimated_value: Optional[float] = None  # ZAR

    class Config:
        from_attributes = True


# --- Response Models ---

class LeadResponse(BaseModel):
    """API response for a single lead"""
    success: bool = True
    lead: Lead


class LeadListResponse(BaseModel):
    """API response for lead list"""
    success: bool = True
    leads: List[Lead]
    total: int
    page: int
    limit: int
    total_pages: int


class LeadStats(BaseModel):
    """Lead statistics"""
    total: int
    by_status: dict
    by_source: dict
    by_sector: dict
    by_priority: dict
    avg_qualification_score: float
    total_estimated_value: float


class LeadStatsResponse(BaseModel):
    """API response for lead statistics"""
    success: bool = True
    stats: LeadStats
