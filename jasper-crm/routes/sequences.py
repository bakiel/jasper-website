"""
JASPER CRM - Email Sequence API Routes
AI-powered email automation endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.tables import EmailSequenceTable, EmailStepTable, SequenceTemplateTable
from models.email_sequence import (
    SequenceType,
    SequenceStatus,
    EmailStatus,
    StartSequenceRequest,
    SequenceActionRequest,
    EmailPreviewRequest,
    EmailPreviewResponse,
    SequenceResponse,
    SequenceListResponse,
    SequenceStatsResponse,
    EmailSequence,
    EmailStepTemplate,
    DEFAULT_SEQUENCES,
)
from services.sequence_scheduler import sequence_scheduler
from services.email_generator import email_generator

router = APIRouter(prefix="/api/sequences", tags=["Email Sequences"])


# ============== SEQUENCE MANAGEMENT ==============

@router.post("/start", response_model=SequenceResponse)
async def start_sequence(
    request: StartSequenceRequest,
    db: Session = Depends(get_db),
):
    """
    Start an email sequence for a lead.

    - **lead_id**: Required - The lead to start the sequence for
    - **template_id**: Optional - Specific template ID to use
    - **sequence_type**: Optional - Type of sequence (welcome, nurture, etc.)
    - **custom_context**: Optional - Additional context for AI personalization
    """
    result = await sequence_scheduler.start_sequence(
        db,
        lead_id=request.lead_id,
        template_id=request.template_id,
        sequence_type=request.sequence_type,
        custom_context=request.custom_context,
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    # Get the created sequence
    sequence = db.query(EmailSequenceTable).filter(
        EmailSequenceTable.id == result["sequence_id"]
    ).first()

    return SequenceResponse(
        success=True,
        sequence=EmailSequence(
            id=sequence.id,
            lead_id=sequence.lead_id,
            lead_email=sequence.lead_email,
            lead_name=sequence.lead_name,
            company=sequence.company,
            template_id=sequence.template_id,
            template_name=sequence.template_name,
            sequence_type=sequence.sequence_type,
            status=sequence.status,
            current_step=sequence.current_step,
            total_steps=sequence.total_steps,
            started_at=sequence.started_at,
            emails_sent=sequence.emails_sent,
            emails_opened=sequence.emails_opened,
            emails_clicked=sequence.emails_clicked,
            replied=sequence.replied,
            lead_context=sequence.lead_context,
        ),
        message=f"Sequence started: {result['template_name']}",
    )


@router.post("/{sequence_id}/action", response_model=SequenceResponse)
async def perform_sequence_action(
    sequence_id: str,
    request: SequenceActionRequest,
    db: Session = Depends(get_db),
):
    """
    Perform an action on a sequence.

    Actions:
    - **pause**: Pause the sequence
    - **resume**: Resume a paused sequence
    - **cancel**: Cancel the sequence entirely
    - **mark_replied**: Mark as replied (auto-pauses)
    """
    if request.action == "pause":
        result = await sequence_scheduler.pause_sequence(db, sequence_id, request.reason)
    elif request.action == "resume":
        result = await sequence_scheduler.resume_sequence(db, sequence_id)
    elif request.action == "cancel":
        result = await sequence_scheduler.cancel_sequence(db, sequence_id, request.reason)
    elif request.action == "mark_replied":
        result = await sequence_scheduler.mark_replied(db, sequence_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    # Get updated sequence
    sequence = db.query(EmailSequenceTable).filter(
        EmailSequenceTable.id == sequence_id
    ).first()

    return SequenceResponse(
        success=True,
        sequence=EmailSequence(
            id=sequence.id,
            lead_id=sequence.lead_id,
            lead_email=sequence.lead_email,
            lead_name=sequence.lead_name,
            company=sequence.company,
            template_id=sequence.template_id,
            template_name=sequence.template_name,
            sequence_type=sequence.sequence_type,
            status=sequence.status,
            current_step=sequence.current_step,
            total_steps=sequence.total_steps,
            started_at=sequence.started_at,
            completed_at=sequence.completed_at,
            paused_at=sequence.paused_at,
            emails_sent=sequence.emails_sent,
            emails_opened=sequence.emails_opened,
            emails_clicked=sequence.emails_clicked,
            replied=sequence.replied,
            lead_context=sequence.lead_context,
        ),
        message=result.get("message"),
    )


@router.get("/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(
    sequence_id: str,
    db: Session = Depends(get_db),
):
    """Get details of a specific sequence"""
    sequence = db.query(EmailSequenceTable).filter(
        EmailSequenceTable.id == sequence_id
    ).first()

    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    return SequenceResponse(
        success=True,
        sequence=EmailSequence(
            id=sequence.id,
            lead_id=sequence.lead_id,
            lead_email=sequence.lead_email,
            lead_name=sequence.lead_name,
            company=sequence.company,
            template_id=sequence.template_id,
            template_name=sequence.template_name,
            sequence_type=sequence.sequence_type,
            status=sequence.status,
            current_step=sequence.current_step,
            total_steps=sequence.total_steps,
            started_at=sequence.started_at,
            completed_at=sequence.completed_at,
            paused_at=sequence.paused_at,
            last_email_sent_at=sequence.last_email_sent_at,
            emails_sent=sequence.emails_sent,
            emails_opened=sequence.emails_opened,
            emails_clicked=sequence.emails_clicked,
            replied=sequence.replied,
            lead_context=sequence.lead_context,
        ),
    )


@router.get("/", response_model=SequenceListResponse)
async def list_sequences(
    status: Optional[SequenceStatus] = None,
    sequence_type: Optional[SequenceType] = None,
    lead_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    List all sequences with optional filters.

    Filters:
    - **status**: Filter by sequence status (active, paused, completed, etc.)
    - **sequence_type**: Filter by sequence type (welcome, nurture, etc.)
    - **lead_id**: Filter by specific lead
    """
    query = db.query(EmailSequenceTable)

    if status:
        query = query.filter(EmailSequenceTable.status == status)
    if sequence_type:
        query = query.filter(EmailSequenceTable.sequence_type == sequence_type)
    if lead_id:
        query = query.filter(EmailSequenceTable.lead_id == lead_id)

    total = query.count()
    active = query.filter(EmailSequenceTable.status == SequenceStatus.ACTIVE).count()
    completed = query.filter(EmailSequenceTable.status == SequenceStatus.COMPLETED).count()

    sequences = query.order_by(EmailSequenceTable.started_at.desc()).offset(offset).limit(limit).all()

    return SequenceListResponse(
        success=True,
        sequences=[
            EmailSequence(
                id=s.id,
                lead_id=s.lead_id,
                lead_email=s.lead_email,
                lead_name=s.lead_name,
                company=s.company,
                template_id=s.template_id,
                template_name=s.template_name,
                sequence_type=s.sequence_type,
                status=s.status,
                current_step=s.current_step,
                total_steps=s.total_steps,
                started_at=s.started_at,
                completed_at=s.completed_at,
                emails_sent=s.emails_sent,
                emails_opened=s.emails_opened,
                emails_clicked=s.emails_clicked,
                replied=s.replied,
                lead_context=s.lead_context,
            )
            for s in sequences
        ],
        total=total,
        active=active,
        completed=completed,
    )


@router.get("/{sequence_id}/steps")
async def get_sequence_steps(
    sequence_id: str,
    db: Session = Depends(get_db),
):
    """Get all steps in a sequence with their status"""
    sequence = db.query(EmailSequenceTable).filter(
        EmailSequenceTable.id == sequence_id
    ).first()

    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    steps = db.query(EmailStepTable).filter(
        EmailStepTable.sequence_id == sequence_id
    ).order_by(EmailStepTable.step_number).all()

    return {
        "success": True,
        "sequence_id": sequence_id,
        "total_steps": len(steps),
        "steps": [
            {
                "id": step.id,
                "step_number": step.step_number,
                "status": step.status.value,
                "scheduled_at": step.scheduled_at.isoformat() if step.scheduled_at else None,
                "sent_at": step.sent_at.isoformat() if step.sent_at else None,
                "opened_at": step.opened_at.isoformat() if step.opened_at else None,
                "clicked_at": step.clicked_at.isoformat() if step.clicked_at else None,
                "replied_at": step.replied_at.isoformat() if step.replied_at else None,
                "subject_template": step.subject_template,
                "ai_generated_subject": step.ai_generated_subject,
                "ai_tone": step.ai_tone,
                "delay_days": step.delay_days,
                "delay_hours": step.delay_hours,
            }
            for step in steps
        ],
    }


# ============== EMAIL PREVIEW ==============

@router.post("/preview", response_model=EmailPreviewResponse)
async def preview_email(
    request: EmailPreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Preview AI-generated email content.

    Uses the lead's context and template to generate personalized email preview.
    """
    # Get lead context
    from db.tables import LeadTable
    lead = db.query(LeadTable).filter(LeadTable.id == request.lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Get template step
    template = DEFAULT_SEQUENCES.get(SequenceType.WELCOME)  # Default to welcome
    if request.template_id:
        for seq_type, tmpl in DEFAULT_SEQUENCES.items():
            if tmpl.id == request.template_id:
                template = tmpl
                break

    if not template or request.step_number > len(template.steps):
        raise HTTPException(status_code=404, detail="Template or step not found")

    step_template = template.steps[request.step_number - 1]

    # Build lead context
    lead_context = {
        "name": lead.name,
        "company": lead.company,
        "sector": lead.sector.value if lead.sector else "general",
        "funding_stage": lead.funding_stage.value if lead.funding_stage else "growth",
        "funding_amount": lead.funding_amount or "undisclosed",
        "source": lead.source.value if lead.source else "website",
    }

    if request.custom_context:
        lead_context.update(request.custom_context)

    # Generate preview
    preview = await email_generator.preview_email(step_template, lead_context)
    return preview


# ============== TEMPLATES ==============

@router.get("/templates/default")
async def get_default_templates():
    """Get all default sequence templates"""
    return {
        "success": True,
        "templates": [
            {
                "id": tmpl.id,
                "name": tmpl.name,
                "description": tmpl.description,
                "sequence_type": tmpl.sequence_type.value,
                "trigger_type": tmpl.trigger_type.value,
                "trigger_conditions": tmpl.trigger_conditions,
                "total_steps": len(tmpl.steps),
                "steps_preview": [
                    {
                        "step_number": s.step_number,
                        "delay_days": s.delay_days,
                        "delay_hours": s.delay_hours,
                        "subject_template": s.subject_template[:50] + "..." if len(s.subject_template) > 50 else s.subject_template,
                        "ai_tone": s.ai_tone,
                    }
                    for s in tmpl.steps
                ],
            }
            for tmpl in DEFAULT_SEQUENCES.values()
        ],
    }


@router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get full details of a specific template"""
    for tmpl in DEFAULT_SEQUENCES.values():
        if tmpl.id == template_id:
            return {
                "success": True,
                "template": {
                    "id": tmpl.id,
                    "name": tmpl.name,
                    "description": tmpl.description,
                    "sequence_type": tmpl.sequence_type.value,
                    "trigger_type": tmpl.trigger_type.value,
                    "trigger_conditions": tmpl.trigger_conditions,
                    "total_steps": len(tmpl.steps),
                    "steps": [
                        {
                            "step_number": s.step_number,
                            "delay_days": s.delay_days,
                            "delay_hours": s.delay_hours,
                            "subject_template": s.subject_template,
                            "body_template": s.body_template,
                            "use_ai_personalization": s.use_ai_personalization,
                            "ai_tone": s.ai_tone,
                            "ai_context_prompt": s.ai_context_prompt,
                            "send_time_preference": s.send_time_preference,
                        }
                        for s in tmpl.steps
                    ],
                },
            }

    raise HTTPException(status_code=404, detail="Template not found")


# ============== STATISTICS ==============

@router.get("/stats/overview", response_model=SequenceStatsResponse)
async def get_stats_overview(db: Session = Depends(get_db)):
    """Get overall email sequence statistics"""
    result = await sequence_scheduler.get_sequence_stats(db)
    return SequenceStatsResponse(success=True, stats=result)


@router.get("/stats/{sequence_id}", response_model=SequenceStatsResponse)
async def get_sequence_stats(
    sequence_id: str,
    db: Session = Depends(get_db),
):
    """Get statistics for a specific sequence"""
    result = await sequence_scheduler.get_sequence_stats(db, sequence_id)

    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))

    return SequenceStatsResponse(success=True, stats=result)


# ============== TRACKING ==============

@router.post("/{sequence_id}/track/open")
async def track_email_open(
    sequence_id: str,
    step_number: int,
    db: Session = Depends(get_db),
):
    """Track email open event"""
    step = db.query(EmailStepTable).filter(
        EmailStepTable.sequence_id == sequence_id,
        EmailStepTable.step_number == step_number,
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Email step not found")

    if not step.opened_at:
        step.opened_at = datetime.utcnow()
        step.status = EmailStatus.OPENED

        # Update sequence stats
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()
        if sequence:
            sequence.emails_opened += 1

        db.commit()

    return {"success": True, "message": "Open tracked"}


@router.post("/{sequence_id}/track/click")
async def track_email_click(
    sequence_id: str,
    step_number: int,
    db: Session = Depends(get_db),
):
    """Track email click event"""
    step = db.query(EmailStepTable).filter(
        EmailStepTable.sequence_id == sequence_id,
        EmailStepTable.step_number == step_number,
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Email step not found")

    if not step.clicked_at:
        step.clicked_at = datetime.utcnow()
        step.status = EmailStatus.CLICKED

        # Update sequence stats
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()
        if sequence:
            sequence.emails_clicked += 1

        db.commit()

    return {"success": True, "message": "Click tracked"}


@router.post("/{sequence_id}/track/reply")
async def track_email_reply(
    sequence_id: str,
    step_number: int,
    db: Session = Depends(get_db),
):
    """Track email reply event - auto-pauses the sequence"""
    step = db.query(EmailStepTable).filter(
        EmailStepTable.sequence_id == sequence_id,
        EmailStepTable.step_number == step_number,
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Email step not found")

    step.replied_at = datetime.utcnow()
    step.status = EmailStatus.REPLIED

    # Mark sequence as replied (auto-pause)
    result = await sequence_scheduler.mark_replied(db, sequence_id)

    return {"success": True, "message": "Reply tracked, sequence paused"}


# ============== AI FEATURES ==============

@router.post("/analyze")
async def analyze_sequence_performance(
    sequence_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Use AI to analyze sequence performance and suggest improvements.

    If sequence_id is provided, analyzes that specific sequence.
    Otherwise, analyzes overall performance.
    """
    stats = await sequence_scheduler.get_sequence_stats(db, sequence_id)

    analysis = await email_generator.analyze_email_performance(stats)

    return {
        "success": True,
        "stats": stats,
        "ai_analysis": analysis.get("analysis") if analysis.get("success") else None,
        "error": analysis.get("error") if not analysis.get("success") else None,
    }


@router.post("/reply-suggestion")
async def get_reply_suggestion(
    sequence_id: str,
    step_number: int,
    lead_reply: str,
    db: Session = Depends(get_db),
):
    """
    Get AI-suggested reply when a lead responds to a sequence email.
    """
    step = db.query(EmailStepTable).filter(
        EmailStepTable.sequence_id == sequence_id,
        EmailStepTable.step_number == step_number,
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Email step not found")

    sequence = db.query(EmailSequenceTable).filter(
        EmailSequenceTable.id == sequence_id
    ).first()

    # Get the sent email content
    original_email = f"Subject: {step.ai_generated_subject or step.subject_template}\n\n{step.ai_generated_body or step.body_template}"

    suggestion = await email_generator.generate_reply_suggestion(
        original_email,
        lead_reply,
        sequence.lead_context,
    )

    return suggestion
