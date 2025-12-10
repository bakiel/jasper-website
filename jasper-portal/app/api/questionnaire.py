"""
JASPER Client Portal - Intake Questionnaire API
Client-side endpoints for submitting intake questionnaires
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.base import get_db
from app.models.questionnaire import IntakeQuestionnaire, ProjectTimeline, FundingStatus, ProjectReadiness
from app.models.contact import Contact
from app.api.auth import get_current_contact


router = APIRouter()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class QuestionnaireSubmit(BaseModel):
    """Schema for submitting questionnaire data"""
    # Section 1: Company Information
    company_description: Optional[str] = None
    years_in_operation: Optional[int] = None
    employee_count: Optional[str] = None
    annual_revenue_range: Optional[str] = None

    # Section 2: Project Details
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    project_location: Optional[str] = None
    project_value_estimate: Optional[int] = None
    project_timeline: Optional[ProjectTimeline] = None
    project_readiness: Optional[ProjectReadiness] = None

    # Section 3: Funding Requirements
    funding_status: Optional[FundingStatus] = None
    funding_amount_required: Optional[int] = None
    dfi_experience: bool = False
    previous_dfi_partners: Optional[List[str]] = []
    preferred_dfis: Optional[List[str]] = []

    # Section 4: Documents Available
    has_business_plan: bool = False
    has_financial_statements: bool = False
    has_feasibility_study: bool = False
    has_environmental_assessment: bool = False
    has_legal_documentation: bool = False
    additional_documents: Optional[str] = None

    # Section 5: Impact & ESG
    jobs_to_be_created: Optional[int] = None
    sdg_alignment: Optional[List[str]] = []
    environmental_benefits: Optional[str] = None
    social_impact_description: Optional[str] = None

    # Section 6: Additional Information
    challenges_faced: Optional[str] = None
    specific_assistance_needed: Optional[str] = None
    how_did_you_hear: Optional[str] = None
    additional_comments: Optional[str] = None

    # Submit flag
    completed: bool = False


class QuestionnaireResponse(BaseModel):
    """Response schema for questionnaire data"""
    id: int
    company_id: int
    company_description: Optional[str]
    years_in_operation: Optional[int]
    employee_count: Optional[str]
    annual_revenue_range: Optional[str]
    project_name: Optional[str]
    project_description: Optional[str]
    project_location: Optional[str]
    project_value_estimate: Optional[int]
    project_timeline: Optional[str]
    project_readiness: Optional[str]
    funding_status: Optional[str]
    funding_amount_required: Optional[int]
    dfi_experience: bool
    previous_dfi_partners: Optional[List[str]]
    preferred_dfis: Optional[List[str]]
    has_business_plan: bool
    has_financial_statements: bool
    has_feasibility_study: bool
    has_environmental_assessment: bool
    has_legal_documentation: bool
    additional_documents: Optional[str]
    jobs_to_be_created: Optional[int]
    sdg_alignment: Optional[List[str]]
    environmental_benefits: Optional[str]
    social_impact_description: Optional[str]
    challenges_faced: Optional[str]
    specific_assistance_needed: Optional[str]
    how_did_you_hear: Optional[str]
    additional_comments: Optional[str]
    completed: bool
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionnaireStatusResponse(BaseModel):
    """Check if questionnaire is needed/completed"""
    questionnaire_required: bool
    questionnaire_completed: bool
    questionnaire_id: Optional[int] = None


# ============================================
# API ENDPOINTS
# ============================================

@router.get("/status", response_model=QuestionnaireStatusResponse)
async def get_questionnaire_status(
    contact: Contact = Depends(get_current_contact),
    db: Session = Depends(get_db)
):
    """
    Check if client needs to complete intake questionnaire.
    Used to determine if onboarding modal should be shown.
    """
    # Check if questionnaire exists for this company
    questionnaire = db.query(IntakeQuestionnaire).filter(
        IntakeQuestionnaire.company_id == contact.company_id
    ).first()

    if questionnaire:
        return QuestionnaireStatusResponse(
            questionnaire_required=not questionnaire.completed,
            questionnaire_completed=questionnaire.completed,
            questionnaire_id=questionnaire.id
        )

    # No questionnaire exists - client needs to complete one
    return QuestionnaireStatusResponse(
        questionnaire_required=True,
        questionnaire_completed=False,
        questionnaire_id=None
    )


@router.get("/", response_model=Optional[QuestionnaireResponse])
async def get_questionnaire(
    contact: Contact = Depends(get_current_contact),
    db: Session = Depends(get_db)
):
    """Get existing questionnaire data for the client's company"""
    questionnaire = db.query(IntakeQuestionnaire).filter(
        IntakeQuestionnaire.company_id == contact.company_id
    ).first()

    if not questionnaire:
        return None

    return _questionnaire_to_response(questionnaire)


@router.post("/", response_model=QuestionnaireResponse)
async def save_questionnaire(
    data: QuestionnaireSubmit,
    contact: Contact = Depends(get_current_contact),
    db: Session = Depends(get_db)
):
    """
    Save or update questionnaire data.
    Can be called multiple times to save progress.
    Set completed=True to finalize submission.
    """
    # Check for existing questionnaire
    questionnaire = db.query(IntakeQuestionnaire).filter(
        IntakeQuestionnaire.company_id == contact.company_id
    ).first()

    if not questionnaire:
        # Create new questionnaire
        questionnaire = IntakeQuestionnaire(
            company_id=contact.company_id,
            submitted_by_contact_id=contact.id
        )
        db.add(questionnaire)

    # Update all fields from submission
    update_fields = data.model_dump(exclude_unset=True)

    for key, value in update_fields.items():
        if hasattr(questionnaire, key):
            setattr(questionnaire, key, value)

    # If marking as completed, set submitted_at
    if data.completed and not questionnaire.submitted_at:
        questionnaire.submitted_at = datetime.utcnow()
        questionnaire.completed = True

    db.commit()
    db.refresh(questionnaire)

    return _questionnaire_to_response(questionnaire)


def _questionnaire_to_response(q: IntakeQuestionnaire) -> QuestionnaireResponse:
    """Convert questionnaire model to response schema"""
    return QuestionnaireResponse(
        id=q.id,
        company_id=q.company_id,
        company_description=q.company_description,
        years_in_operation=q.years_in_operation,
        employee_count=q.employee_count,
        annual_revenue_range=q.annual_revenue_range,
        project_name=q.project_name,
        project_description=q.project_description,
        project_location=q.project_location,
        project_value_estimate=q.project_value_estimate,
        project_timeline=q.project_timeline.value if q.project_timeline else None,
        project_readiness=q.project_readiness.value if q.project_readiness else None,
        funding_status=q.funding_status.value if q.funding_status else None,
        funding_amount_required=q.funding_amount_required,
        dfi_experience=q.dfi_experience,
        previous_dfi_partners=q.previous_dfi_partners or [],
        preferred_dfis=q.preferred_dfis or [],
        has_business_plan=q.has_business_plan,
        has_financial_statements=q.has_financial_statements,
        has_feasibility_study=q.has_feasibility_study,
        has_environmental_assessment=q.has_environmental_assessment,
        has_legal_documentation=q.has_legal_documentation,
        additional_documents=q.additional_documents,
        jobs_to_be_created=q.jobs_to_be_created,
        sdg_alignment=q.sdg_alignment or [],
        environmental_benefits=q.environmental_benefits,
        social_impact_description=q.social_impact_description,
        challenges_faced=q.challenges_faced,
        specific_assistance_needed=q.specific_assistance_needed,
        how_did_you_hear=q.how_did_you_hear,
        additional_comments=q.additional_comments,
        completed=q.completed,
        submitted_at=q.submitted_at,
        created_at=q.created_at,
        updated_at=q.updated_at
    )
