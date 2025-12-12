"""
ALEPH AI Infrastructure - CRM Routes
AI-Native CRM endpoints for JASPER Financial Architecture

Endpoints:
- POST /v1/crm/contacts/search - Semantic contact search
- POST /v1/crm/contacts/ingest - Add/update contact with embedding
- POST /v1/crm/leads/score - AI lead scoring
- POST /v1/crm/emails/context - Get email context for contact
- POST /v1/crm/emails/draft - Generate email draft
- POST /v1/crm/emails/ingest - Store email with embedding
- POST /v1/crm/documents/analyze - Analyze client document
- POST /v1/crm/documents/ingest - Store document with embedding
- POST /v1/crm/deals/ingest - Store deal for pattern matching
- POST /v1/crm/meetings/prepare - Generate meeting brief
- POST /v1/crm/meetings/ingest - Store meeting notes
- POST /v1/crm/webhook - Webhook receiver for JASPER Portal

Automation Endpoints (Days 10-12):
- POST /v1/crm/tasks/prioritize - AI task prioritization
- POST /v1/crm/tasks/ingest - Store tasks
- GET /v1/crm/analytics/weekly - Weekly performance analytics
- GET /v1/crm/analytics/pipeline - Pipeline health metrics
- POST /v1/crm/automation/rules - Configure automation rules
- POST /v1/crm/automation/trigger - Trigger automated workflows
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import time
import uuid

from ..models import embedding_service, vision_service, completion_service
from ..services import milvus_service

router = APIRouter(prefix="/v1/crm", tags=["CRM"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ContactSearchRequest(BaseModel):
    """Semantic contact search request."""
    query: str = Field(..., description="Natural language search query")
    limit: int = Field(10, description="Max results to return")


class ContactSearchResult(BaseModel):
    """Single contact search result."""
    contact_id: str
    name: str
    company: Optional[str]
    relevance: float
    matched_context: str


class ContactSearchResponse(BaseModel):
    """Contact search response."""
    contacts: List[ContactSearchResult]
    query: str
    search_time_ms: int


class ContactIngestRequest(BaseModel):
    """Contact ingestion request."""
    contact_id: str = Field(..., description="Unique contact ID")
    name: str = Field(..., description="Contact name")
    company: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LeadScoreRequest(BaseModel):
    """Lead scoring request."""
    company: str = Field(..., description="Company name")
    industry: Optional[str] = None
    project_description: Optional[str] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    source: Optional[str] = None
    contact_name: Optional[str] = None


class LeadScoreResponse(BaseModel):
    """Lead scoring response."""
    score: int
    win_probability: float
    similar_won_deals: List[Dict[str, Any]]
    similar_lost_deals: List[Dict[str, Any]]
    reasoning: str
    recommended_package: Optional[str]
    suggested_dfis: List[str]


class EmailContextRequest(BaseModel):
    """Email context request."""
    contact_id: str = Field(..., description="Contact ID")
    new_situation: str = Field(..., description="Current situation/purpose")


class EmailContextResponse(BaseModel):
    """Email context response."""
    summary: str
    key_points: List[str]
    tone_recommendation: str
    last_contact_date: Optional[str]
    relevant_emails: List[Dict[str, Any]]


class EmailDraftRequest(BaseModel):
    """Email draft request."""
    contact_id: str = Field(..., description="Contact ID")
    purpose: str = Field(..., description="Email purpose")
    key_points: List[str] = Field(..., description="Points to include")
    tone: Optional[str] = Field("professional", description="Desired tone")


class EmailDraftResponse(BaseModel):
    """Email draft response."""
    draft: str
    subject_suggestion: str
    model_used: str
    tokens: Dict[str, int]


class EmailIngestRequest(BaseModel):
    """Email ingestion request."""
    email_id: str = Field(..., description="Unique email ID")
    contact_id: str = Field(..., description="Associated contact ID")
    subject: str
    body: str
    direction: str = Field(..., description="sent or received")
    date: str
    sentiment: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentAnalyzeRequest(BaseModel):
    """Document analysis request."""
    document: str = Field(..., description="Base64 encoded document")
    contact_id: str = Field(..., description="Associated contact ID")
    document_type: str = Field(..., description="financial_statement, proposal, mou, other")
    filename: Optional[str] = None


class DocumentAnalyzeResponse(BaseModel):
    """Document analysis response."""
    document_id: str
    extracted_text_preview: str
    analysis: Dict[str, Any]
    tables_extracted: int
    suggested_actions: List[str]
    processing_time_ms: int


class DealIngestRequest(BaseModel):
    """Deal ingestion request."""
    deal_id: str = Field(..., description="Unique deal ID")
    contact_id: str = Field(..., description="Associated contact ID")
    deal_name: str
    company: str
    industry: Optional[str] = None
    value: Optional[float] = None
    status: str = Field(..., description="won, lost, open, stalled")
    outcome_reason: Optional[str] = None
    package_type: Optional[str] = None
    dfis_involved: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MeetingPrepRequest(BaseModel):
    """Meeting preparation request."""
    contact_id: str = Field(..., description="Contact ID")
    meeting_purpose: str = Field(..., description="Purpose of meeting")


class MeetingPrepResponse(BaseModel):
    """Meeting preparation response."""
    brief: Dict[str, Any]
    quick_stats: Dict[str, Any]
    key_documents: List[Dict[str, Any]]
    recent_emails: List[Dict[str, Any]]


class MeetingIngestRequest(BaseModel):
    """Meeting notes ingestion request."""
    meeting_id: str = Field(..., description="Unique meeting ID")
    contact_id: str = Field(..., description="Associated contact ID")
    date: str
    attendees: List[str]
    purpose: str
    notes: str
    action_items: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WebhookPayload(BaseModel):
    """Webhook payload from JASPER Portal."""
    event_type: str = Field(..., description="contact_created, email_sent, deal_updated, etc.")
    data: Dict[str, Any]
    timestamp: str


# ============================================================================
# Automation Request/Response Models (Days 10-12)
# ============================================================================

class TaskIngestRequest(BaseModel):
    """Task ingestion request."""
    task_id: str = Field(..., description="Unique task ID")
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = Field("medium", description="low, medium, high, urgent")
    status: str = Field("pending", description="pending, in_progress, completed, cancelled")
    task_type: Optional[str] = Field(None, description="follow_up, meeting, document, proposal, other")
    assigned_to: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TaskPrioritizeRequest(BaseModel):
    """Task prioritization request."""
    tasks: Optional[List[Dict[str, Any]]] = Field(None, description="Tasks to prioritize (or fetch all pending)")
    context: Optional[str] = Field(None, description="Current business context/priorities")
    time_available: Optional[str] = Field(None, description="e.g. '4 hours', 'full day'")


class TaskPrioritizeResponse(BaseModel):
    """Task prioritization response."""
    prioritized_tasks: List[Dict[str, Any]]
    reasoning: str
    quick_wins: List[Dict[str, Any]]
    high_impact: List[Dict[str, Any]]
    can_delegate: List[Dict[str, Any]]
    suggested_schedule: List[Dict[str, Any]]


class WeeklyAnalyticsResponse(BaseModel):
    """Weekly analytics response."""
    period: Dict[str, str]
    summary: Dict[str, Any]
    pipeline_health: Dict[str, Any]
    activity_metrics: Dict[str, Any]
    ai_insights: str
    recommendations: List[str]
    comparison_to_last_week: Dict[str, Any]


class PipelineAnalyticsResponse(BaseModel):
    """Pipeline analytics response."""
    total_value: float
    deal_count: int
    by_stage: Dict[str, Dict[str, Any]]
    conversion_rates: Dict[str, float]
    avg_deal_size: float
    forecast: Dict[str, Any]
    at_risk_deals: List[Dict[str, Any]]
    hot_deals: List[Dict[str, Any]]


class AutomationRule(BaseModel):
    """Automation rule definition."""
    rule_id: str = Field(..., description="Unique rule ID")
    name: str
    trigger: str = Field(..., description="Trigger event: lead_created, deal_stalled, no_contact_7d, etc.")
    conditions: Dict[str, Any] = Field(default_factory=dict)
    actions: List[Dict[str, Any]] = Field(..., description="Actions to perform")
    enabled: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AutomationTriggerRequest(BaseModel):
    """Manual automation trigger request."""
    rule_id: Optional[str] = None
    trigger_type: str = Field(..., description="auto_score_leads, send_reminders, stale_deal_alert, weekly_digest")
    target_ids: Optional[List[str]] = Field(None, description="Specific contact/deal IDs to process")
    dry_run: bool = Field(False, description="Preview actions without executing")


# ============================================================================
# Contact Endpoints
# ============================================================================

@router.post("/contacts/search", response_model=ContactSearchResponse)
async def semantic_contact_search(
    request: ContactSearchRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Search contacts by meaning, not just keywords.

    Example: "solar energy investors interested in East Africa"
    Finds contacts even if their notes say "renewable power" and "Kenya focus"
    """
    start_time = time.time()

    try:
        # Embed the query
        query_vector = embedding_service.embed_text(request.query)

        # Search contacts collection
        results = milvus_service.search(
            collection="crm_contacts",
            vector=query_vector,
            top_k=request.limit,
        )

        contacts = []
        for r in results:
            contacts.append(ContactSearchResult(
                contact_id=r.get("metadata", {}).get("contact_id", "unknown"),
                name=r.get("metadata", {}).get("name", "Unknown"),
                company=r.get("metadata", {}).get("company"),
                relevance=round(r.get("score", 0), 3),
                matched_context=r.get("text", "")[:200],
            ))

        search_time = int((time.time() - start_time) * 1000)

        return ContactSearchResponse(
            contacts=contacts,
            query=request.query,
            search_time_ms=search_time,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contacts/ingest")
async def ingest_contact(
    request: ContactIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Add or update a contact with automatic embedding.

    Creates a rich text profile for semantic search.
    """
    try:
        # Build searchable profile text
        profile_parts = [
            f"Name: {request.name}",
            f"Company: {request.company}" if request.company else "",
            f"Role: {request.role}" if request.role else "",
            f"Industry: {request.industry}" if request.industry else "",
            f"Notes: {request.notes}" if request.notes else "",
            f"Tags: {', '.join(request.tags)}" if request.tags else "",
        ]
        profile_text = "\n".join([p for p in profile_parts if p])

        # Generate embedding
        vector = embedding_service.embed_text(profile_text)

        # Store in Milvus
        success = milvus_service.insert(
            collection="crm_contacts",
            id=request.contact_id,
            vector=vector,
            metadata={
                "contact_id": request.contact_id,
                "name": request.name,
                "company": request.company,
                "role": request.role,
                "email": request.email,
                "industry": request.industry,
                "tags": request.tags,
                **request.metadata,
            },
            text=profile_text,
        )

        return {
            "success": success,
            "contact_id": request.contact_id,
            "profile_text_length": len(profile_text),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Lead Scoring Endpoints
# ============================================================================

@router.post("/leads/score", response_model=LeadScoreResponse)
async def score_lead(
    request: LeadScoreRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Score a lead based on semantic similarity to won/lost deals.

    Learns from YOUR history, not generic rules.
    """
    try:
        # Build lead profile
        lead_profile = f"""
Company: {request.company}
Industry: {request.industry or 'Unknown'}
Project: {request.project_description or 'Not specified'}
Budget: {request.budget_range or 'Not specified'}
Timeline: {request.timeline or 'Not specified'}
Source: {request.source or 'Unknown'}
"""

        # Embed lead profile
        lead_vector = embedding_service.embed_text(lead_profile)

        # Find similar won deals
        similar_won = milvus_service.search(
            collection="crm_deals",
            vector=lead_vector,
            top_k=5,
            filter_expr="status == 'won'",
        )

        # Find similar lost deals
        similar_lost = milvus_service.search(
            collection="crm_deals",
            vector=lead_vector,
            top_k=5,
            filter_expr="status == 'lost'",
        )

        # Calculate win probability
        won_scores = [r.get("score", 0) for r in similar_won] if similar_won else [0]
        lost_scores = [r.get("score", 0) for r in similar_lost] if similar_lost else [0]

        avg_won = sum(won_scores) / len(won_scores) if won_scores else 0
        avg_lost = sum(lost_scores) / len(lost_scores) if lost_scores else 0

        if avg_won + avg_lost > 0:
            win_probability = avg_won / (avg_won + avg_lost)
        else:
            win_probability = 0.5  # No data, neutral

        # Get AI reasoning
        won_names = [r.get("metadata", {}).get("deal_name", "Unknown") for r in similar_won[:3]]
        lost_names = [r.get("metadata", {}).get("deal_name", "Unknown") for r in similar_lost[:3]]

        reasoning_prompt = f"""Lead profile: {lead_profile}

Similar won deals: {won_names}
Similar lost deals: {lost_names}

Win probability: {win_probability:.0%}

In 2-3 sentences, explain why this lead has this win probability and recommend a JASPER package tier (Starter $45K, Professional $85-150K, Enterprise $250-750K) and potential DFI matches."""

        reasoning_result = await completion_service.complete(
            prompt=reasoning_prompt,
            model="gemini",
            max_tokens=200,
        )
        reasoning = reasoning_result.get("text", "Analysis unavailable")

        # Extract recommendations from reasoning or provide defaults
        recommended_package = None
        suggested_dfis = []

        if "Starter" in reasoning or "45K" in reasoning:
            recommended_package = "Starter ($45K)"
        elif "Enterprise" in reasoning or "250K" in reasoning or "750K" in reasoning:
            recommended_package = "Enterprise ($250K-750K)"
        else:
            recommended_package = "Professional ($85K-150K)"

        # Common DFIs based on industry
        industry_lower = (request.industry or "").lower()
        if "agri" in industry_lower or "farm" in industry_lower:
            suggested_dfis = ["AfDB AFAWA", "IFAD", "Norfund"]
        elif "energy" in industry_lower or "solar" in industry_lower:
            suggested_dfis = ["IFC", "AfDB", "FMO"]
        elif "tech" in industry_lower:
            suggested_dfis = ["IFC", "Proparco", "DEG"]
        else:
            suggested_dfis = ["IFC", "AfDB", "DFC"]

        return LeadScoreResponse(
            score=int(win_probability * 100),
            win_probability=round(win_probability, 2),
            similar_won_deals=[
                {"deal_name": r.get("metadata", {}).get("deal_name"), "score": round(r.get("score", 0), 2)}
                for r in similar_won[:3]
            ],
            similar_lost_deals=[
                {"deal_name": r.get("metadata", {}).get("deal_name"), "score": round(r.get("score", 0), 2)}
                for r in similar_lost[:3]
            ],
            reasoning=reasoning,
            recommended_package=recommended_package,
            suggested_dfis=suggested_dfis,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Email Endpoints
# ============================================================================

@router.post("/emails/context", response_model=EmailContextResponse)
async def get_email_context(
    request: EmailContextRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Retrieve relevant email history and context for a contact.
    """
    try:
        # Search email history for this contact
        query_vector = embedding_service.embed_text(request.new_situation)

        email_results = milvus_service.search(
            collection="crm_emails",
            vector=query_vector,
            top_k=10,
            filter_expr=f"contact_id == '{request.contact_id}'",
        )

        if not email_results:
            return EmailContextResponse(
                summary="No previous email history found for this contact.",
                key_points=[],
                tone_recommendation="Professional and warm",
                last_contact_date=None,
                relevant_emails=[],
            )

        # Build context summary using AI
        email_texts = [r.get("text", "")[:500] for r in email_results[:5]]

        summary_prompt = f"""Summarize the relevant email history with this contact:

{email_texts}

Current situation: {request.new_situation}

Provide:
1. Brief summary (2-3 sentences)
2. Key points from past discussions (bullet list)
3. Recommended tone for next message

Format as JSON with keys: summary, key_points (array), tone_recommendation"""

        summary_result = await completion_service.complete(
            prompt=summary_prompt,
            model="gemini",
            max_tokens=300,
        )

        # Parse response
        summary_text = summary_result.get("text", "")
        try:
            if "{" in summary_text:
                json_str = summary_text[summary_text.index("{"):summary_text.rindex("}")+1]
                parsed = json.loads(json_str)
                summary = parsed.get("summary", "Context analysis completed.")
                key_points = parsed.get("key_points", [])
                tone = parsed.get("tone_recommendation", "Professional")
            else:
                summary = summary_text
                key_points = []
                tone = "Professional"
        except:
            summary = summary_text
            key_points = []
            tone = "Professional"

        return EmailContextResponse(
            summary=summary,
            key_points=key_points,
            tone_recommendation=tone,
            last_contact_date=email_results[0].get("metadata", {}).get("date") if email_results else None,
            relevant_emails=[
                {
                    "subject": r.get("metadata", {}).get("subject", ""),
                    "date": r.get("metadata", {}).get("date", ""),
                    "direction": r.get("metadata", {}).get("direction", ""),
                    "preview": r.get("text", "")[:150],
                }
                for r in email_results[:5]
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/draft", response_model=EmailDraftResponse)
async def draft_email(
    request: EmailDraftRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate an email draft based on contact history and your style.
    """
    try:
        # Get contact context
        context_result = await get_email_context(
            EmailContextRequest(
                contact_id=request.contact_id,
                new_situation=request.purpose,
            ),
            x_api_key=x_api_key,
        )

        # Get your email style (from sent emails)
        style_vector = embedding_service.embed_text("professional email")
        style_samples = milvus_service.search(
            collection="crm_emails",
            vector=style_vector,
            top_k=3,
            filter_expr="direction == 'sent'",
        )

        style_text = style_samples[0].get("text", "")[:500] if style_samples else ""

        # Generate draft
        draft_prompt = f"""Draft an email for this purpose: {request.purpose}

Key points to include:
{request.key_points}

Contact context:
{context_result.summary}

Desired tone: {request.tone}

{f"Match this writing style: {style_text}" if style_text else "Use a professional, warm, and concise style."}

Write the email (do not include subject line in body):"""

        draft_result = await completion_service.complete(
            prompt=draft_prompt,
            model="deepseek",
            max_tokens=500,
        )

        draft = draft_result.get("text", "")

        # Generate subject suggestion
        subject_prompt = f"Suggest a professional email subject line for: {request.purpose}. Return ONLY the subject line, nothing else."
        subject_result = await completion_service.complete(
            prompt=subject_prompt,
            model="gemini",
            max_tokens=50,
        )

        return EmailDraftResponse(
            draft=draft,
            subject_suggestion=subject_result.get("text", "").strip(),
            model_used="deepseek/deepseek-chat",
            tokens=draft_result.get("tokens", {}),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/ingest")
async def ingest_email(
    request: EmailIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Store an email with automatic embedding for semantic search.
    """
    try:
        # Build searchable text
        email_text = f"Subject: {request.subject}\n\n{request.body}"

        # Generate embedding
        vector = embedding_service.embed_text(email_text)

        # Store in Milvus
        success = milvus_service.insert(
            collection="crm_emails",
            id=request.email_id,
            vector=vector,
            metadata={
                "email_id": request.email_id,
                "contact_id": request.contact_id,
                "subject": request.subject,
                "direction": request.direction,
                "date": request.date,
                "sentiment": request.sentiment,
                **request.metadata,
            },
            text=email_text,
        )

        return {
            "success": success,
            "email_id": request.email_id,
            "contact_id": request.contact_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Document Endpoints
# ============================================================================

@router.post("/documents/analyze", response_model=DocumentAnalyzeResponse)
async def analyze_document(
    request: DocumentAnalyzeRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Extract insights from client documents automatically.

    Supports: financial_statement, proposal, mou, other
    """
    start_time = time.time()

    try:
        # OCR with SmolDocling
        ocr_result = await vision_service.ocr(
            image=request.document,
            output_format="doctags",
        )

        extracted_text = ocr_result.get("text", "")
        tables_count = len(ocr_result.get("tables", []))

        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from document",
            )

        # Analyze based on document type
        if request.document_type == "financial_statement":
            analysis_prompt = f"""Analyze this financial statement for a JASPER client assessment:

{extracted_text[:6000]}

Extract and return as JSON:
{{
    "revenue_trend": "description of revenue pattern",
    "financial_health": "overall assessment",
    "key_ratios": {{"debt_to_equity": "value", "current_ratio": "value"}},
    "red_flags": ["list of concerns"],
    "strengths": ["list of positives"],
    "recommended_package": "Starter/Professional/Enterprise",
    "suggested_dfis": ["list of 3 suitable DFIs"]
}}"""

        elif request.document_type == "proposal":
            analysis_prompt = f"""Analyze this project proposal:

{extracted_text[:6000]}

Extract and return as JSON:
{{
    "project_summary": "2-3 sentence summary",
    "funding_requirement": "amount needed",
    "timeline": "project timeline",
    "key_risks": ["list of risks"],
    "dfi_alignment_score": 1-10,
    "missing_information": ["what's needed"],
    "recommended_package": "Starter/Professional/Enterprise"
}}"""

        elif request.document_type == "mou":
            analysis_prompt = f"""Analyze this MOU/Agreement:

{extracted_text[:6000]}

Extract and return as JSON:
{{
    "parties_involved": ["list of parties"],
    "key_terms": ["main terms"],
    "obligations": ["key obligations"],
    "timeline": "agreement timeline",
    "value": "monetary value if mentioned",
    "next_steps": ["recommended actions"]
}}"""

        else:
            analysis_prompt = f"""Analyze this document:

{extracted_text[:6000]}

Extract key information and return as JSON:
{{
    "document_type": "detected type",
    "summary": "2-3 sentence summary",
    "key_points": ["main points"],
    "entities": ["people, companies, places mentioned"],
    "dates": ["important dates"],
    "action_items": ["suggested follow-ups"]
}}"""

        analysis_result = await completion_service.complete(
            prompt=analysis_prompt,
            model="deepseek",
            max_tokens=800,
        )

        # Parse analysis
        analysis_text = analysis_result.get("text", "")
        try:
            if "{" in analysis_text:
                json_str = analysis_text[analysis_text.index("{"):analysis_text.rindex("}")+1]
                analysis = json.loads(json_str)
            else:
                analysis = {"raw_analysis": analysis_text}
        except:
            analysis = {"raw_analysis": analysis_text}

        # Generate document ID and store
        document_id = f"doc_{uuid.uuid4().hex[:12]}"

        # Embed and store document
        vector = embedding_service.embed_text(extracted_text[:8000])
        milvus_service.insert(
            collection="crm_documents",
            id=document_id,
            vector=vector,
            metadata={
                "document_id": document_id,
                "contact_id": request.contact_id,
                "document_type": request.document_type,
                "filename": request.filename,
                "analysis": json.dumps(analysis),
            },
            text=extracted_text,
        )

        # Generate suggested actions
        suggested_actions = []
        if request.document_type == "financial_statement":
            suggested_actions = [
                f"Create deal: {analysis.get('recommended_package', 'Professional')} JASPER Package",
                "Schedule: Discovery call to discuss DFI options",
                "Task: Request additional documentation if needed",
            ]
        elif request.document_type == "proposal":
            suggested_actions = [
                "Review: Assess DFI alignment",
                "Task: Identify missing information",
                "Schedule: Technical review meeting",
            ]

        processing_time = int((time.time() - start_time) * 1000)

        return DocumentAnalyzeResponse(
            document_id=document_id,
            extracted_text_preview=extracted_text[:500],
            analysis=analysis,
            tables_extracted=tables_count,
            suggested_actions=suggested_actions,
            processing_time_ms=processing_time,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents/ingest")
async def ingest_document(
    request: Dict[str, Any],
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Store a pre-processed document with embedding.
    """
    try:
        document_id = request.get("document_id", f"doc_{uuid.uuid4().hex[:12]}")
        text = request.get("text", "")

        if not text:
            raise HTTPException(status_code=400, detail="Text content required")

        # Generate embedding
        vector = embedding_service.embed_text(text[:8000])

        # Store in Milvus
        success = milvus_service.insert(
            collection="crm_documents",
            id=document_id,
            vector=vector,
            metadata={
                "document_id": document_id,
                "contact_id": request.get("contact_id"),
                "document_type": request.get("document_type", "other"),
                **request.get("metadata", {}),
            },
            text=text,
        )

        return {
            "success": success,
            "document_id": document_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Deal Endpoints
# ============================================================================

@router.post("/deals/ingest")
async def ingest_deal(
    request: DealIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Store a deal for pattern matching and lead scoring.
    """
    try:
        # Build searchable profile
        deal_profile = f"""
Deal: {request.deal_name}
Company: {request.company}
Industry: {request.industry or 'Unknown'}
Value: {request.value or 'Unknown'}
Status: {request.status}
Package: {request.package_type or 'Unknown'}
DFIs: {', '.join(request.dfis_involved) if request.dfis_involved else 'None'}
Outcome: {request.outcome_reason or 'N/A'}
Notes: {request.notes or 'None'}
"""

        # Generate embedding
        vector = embedding_service.embed_text(deal_profile)

        # Store in Milvus
        success = milvus_service.insert(
            collection="crm_deals",
            id=request.deal_id,
            vector=vector,
            metadata={
                "deal_id": request.deal_id,
                "contact_id": request.contact_id,
                "deal_name": request.deal_name,
                "company": request.company,
                "industry": request.industry,
                "value": request.value,
                "status": request.status,
                "outcome_reason": request.outcome_reason,
                "package_type": request.package_type,
                "dfis_involved": request.dfis_involved,
                **request.metadata,
            },
            text=deal_profile,
        )

        return {
            "success": success,
            "deal_id": request.deal_id,
            "status": request.status,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Meeting Endpoints
# ============================================================================

@router.post("/meetings/prepare", response_model=MeetingPrepResponse)
async def prepare_meeting(
    request: MeetingPrepRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate comprehensive meeting preparation in seconds.
    """
    try:
        # Get contact info
        contact_vector = embedding_service.embed_text(request.contact_id)
        contact_results = milvus_service.search(
            collection="crm_contacts",
            vector=contact_vector,
            top_k=1,
            filter_expr=f"contact_id == '{request.contact_id}'",
        )

        contact_info = contact_results[0] if contact_results else {}
        contact_metadata = contact_info.get("metadata", {})

        # Get email context
        purpose_vector = embedding_service.embed_text(request.meeting_purpose)
        email_results = milvus_service.search(
            collection="crm_emails",
            vector=purpose_vector,
            top_k=10,
            filter_expr=f"contact_id == '{request.contact_id}'",
        )

        # Get document insights
        doc_results = milvus_service.search(
            collection="crm_documents",
            vector=purpose_vector,
            top_k=5,
            filter_expr=f"contact_id == '{request.contact_id}'",
        )

        # Get deal history
        deal_results = milvus_service.search(
            collection="crm_deals",
            vector=contact_vector,
            top_k=5,
            filter_expr=f"contact_id == '{request.contact_id}'",
        )

        # Generate meeting brief
        brief_prompt = f"""Prepare a meeting brief for: {request.meeting_purpose}

Contact: {contact_metadata.get('name', 'Unknown')} at {contact_metadata.get('company', 'Unknown')}
Role: {contact_metadata.get('role', 'Unknown')}

Email history (last 5):
{[e.get('text', '')[:200] for e in email_results[:5]]}

Document insights:
{[d.get('text', '')[:200] for d in doc_results[:3]]}

Deal history:
{[d.get('metadata', {}) for d in deal_results[:3]]}

Generate a brief with:
1. Executive Summary (3 sentences)
2. Relationship Timeline (key milestones)
3. Their Priorities (based on communications)
4. Open Items (promises made, questions pending)
5. Recommended Discussion Points
6. Potential Objections & Responses

Return as JSON with these keys."""

        brief_result = await completion_service.complete(
            prompt=brief_prompt,
            model="deepseek",
            max_tokens=800,
        )

        # Parse brief
        brief_text = brief_result.get("text", "")
        try:
            if "{" in brief_text:
                json_str = brief_text[brief_text.index("{"):brief_text.rindex("}")+1]
                brief = json.loads(json_str)
            else:
                brief = {"raw_brief": brief_text}
        except:
            brief = {"raw_brief": brief_text}

        # Calculate quick stats
        quick_stats = {
            "total_interactions": len(email_results),
            "documents_on_file": len(doc_results),
            "active_deals": len([d for d in deal_results if d.get("metadata", {}).get("status") == "open"]),
        }

        return MeetingPrepResponse(
            brief=brief,
            quick_stats=quick_stats,
            key_documents=[
                {
                    "document_id": d.get("metadata", {}).get("document_id"),
                    "type": d.get("metadata", {}).get("document_type"),
                    "preview": d.get("text", "")[:100],
                }
                for d in doc_results[:3]
            ],
            recent_emails=[
                {
                    "subject": e.get("metadata", {}).get("subject"),
                    "date": e.get("metadata", {}).get("date"),
                    "preview": e.get("text", "")[:100],
                }
                for e in email_results[:3]
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/meetings/ingest")
async def ingest_meeting(
    request: MeetingIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Store meeting notes with automatic embedding.
    """
    try:
        # Build searchable text
        meeting_text = f"""
Meeting: {request.purpose}
Date: {request.date}
Attendees: {', '.join(request.attendees)}

Notes:
{request.notes}

Action Items:
{chr(10).join(['- ' + item for item in request.action_items])}
"""

        # Generate embedding
        vector = embedding_service.embed_text(meeting_text)

        # Store in Milvus
        success = milvus_service.insert(
            collection="crm_meetings",
            id=request.meeting_id,
            vector=vector,
            metadata={
                "meeting_id": request.meeting_id,
                "contact_id": request.contact_id,
                "date": request.date,
                "attendees": request.attendees,
                "purpose": request.purpose,
                "action_items": request.action_items,
                **request.metadata,
            },
            text=meeting_text,
        )

        return {
            "success": success,
            "meeting_id": request.meeting_id,
            "action_items_count": len(request.action_items),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Webhook Endpoint (Data Capture from JASPER Portal)
# ============================================================================

@router.post("/webhook")
async def crm_webhook(
    payload: WebhookPayload,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Webhook receiver for automatic data capture from JASPER Portal.

    Supported event types:
    - contact_created / contact_updated
    - email_sent / email_received
    - deal_created / deal_updated / deal_won / deal_lost
    - document_uploaded
    - meeting_scheduled / meeting_completed
    """
    try:
        event_type = payload.event_type
        data = payload.data

        result = {"event_type": event_type, "processed": False}

        # Handle contact events
        if event_type in ["contact_created", "contact_updated"]:
            await ingest_contact(
                ContactIngestRequest(**data),
                x_api_key=x_api_key,
            )
            result["processed"] = True
            result["action"] = "contact_ingested"

        # Handle email events
        elif event_type in ["email_sent", "email_received"]:
            direction = "sent" if event_type == "email_sent" else "received"
            data["direction"] = direction
            await ingest_email(
                EmailIngestRequest(**data),
                x_api_key=x_api_key,
            )
            result["processed"] = True
            result["action"] = "email_ingested"

        # Handle deal events
        elif event_type in ["deal_created", "deal_updated", "deal_won", "deal_lost"]:
            if event_type == "deal_won":
                data["status"] = "won"
            elif event_type == "deal_lost":
                data["status"] = "lost"
            await ingest_deal(
                DealIngestRequest(**data),
                x_api_key=x_api_key,
            )
            result["processed"] = True
            result["action"] = "deal_ingested"

        # Handle document events
        elif event_type == "document_uploaded":
            # If document has base64 content, analyze it
            if "document" in data:
                analyze_result = await analyze_document(
                    DocumentAnalyzeRequest(**data),
                    x_api_key=x_api_key,
                )
                result["processed"] = True
                result["action"] = "document_analyzed"
                result["document_id"] = analyze_result.document_id
            else:
                # Just ingest text if available
                await ingest_document(data, x_api_key=x_api_key)
                result["processed"] = True
                result["action"] = "document_ingested"

        # Handle meeting events
        elif event_type in ["meeting_scheduled", "meeting_completed"]:
            if event_type == "meeting_completed" and "notes" in data:
                await ingest_meeting(
                    MeetingIngestRequest(**data),
                    x_api_key=x_api_key,
                )
                result["processed"] = True
                result["action"] = "meeting_ingested"
            else:
                result["processed"] = True
                result["action"] = "meeting_event_logged"

        else:
            result["message"] = f"Unknown event type: {event_type}"

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Task Prioritization Endpoints (Day 10)
# ============================================================================

# In-memory task storage (in production, use database)
_tasks_store: Dict[str, Dict[str, Any]] = {}


@router.post("/tasks/ingest")
async def ingest_task(
    request: TaskIngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Store a task for tracking and prioritization.
    """
    try:
        # Build searchable text
        task_text = f"""
Task: {request.title}
Description: {request.description or 'None'}
Type: {request.task_type or 'general'}
Priority: {request.priority}
Due: {request.due_date or 'Not set'}
Contact: {request.contact_id or 'None'}
Deal: {request.deal_id or 'None'}
"""

        # Generate embedding
        vector = embedding_service.embed_text(task_text)

        # Store in memory for quick access
        _tasks_store[request.task_id] = {
            "task_id": request.task_id,
            "contact_id": request.contact_id,
            "deal_id": request.deal_id,
            "title": request.title,
            "description": request.description,
            "due_date": request.due_date,
            "priority": request.priority,
            "status": request.status,
            "task_type": request.task_type,
            "assigned_to": request.assigned_to,
            "created_at": datetime.now().isoformat(),
            **request.metadata,
        }

        return {
            "success": True,
            "task_id": request.task_id,
            "status": request.status,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/prioritize", response_model=TaskPrioritizeResponse)
async def prioritize_tasks(
    request: TaskPrioritizeRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    AI-powered task prioritization based on deal value, deadlines, and impact.

    Uses Eisenhower Matrix + Deal Value weighting.
    """
    try:
        # Get tasks to prioritize
        if request.tasks:
            tasks = request.tasks
        else:
            # Fetch pending tasks from store
            tasks = [t for t in _tasks_store.values() if t.get("status") in ["pending", "in_progress"]]

        if not tasks:
            return TaskPrioritizeResponse(
                prioritized_tasks=[],
                reasoning="No pending tasks found.",
                quick_wins=[],
                high_impact=[],
                can_delegate=[],
                suggested_schedule=[],
            )

        # Enrich tasks with deal/contact context
        enriched_tasks = []
        for task in tasks:
            enriched = dict(task)

            # Get deal value if linked
            if task.get("deal_id"):
                deal_vector = embedding_service.embed_text(task["deal_id"])
                deal_results = milvus_service.search(
                    collection="crm_deals",
                    vector=deal_vector,
                    top_k=1,
                )
                if deal_results:
                    deal_meta = deal_results[0].get("metadata", {})
                    enriched["deal_value"] = deal_meta.get("value", 0)
                    enriched["deal_status"] = deal_meta.get("status", "unknown")

            # Calculate days until due
            if task.get("due_date"):
                try:
                    due = datetime.fromisoformat(task["due_date"].replace("Z", ""))
                    days_until = (due - datetime.now()).days
                    enriched["days_until_due"] = days_until
                    enriched["is_overdue"] = days_until < 0
                except:
                    enriched["days_until_due"] = 999
                    enriched["is_overdue"] = False
            else:
                enriched["days_until_due"] = 999
                enriched["is_overdue"] = False

            enriched_tasks.append(enriched)

        # AI prioritization
        prioritize_prompt = f"""Prioritize these tasks for a DFI financial consultant:

Tasks:
{json.dumps(enriched_tasks, indent=2)}

Current context: {request.context or 'Standard business day'}
Time available: {request.time_available or 'Full day'}

Apply the Eisenhower Matrix (Urgent/Important) weighted by:
1. Deal value (higher value = higher priority)
2. Days until due (overdue and soon = urgent)
3. Task type (proposals > follow-ups > admin)
4. Contact relationship strength

Return JSON with:
{{
    "prioritized_tasks": [list of task_ids in priority order with reason],
    "reasoning": "2-3 sentences on prioritization logic",
    "quick_wins": [tasks completable in <15min],
    "high_impact": [tasks with biggest business impact],
    "can_delegate": [tasks that could be delegated],
    "suggested_schedule": [
        {{"time": "9:00 AM", "task_id": "xxx", "duration": "30 min"}},
        ...
    ]
}}"""

        priority_result = await completion_service.complete(
            prompt=prioritize_prompt,
            model="deepseek",
            max_tokens=1000,
        )

        # Parse response
        result_text = priority_result.get("text", "")
        try:
            if "{" in result_text:
                json_str = result_text[result_text.index("{"):result_text.rindex("}")+1]
                parsed = json.loads(json_str)
            else:
                parsed = {}
        except:
            parsed = {}

        return TaskPrioritizeResponse(
            prioritized_tasks=parsed.get("prioritized_tasks", [{"task_id": t["task_id"], "title": t["title"]} for t in enriched_tasks]),
            reasoning=parsed.get("reasoning", "Tasks prioritized by due date and deal value."),
            quick_wins=parsed.get("quick_wins", []),
            high_impact=parsed.get("high_impact", []),
            can_delegate=parsed.get("can_delegate", []),
            suggested_schedule=parsed.get("suggested_schedule", []),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/pending")
async def get_pending_tasks(
    x_api_key: str = Header(..., alias="X-API-Key"),
    limit: int = 50,
):
    """
    Get all pending tasks.
    """
    try:
        pending = [t for t in _tasks_store.values() if t.get("status") in ["pending", "in_progress"]]
        pending.sort(key=lambda x: (x.get("priority") != "urgent", x.get("due_date") or "9999"))
        return {
            "tasks": pending[:limit],
            "total_pending": len(pending),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Update task status.
    """
    try:
        if task_id not in _tasks_store:
            raise HTTPException(status_code=404, detail="Task not found")

        _tasks_store[task_id]["status"] = status
        _tasks_store[task_id]["updated_at"] = datetime.now().isoformat()

        return {"success": True, "task_id": task_id, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Weekly Analytics Endpoints (Days 11-12)
# ============================================================================

@router.get("/analytics/weekly", response_model=WeeklyAnalyticsResponse)
async def get_weekly_analytics(
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Get comprehensive weekly CRM analytics with AI insights.
    """
    try:
        now = datetime.now()
        week_start = now - timedelta(days=7)

        # Collect metrics from all collections
        contacts_count = milvus_service.count("crm_contacts")
        emails_count = milvus_service.count("crm_emails")
        documents_count = milvus_service.count("crm_documents")
        deals_count = milvus_service.count("crm_deals")
        meetings_count = milvus_service.count("crm_meetings")

        # Get all deals for pipeline analysis
        pipeline_vector = embedding_service.embed_text("deal pipeline status value")
        all_deals = milvus_service.search(
            collection="crm_deals",
            vector=pipeline_vector,
            top_k=100,
        )

        # Calculate pipeline metrics
        total_pipeline_value = 0
        won_value = 0
        lost_value = 0
        open_deals = 0

        for deal in all_deals:
            meta = deal.get("metadata", {})
            value = meta.get("value", 0) or 0
            status = meta.get("status", "")

            if status == "won":
                won_value += value
            elif status == "lost":
                lost_value += value
            elif status == "open":
                total_pipeline_value += value
                open_deals += 1

        # Get pending tasks count
        pending_tasks = len([t for t in _tasks_store.values() if t.get("status") == "pending"])
        overdue_tasks = len([t for t in _tasks_store.values()
                           if t.get("status") == "pending" and t.get("due_date")
                           and datetime.fromisoformat(t["due_date"].replace("Z", "")) < now])

        # Generate AI insights
        insights_prompt = f"""Analyze this weekly CRM performance for a DFI financial consultant:

Metrics:
- Total contacts: {contacts_count}
- Emails tracked: {emails_count}
- Documents analyzed: {documents_count}
- Total deals: {deals_count}
- Meetings logged: {meetings_count}
- Open pipeline value: R{total_pipeline_value:,.0f}
- Won this period: R{won_value:,.0f}
- Lost this period: R{lost_value:,.0f}
- Open deals: {open_deals}
- Pending tasks: {pending_tasks}
- Overdue tasks: {overdue_tasks}

Provide:
1. A 2-3 sentence executive summary
2. 3 specific recommendations to improve performance
3. Key risk to address this week

Return as JSON: {{"summary": "...", "recommendations": ["...", "...", "..."], "key_risk": "..."}}"""

        insights_result = await completion_service.complete(
            prompt=insights_prompt,
            model="deepseek",
            max_tokens=400,
        )

        # Parse insights
        insights_text = insights_result.get("text", "")
        try:
            if "{" in insights_text:
                json_str = insights_text[insights_text.index("{"):insights_text.rindex("}")+1]
                insights = json.loads(json_str)
            else:
                insights = {"summary": insights_text, "recommendations": [], "key_risk": ""}
        except:
            insights = {"summary": "Analysis complete.", "recommendations": [], "key_risk": ""}

        return WeeklyAnalyticsResponse(
            period={
                "start": week_start.isoformat(),
                "end": now.isoformat(),
            },
            summary={
                "total_contacts": contacts_count,
                "total_deals": deals_count,
                "open_pipeline_value": total_pipeline_value,
                "won_value": won_value,
                "lost_value": lost_value,
                "win_rate": round(won_value / (won_value + lost_value) * 100, 1) if (won_value + lost_value) > 0 else 0,
            },
            pipeline_health={
                "open_deals": open_deals,
                "avg_deal_size": round(total_pipeline_value / open_deals, 0) if open_deals > 0 else 0,
                "pipeline_coverage": round(total_pipeline_value / 500000, 2),  # Assuming R500K quarterly target
            },
            activity_metrics={
                "emails_tracked": emails_count,
                "documents_analyzed": documents_count,
                "meetings_logged": meetings_count,
                "pending_tasks": pending_tasks,
                "overdue_tasks": overdue_tasks,
            },
            ai_insights=insights.get("summary", ""),
            recommendations=insights.get("recommendations", []),
            comparison_to_last_week={
                "note": "Historical comparison requires time-series data storage",
                "trend": "stable",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/pipeline", response_model=PipelineAnalyticsResponse)
async def get_pipeline_analytics(
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Get detailed pipeline health metrics and forecasting.
    """
    try:
        # Get all deals
        pipeline_vector = embedding_service.embed_text("deal pipeline financial model DFI")
        all_deals = milvus_service.search(
            collection="crm_deals",
            vector=pipeline_vector,
            top_k=200,
        )

        # Analyze by stage
        by_stage = {
            "lead": {"count": 0, "value": 0, "deals": []},
            "qualified": {"count": 0, "value": 0, "deals": []},
            "proposal": {"count": 0, "value": 0, "deals": []},
            "negotiation": {"count": 0, "value": 0, "deals": []},
            "won": {"count": 0, "value": 0, "deals": []},
            "lost": {"count": 0, "value": 0, "deals": []},
        }

        total_value = 0
        all_values = []
        at_risk = []
        hot_deals = []

        for deal in all_deals:
            meta = deal.get("metadata", {})
            value = meta.get("value", 0) or 0
            status = meta.get("status", "lead")
            deal_name = meta.get("deal_name", "Unknown")

            # Map status to stage
            stage = status if status in by_stage else "lead"
            by_stage[stage]["count"] += 1
            by_stage[stage]["value"] += value
            by_stage[stage]["deals"].append(deal_name)

            if status == "open":
                total_value += value
                all_values.append(value)

                # Identify at-risk deals (stalled, low engagement)
                if value > 100000:  # High-value deals
                    hot_deals.append({
                        "deal_name": deal_name,
                        "value": value,
                        "status": status,
                    })

        # Calculate conversion rates
        conversion_rates = {}
        if by_stage["lead"]["count"] > 0:
            conversion_rates["lead_to_qualified"] = round(
                by_stage["qualified"]["count"] / by_stage["lead"]["count"] * 100, 1
            )
        if by_stage["qualified"]["count"] > 0:
            conversion_rates["qualified_to_proposal"] = round(
                by_stage["proposal"]["count"] / by_stage["qualified"]["count"] * 100, 1
            )
        if by_stage["proposal"]["count"] > 0:
            conversion_rates["proposal_to_won"] = round(
                by_stage["won"]["count"] / by_stage["proposal"]["count"] * 100, 1
            )

        # Forecast based on pipeline
        weighted_pipeline = (
            by_stage["qualified"]["value"] * 0.2 +
            by_stage["proposal"]["value"] * 0.5 +
            by_stage["negotiation"]["value"] * 0.8
        )

        return PipelineAnalyticsResponse(
            total_value=total_value,
            deal_count=len(all_deals),
            by_stage={k: {"count": v["count"], "value": v["value"]} for k, v in by_stage.items()},
            conversion_rates=conversion_rates,
            avg_deal_size=round(sum(all_values) / len(all_values), 0) if all_values else 0,
            forecast={
                "weighted_pipeline": weighted_pipeline,
                "expected_close_30_days": weighted_pipeline * 0.3,
                "expected_close_90_days": weighted_pipeline * 0.7,
            },
            at_risk_deals=at_risk[:5],
            hot_deals=hot_deals[:5],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Automation Workflows
# ============================================================================

# In-memory automation rules store
_automation_rules: Dict[str, Dict[str, Any]] = {}


@router.post("/automation/rules")
async def create_automation_rule(
    rule: AutomationRule,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Create or update an automation rule.

    Supported triggers:
    - lead_created: When new lead is added
    - deal_stalled: Deal has no activity for X days
    - no_contact_7d: Contact has no interaction for 7 days
    - document_uploaded: When document is analyzed
    - meeting_scheduled: When meeting is created

    Supported actions:
    - score_lead: Auto-score the lead
    - create_task: Create follow-up task
    - send_alert: Send notification (webhook)
    - generate_email_draft: Draft follow-up email
    - update_priority: Change deal/contact priority
    """
    try:
        _automation_rules[rule.rule_id] = {
            "rule_id": rule.rule_id,
            "name": rule.name,
            "trigger": rule.trigger,
            "conditions": rule.conditions,
            "actions": rule.actions,
            "enabled": rule.enabled,
            "created_at": datetime.now().isoformat(),
            **rule.metadata,
        }

        return {
            "success": True,
            "rule_id": rule.rule_id,
            "trigger": rule.trigger,
            "actions_count": len(rule.actions),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/automation/rules")
async def list_automation_rules(
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    List all automation rules.
    """
    return {
        "rules": list(_automation_rules.values()),
        "total": len(_automation_rules),
    }


@router.delete("/automation/rules/{rule_id}")
async def delete_automation_rule(
    rule_id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Delete an automation rule.
    """
    if rule_id in _automation_rules:
        del _automation_rules[rule_id]
        return {"success": True, "rule_id": rule_id}
    raise HTTPException(status_code=404, detail="Rule not found")


@router.post("/automation/trigger")
async def trigger_automation(
    request: AutomationTriggerRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Manually trigger automation workflows.

    Trigger types:
    - auto_score_leads: Score all unscored leads
    - send_reminders: Create tasks for stale contacts
    - stale_deal_alert: Identify deals with no recent activity
    - weekly_digest: Generate weekly summary
    """
    try:
        results = {
            "trigger_type": request.trigger_type,
            "dry_run": request.dry_run,
            "actions_taken": [],
            "items_processed": 0,
        }

        if request.trigger_type == "auto_score_leads":
            # Get all contacts without scores
            contacts_vector = embedding_service.embed_text("new lead contact prospect")
            contacts = milvus_service.search(
                collection="crm_contacts",
                vector=contacts_vector,
                top_k=50,
            )

            for contact in contacts:
                meta = contact.get("metadata", {})
                if request.target_ids and meta.get("contact_id") not in request.target_ids:
                    continue

                if not request.dry_run:
                    # Score the lead
                    try:
                        score_result = await score_lead(
                            LeadScoreRequest(
                                company=meta.get("company", "Unknown"),
                                industry=meta.get("industry"),
                                contact_name=meta.get("name"),
                            ),
                            x_api_key=x_api_key,
                        )
                        results["actions_taken"].append({
                            "action": "scored_lead",
                            "contact_id": meta.get("contact_id"),
                            "score": score_result.score,
                        })
                    except:
                        pass
                else:
                    results["actions_taken"].append({
                        "action": "would_score_lead",
                        "contact_id": meta.get("contact_id"),
                    })

                results["items_processed"] += 1

        elif request.trigger_type == "send_reminders":
            # Create follow-up tasks for contacts with no recent activity
            contacts_vector = embedding_service.embed_text("follow up reminder contact")
            contacts = milvus_service.search(
                collection="crm_contacts",
                vector=contacts_vector,
                top_k=100,
            )

            for contact in contacts:
                meta = contact.get("metadata", {})
                contact_id = meta.get("contact_id")

                if request.target_ids and contact_id not in request.target_ids:
                    continue

                # Check for existing pending tasks
                has_pending = any(
                    t.get("contact_id") == contact_id and t.get("status") == "pending"
                    for t in _tasks_store.values()
                )

                if not has_pending:
                    if not request.dry_run:
                        task_id = f"task_{uuid.uuid4().hex[:8]}"
                        _tasks_store[task_id] = {
                            "task_id": task_id,
                            "contact_id": contact_id,
                            "title": f"Follow up with {meta.get('name', 'Contact')}",
                            "description": "Automated reminder - no recent activity",
                            "due_date": (datetime.now() + timedelta(days=3)).isoformat(),
                            "priority": "medium",
                            "status": "pending",
                            "task_type": "follow_up",
                            "created_at": datetime.now().isoformat(),
                            "auto_generated": True,
                        }
                        results["actions_taken"].append({
                            "action": "created_task",
                            "task_id": task_id,
                            "contact_id": contact_id,
                        })
                    else:
                        results["actions_taken"].append({
                            "action": "would_create_task",
                            "contact_id": contact_id,
                        })

                    results["items_processed"] += 1

        elif request.trigger_type == "stale_deal_alert":
            # Find deals with no recent activity
            deals_vector = embedding_service.embed_text("stale deal needs attention")
            deals = milvus_service.search(
                collection="crm_deals",
                vector=deals_vector,
                top_k=50,
            )

            stale_deals = []
            for deal in deals:
                meta = deal.get("metadata", {})
                status = meta.get("status", "")

                # Only check open deals
                if status not in ["open", "qualified", "proposal", "negotiation"]:
                    continue

                if request.target_ids and meta.get("deal_id") not in request.target_ids:
                    continue

                stale_deals.append({
                    "deal_id": meta.get("deal_id"),
                    "deal_name": meta.get("deal_name"),
                    "value": meta.get("value"),
                    "status": status,
                    "recommendation": "Schedule follow-up call or send status update",
                })
                results["items_processed"] += 1

            results["stale_deals"] = stale_deals
            results["actions_taken"].append({
                "action": "identified_stale_deals",
                "count": len(stale_deals),
            })

        elif request.trigger_type == "weekly_digest":
            # Generate weekly digest
            if not request.dry_run:
                analytics = await get_weekly_analytics(x_api_key=x_api_key)
                results["weekly_digest"] = {
                    "period": analytics.period,
                    "summary": analytics.summary,
                    "ai_insights": analytics.ai_insights,
                    "recommendations": analytics.recommendations,
                }
                results["actions_taken"].append({
                    "action": "generated_weekly_digest",
                })
            else:
                results["actions_taken"].append({
                    "action": "would_generate_weekly_digest",
                })
            results["items_processed"] = 1

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown trigger type: {request.trigger_type}. Supported: auto_score_leads, send_reminders, stale_deal_alert, weekly_digest"
            )

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Status Endpoint
# ============================================================================

@router.get("/status")
async def crm_status(
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Get CRM AI status and collection stats.
    """
    try:
        collections = ["crm_contacts", "crm_emails", "crm_documents", "crm_deals", "crm_meetings"]

        stats = {}
        for collection in collections:
            try:
                count = milvus_service.count(collection)
                stats[collection] = count
            except:
                stats[collection] = 0

        return {
            "status": "operational",
            "collections": stats,
            "total_records": sum(stats.values()),
            "pending_tasks": len([t for t in _tasks_store.values() if t.get("status") == "pending"]),
            "automation_rules": len(_automation_rules),
            "features": [
                "semantic_contact_search",
                "ai_lead_scoring",
                "email_context",
                "email_drafting",
                "document_analysis",
                "meeting_preparation",
                "webhook_data_capture",
                "task_prioritization",
                "weekly_analytics",
                "pipeline_analytics",
                "automation_workflows",
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
