"""
JASPER CRM - Agent Routes
Research Agent, Comms Agent, and Call Coach endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from db import get_db, LeadTable
from models import (
    Lead, LeadTier, ResearchStatus,
    CompanyProfile, PersonProfile, SimilarDeal, BANTQualification
)
from services.scoring import LeadScoringService, calculate_lead_score
from services.aleph import ALEPHClient
from services.owner_notify import OwnerNotifier
from orchestrator.brain import JASPEROrchestrator
from orchestrator.events import (
    lead_created_event,
    research_requested_event,
    call_scheduled_event,
)

router = APIRouter(prefix="/agents", tags=["AI Agents"])

# Initialize services
scoring_service = LeadScoringService()
aleph_client = ALEPHClient()
owner_notifier = OwnerNotifier()
orchestrator = JASPEROrchestrator()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ResearchRequest(BaseModel):
    """Research request parameters"""
    mode: str = "light"  # light or deep


class ResearchResult(BaseModel):
    """Research result response"""
    lead_id: str
    mode: str
    company_info: Optional[CompanyProfile] = None
    person_info: Optional[PersonProfile] = None
    similar_deals: List[SimilarDeal] = []
    new_score: int = 0
    new_tier: str = "cold"


class ScoreResult(BaseModel):
    """Scoring result"""
    lead_id: str
    score: int
    tier: str
    breakdown: dict


class CallBriefRequest(BaseModel):
    """Call brief request"""
    lead_id: str
    scheduled_at: Optional[datetime] = None


class CallBrief(BaseModel):
    """Generated call brief"""
    generated_at: datetime
    lead_id: str
    quick_facts: dict
    company_intel: Optional[str] = None
    person_intel: Optional[str] = None
    dfi_requirements: Optional[str] = None
    conversation_summary: Optional[str] = None
    similar_deals: List[dict] = []
    pricing_context: Optional[str] = None
    suggested_questions: List[str] = []
    objection_handlers: dict = {}
    key_points: List[str] = []


class CommsRequest(BaseModel):
    """Comms agent request"""
    lead_id: str
    message: Optional[str] = None
    channel: str = "email"


class GeneratedResponse(BaseModel):
    """AI-generated response"""
    content: str
    suggested_actions: List[str] = []
    intent_detected: Optional[str] = None


# ============================================================================
# RESEARCH AGENT ENDPOINTS
# ============================================================================

@router.post("/research/{lead_id}", response_model=ResearchResult)
async def run_research(
    lead_id: str,
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Run Research Agent on a lead.

    Modes:
    - light: Quick company/person lookup, similar deals
    - deep: Full research with DFI requirements (before calls)
    """
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)

    # Run research via ALEPH
    try:
        # Company research
        company_info = None
        if lead.company:
            company_data = await aleph_client.search(
                collection="jasper_expertise",
                query=f"company {lead.company}",
                limit=1
            )
            if company_data:
                company_info = CompanyProfile(
                    name=lead.company,
                    description=company_data[0].get("content", "")[:500] if company_data else None
                )

        # Find similar deals
        similar_deals = await aleph_client.find_similar_leads(
            lead_id=lead_id,
            project_type=lead.project_type,
            deal_size=lead.deal_size,
            target_dfi=lead.target_dfis[0] if lead.target_dfis else None,
            limit=5
        )

        # Update lead
        db_lead.research_status = request.mode
        db_lead.last_researched_at = datetime.utcnow()
        if company_info:
            db_lead.company_info = company_info.model_dump()

        # Recalculate score
        score, tier, breakdown = scoring_service.score_lead(lead)
        db_lead.score = score
        db_lead.tier = tier.value

        db.commit()

        return ResearchResult(
            lead_id=lead_id,
            mode=request.mode,
            company_info=company_info,
            similar_deals=similar_deals,
            new_score=score,
            new_tier=tier.value
        )

    except Exception as e:
        print(f"Research error: {e}")
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.get("/research/{lead_id}/similar-deals")
async def get_similar_deals(
    lead_id: str,
    limit: int = 5,
    db: Session = Depends(get_db),
):
    """Get similar won deals from ALEPH."""
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)

    similar = await aleph_client.find_similar_leads(
        lead_id=lead_id,
        project_type=lead.project_type,
        deal_size=lead.deal_size,
        target_dfi=lead.target_dfis[0] if lead.target_dfis else None,
        limit=limit
    )

    return {"lead_id": lead_id, "similar_deals": similar}


# ============================================================================
# SCORING ENDPOINTS
# ============================================================================

@router.post("/score/{lead_id}", response_model=ScoreResult)
async def calculate_score(
    lead_id: str,
    db: Session = Depends(get_db),
):
    """Recalculate lead score using 0-100 algorithm."""
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)
    score, tier, breakdown = calculate_lead_score(lead)

    # Update lead
    db_lead.score = score
    db_lead.tier = tier.value
    db.commit()

    return ScoreResult(
        lead_id=lead_id,
        score=score,
        tier=tier.value,
        breakdown=breakdown
    )


@router.get("/score/hot-leads")
async def get_hot_leads(db: Session = Depends(get_db)):
    """Get all hot leads (score >= 70)."""
    leads = db.query(LeadTable).filter(LeadTable.score >= 70).all()
    return {
        "count": len(leads),
        "leads": [Lead.model_validate(l) for l in leads]
    }


@router.get("/score/tier-distribution")
async def get_tier_distribution(db: Session = Depends(get_db)):
    """Get count of leads by tier."""
    hot = db.query(LeadTable).filter(LeadTable.score >= 70).count()
    warm = db.query(LeadTable).filter(LeadTable.score >= 40, LeadTable.score < 70).count()
    cold = db.query(LeadTable).filter(LeadTable.score < 40).count()

    return {"hot": hot, "warm": warm, "cold": cold}


# ============================================================================
# COMMS AGENT ENDPOINTS
# ============================================================================

@router.post("/comms/generate-response", response_model=GeneratedResponse)
async def generate_response(
    request: CommsRequest,
    db: Session = Depends(get_db),
):
    """
    Generate AI response for a lead conversation.

    Uses RAG context + Lead File + conversation history.
    """
    db_lead = db.query(LeadTable).filter(LeadTable.id == request.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)

    # Get context from ALEPH
    try:
        expertise = await aleph_client.get_expertise(
            topic=lead.sector.value if lead.sector else "general"
        )

        # Generate response (placeholder - would use DeepSeek)
        response_content = f"""Thank you for your interest in JASPER's financial modelling services.

Based on your {lead.sector.value if lead.sector else 'project'} requirements, we can provide a comprehensive model that meets DFI standards.

{expertise.get('content', '')[:200] if expertise else ''}

Would you like to schedule a call to discuss your specific needs?

Best regards,
JASPER Team"""

        return GeneratedResponse(
            content=response_content,
            suggested_actions=["schedule_call", "send_proposal_outline"],
            intent_detected="inquiry"
        )

    except Exception as e:
        print(f"Response generation error: {e}")
        return GeneratedResponse(
            content="Thank you for reaching out. A member of our team will be in touch shortly.",
            suggested_actions=["follow_up"],
            intent_detected="general"
        )


@router.post("/comms/classify-intent")
async def classify_intent(message: str):
    """Classify the intent of an inbound message."""
    # Simple keyword-based classification (would use AI in production)
    message_lower = message.lower()

    if any(word in message_lower for word in ['price', 'cost', 'fee', 'quote', 'budget']):
        return {"intent": "pricing", "confidence": 0.85}
    elif any(word in message_lower for word in ['call', 'meeting', 'schedule', 'discuss']):
        return {"intent": "schedule_call", "confidence": 0.85}
    elif any(word in message_lower for word in ['proposal', 'contract', 'ready', 'proceed']):
        return {"intent": "ready_to_buy", "confidence": 0.80}
    elif any(word in message_lower for word in ['concern', 'worried', 'issue', 'problem']):
        return {"intent": "objection", "confidence": 0.75}
    elif '?' in message:
        return {"intent": "question", "confidence": 0.70}
    else:
        return {"intent": "general", "confidence": 0.60}


# ============================================================================
# CALL COACH ENDPOINTS
# ============================================================================

@router.post("/call-coach/generate-brief", response_model=CallBrief)
async def generate_call_brief(
    request: CallBriefRequest,
    db: Session = Depends(get_db),
):
    """
    Generate pre-call brief for a lead.

    Includes:
    - Quick facts
    - Company/person intel
    - DFI requirements (if applicable)
    - Suggested questions
    - Objection handlers
    - Key points to highlight
    """
    db_lead = db.query(LeadTable).filter(LeadTable.id == request.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = Lead.model_validate(db_lead)

    # Get context from ALEPH
    context = await aleph_client.generate_call_context(
        lead_id=lead.id,
        project_type=lead.project_type,
        target_dfi=lead.target_dfis[0] if lead.target_dfis else None,
        deal_size=lead.deal_size
    )

    # Build brief
    brief = CallBrief(
        generated_at=datetime.utcnow(),
        lead_id=lead.id,
        quick_facts={
            "name": lead.name,
            "company": lead.company,
            "sector": lead.sector.value if lead.sector else "Unknown",
            "score": f"{lead.score} ({lead.tier.value if hasattr(lead.tier, 'value') else lead.tier})",
            "source": lead.source.value if lead.source else "Unknown",
            "funding_stage": lead.funding_stage.value if lead.funding_stage else "Unknown",
            "estimated_value": f"R{lead.estimated_value:,.0f}" if lead.estimated_value else "Not specified",
            "target_dfis": ", ".join(lead.target_dfis) if lead.target_dfis else "Not specified",
        },
        company_intel=lead.company_info.description if lead.company_info else None,
        person_intel=lead.person_info.bio if lead.person_info else None,
        dfi_requirements=context.get("dfi_requirements"),
        conversation_summary=context.get("conversation_summary"),
        similar_deals=context.get("similar_deals", []),
        pricing_context=context.get("pricing_context"),
        suggested_questions=context.get("suggested_questions", [
            "What's your timeline for this project?",
            "Have you started DFI discussions yet?",
            "What's your target debt-to-equity ratio?",
            "Who else is involved in the financing decision?",
            "What challenges are you facing with your current model?",
        ]),
        objection_handlers=context.get("objection_handlers", {
            "Price is too high": "Our models have a 95% first-time DFI approval rate. The cost of a rejected model is much higher in delays and credibility damage.",
            "Need more time": "I understand. Given DFI review timelines, starting sooner gives you buffer for revisions. What concerns can I address?",
            "Can you guarantee approval?": "We guarantee our model meets all technical requirements. Our track record: 23 of 24 models approved on first submission.",
        }),
        key_points=context.get("key_points", [
            "Emphasise JASPER's DFI track record",
            "Mention similar successful projects",
            "Highlight timeline considerations",
            "Discuss their specific sector expertise",
        ])
    )

    return brief


@router.post("/call-coach/schedule-call")
async def schedule_call(
    lead_id: str,
    scheduled_at: datetime,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Schedule a call with a lead.

    Triggers:
    - Deep research
    - Brief generation
    - Owner notification
    """
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update lead
    db_lead.has_call_scheduled = True
    db_lead.next_call_at = scheduled_at
    db_lead.next_action = "Scheduled call"
    db_lead.next_action_date = scheduled_at

    # Recalculate score (call scheduled adds points)
    lead = Lead.model_validate(db_lead)
    score, tier, _ = scoring_service.score_lead(lead)
    db_lead.score = score
    db_lead.tier = tier.value

    db.commit()

    # Trigger orchestrator in background
    event = create_call_scheduled_event(
        lead_id=lead_id,
        call_id=f"call_{lead_id[:8]}",
        scheduled_at=scheduled_at.isoformat()
    )
    background_tasks.add_task(orchestrator.handle_event, event)

    # Notify owner
    background_tasks.add_task(
        owner_notifier.notify_call_requested,
        lead_id, lead.name, lead.company, scheduled_at.isoformat()
    )

    return {
        "status": "scheduled",
        "lead_id": lead_id,
        "scheduled_at": scheduled_at,
        "new_score": score,
        "new_tier": tier.value
    }


class PostCallNotes(BaseModel):
    """Post-call notes submission"""
    outcome: str  # qualified, proposal, needs_followup, not_a_fit
    key_points: List[str] = []
    concerns: List[str] = []
    next_steps: List[str] = []
    notes: Optional[str] = None


@router.post("/call-coach/submit-notes")
async def submit_call_notes(
    lead_id: str,
    notes: PostCallNotes,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Submit post-call notes and generate summary.

    Updates lead status and triggers follow-up actions.
    """
    db_lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update lead based on outcome
    db_lead.has_call_scheduled = False
    db_lead.total_calls = (db_lead.total_calls or 0) + 1
    db_lead.last_contacted_at = datetime.utcnow()

    if notes.outcome == "qualified":
        db_lead.status = "qualified"
    elif notes.outcome == "proposal":
        db_lead.status = "proposal_sent"
    elif notes.outcome == "not_a_fit":
        db_lead.status = "closed_lost"

    # Update BANT if mentioned
    if notes.key_points:
        for point in notes.key_points:
            point_lower = point.lower()
            if 'budget' in point_lower:
                db_lead.bant = {**db_lead.bant, "budget_qualified": True} if db_lead.bant else {"budget_qualified": True}
            if 'decision maker' in point_lower or 'authority' in point_lower:
                db_lead.bant = {**db_lead.bant, "authority_qualified": True} if db_lead.bant else {"authority_qualified": True}

    db_lead.notes = f"{db_lead.notes or ''}\n\n--- Call Notes ({datetime.utcnow().strftime('%Y-%m-%d')}) ---\nOutcome: {notes.outcome}\nKey Points: {', '.join(notes.key_points)}\nConcerns: {', '.join(notes.concerns)}\nNext Steps: {', '.join(notes.next_steps)}\nNotes: {notes.notes or 'N/A'}"

    # Recalculate score
    lead = Lead.model_validate(db_lead)
    score, tier, _ = scoring_service.score_lead(lead)
    db_lead.score = score
    db_lead.tier = tier.value

    db.commit()

    return {
        "status": "notes_saved",
        "lead_id": lead_id,
        "outcome": notes.outcome,
        "new_score": score,
        "new_tier": tier.value
    }
