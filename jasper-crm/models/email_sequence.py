"""
JASPER CRM - Email Sequence Models
AI-powered email automation sequences for lead nurturing
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


class SequenceType(str, Enum):
    """Pre-defined sequence types"""
    WELCOME = "welcome"                    # New lead welcome sequence
    NURTURE = "nurture"                    # General nurturing sequence
    INTAKE_FOLLOWUP = "intake_followup"    # After intake form sent
    PROPOSAL_FOLLOWUP = "proposal_followup" # After proposal sent
    RE_ENGAGEMENT = "re_engagement"        # Stale leads re-engagement
    POST_WIN = "post_win"                  # After deal won
    POST_LOSS = "post_loss"                # After deal lost (re-engage later)
    CUSTOM = "custom"                      # Custom sequence


class EmailStatus(str, Enum):
    """Email status in sequence"""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"
    FAILED = "failed"


class SequenceStatus(str, Enum):
    """Overall sequence status"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REPLIED = "replied"  # Auto-pause when lead replies


class TriggerType(str, Enum):
    """What triggers a sequence"""
    LEAD_CREATED = "lead_created"
    STATUS_CHANGE = "status_change"
    TAG_ADDED = "tag_added"
    MANUAL = "manual"
    SCHEDULE = "schedule"
    NO_ACTIVITY = "no_activity"


# --- Email Step Models ---

class EmailStepTemplate(BaseModel):
    """Template for an email step in a sequence"""
    step_number: int = Field(..., ge=1)
    delay_days: int = Field(0, ge=0)  # Days after previous step
    delay_hours: int = Field(0, ge=0)  # Hours after previous step
    subject_template: str
    body_template: str
    use_ai_personalization: bool = True
    ai_tone: str = "professional"  # professional, warm, urgent, friendly
    ai_context_prompt: Optional[str] = None  # Additional AI context
    send_time_preference: Optional[str] = "business_hours"  # business_hours, morning, afternoon


class EmailStep(EmailStepTemplate):
    """Actual email step in an active sequence"""
    id: str = Field(default_factory=lambda: f"STEP-{uuid.uuid4().hex[:8].upper()}")
    sequence_id: str
    lead_id: str
    status: EmailStatus = EmailStatus.PENDING
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None

    # AI-generated content
    ai_generated_subject: Optional[str] = None
    ai_generated_body: Optional[str] = None

    # Tracking
    message_id: Optional[str] = None  # Email provider message ID
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# --- Sequence Template Models ---

class SequenceTemplate(BaseModel):
    """Reusable sequence template"""
    id: str = Field(default_factory=lambda: f"TMPL-{uuid.uuid4().hex[:8].upper()}")
    name: str
    description: Optional[str] = None
    sequence_type: SequenceType
    trigger_type: TriggerType
    trigger_conditions: Dict[str, Any] = Field(default_factory=dict)
    steps: List[EmailStepTemplate]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# --- Active Sequence Models ---

class EmailSequence(BaseModel):
    """Active email sequence for a specific lead"""
    id: str = Field(default_factory=lambda: f"SEQ-{uuid.uuid4().hex[:8].upper()}")
    lead_id: str
    lead_email: EmailStr
    lead_name: str
    company: str
    template_id: str
    template_name: str
    sequence_type: SequenceType
    status: SequenceStatus = SequenceStatus.ACTIVE

    current_step: int = 0
    total_steps: int

    # Tracking
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    last_email_sent_at: Optional[datetime] = None

    # Engagement metrics
    emails_sent: int = 0
    emails_opened: int = 0
    emails_clicked: int = 0
    replied: bool = False

    # Context for AI personalization
    lead_context: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


# --- Request/Response Models ---

class StartSequenceRequest(BaseModel):
    """Request to start a sequence for a lead"""
    lead_id: str
    template_id: Optional[str] = None
    sequence_type: Optional[SequenceType] = None
    custom_context: Optional[Dict[str, Any]] = None


class SequenceActionRequest(BaseModel):
    """Request to perform action on a sequence"""
    action: str = Field(..., description="pause, resume, cancel, skip_step")
    reason: Optional[str] = None


class EmailPreviewRequest(BaseModel):
    """Request to preview AI-generated email"""
    lead_id: str
    template_id: str
    step_number: int
    custom_context: Optional[Dict[str, Any]] = None


class EmailPreviewResponse(BaseModel):
    """AI-generated email preview"""
    subject: str
    body: str
    ai_model_used: str
    personalization_notes: List[str]


class SequenceResponse(BaseModel):
    """API response for sequence operations"""
    success: bool = True
    sequence: Optional[EmailSequence] = None
    message: Optional[str] = None


class SequenceListResponse(BaseModel):
    """API response for sequence list"""
    success: bool = True
    sequences: List[EmailSequence]
    total: int
    active: int
    completed: int


class SequenceStatsResponse(BaseModel):
    """Email sequence performance stats"""
    success: bool = True
    stats: Dict[str, Any]


# --- Pre-built Sequence Templates ---

DEFAULT_SEQUENCES = {
    SequenceType.WELCOME: SequenceTemplate(
        id="TMPL-WELCOME",
        name="New Lead Welcome Sequence",
        description="5-email welcome sequence for new leads from website",
        sequence_type=SequenceType.WELCOME,
        trigger_type=TriggerType.LEAD_CREATED,
        trigger_conditions={"source": ["website", "linkedin"]},
        steps=[
            EmailStepTemplate(
                step_number=1,
                delay_days=0,
                delay_hours=1,
                subject_template="Welcome to JASPER - Let's discuss {company}'s funding journey",
                body_template="""Hi {name},

Thank you for reaching out to JASPER Financial Architecture. I'm excited to learn more about {company} and your funding goals.

I noticed you're in the {sector} sector looking for {funding_stage} funding. This is exactly the type of opportunity where our DFI modeling expertise can make a real difference.

Would you have 15 minutes this week for a quick call? I'd love to understand your specific needs and share how we've helped similar companies secure R100M+ in DFI funding.

Best regards,
Bakiel Nxumalo
Technical Director, JASPER""",
                use_ai_personalization=True,
                ai_tone="warm",
            ),
            EmailStepTemplate(
                step_number=2,
                delay_days=2,
                delay_hours=0,
                subject_template="Quick question about {company}'s DFI strategy",
                body_template="""Hi {name},

Following up on my previous email - I wanted to share a quick insight that might be valuable for {company}.

Based on your {sector} focus and {funding_stage} stage, there are typically 3-5 DFIs that would be excellent matches. The key is presenting your financials in the format they prefer.

I've attached our brief guide on "What DFIs Look For" - it's helped many of our clients streamline their funding applications.

Still happy to chat if you'd like to explore this further.

Best,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="professional",
            ),
            EmailStepTemplate(
                step_number=3,
                delay_days=4,
                delay_hours=0,
                subject_template="Success story: How a {sector} company secured R150M",
                body_template="""Hi {name},

I thought you might find this relevant - we recently helped a company in a similar position to {company} secure R150M from a major DFI.

The key was building a financial model that spoke the DFI's language - proper impact metrics, realistic projections, and clear risk mitigation.

Would a case study like this be helpful? I can share more details if you're interested.

Cheers,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="friendly",
            ),
            EmailStepTemplate(
                step_number=4,
                delay_days=7,
                delay_hours=0,
                subject_template="One more thing for {company}...",
                body_template="""Hi {name},

I don't want to be pushy, but I do want to make sure you have what you need.

If timing isn't right for a call, I'm happy to send over:
- Our DFI matching report for {sector}
- A sample financial model structure
- Case studies from similar projects

Just let me know what would be most useful.

Best,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="helpful",
            ),
            EmailStepTemplate(
                step_number=5,
                delay_days=14,
                delay_hours=0,
                subject_template="Closing the loop on {company}",
                body_template="""Hi {name},

I wanted to close the loop on our conversation. I understand timing may not be right at the moment.

When you're ready to explore DFI funding options for {company}, I'm here to help. In the meantime, feel free to reach out if you have any questions.

Wishing you success with your {sector} venture.

Best regards,
Bakiel Nxumalo
JASPER Financial Architecture
www.jasperfinance.org""",
                use_ai_personalization=True,
                ai_tone="professional",
            ),
        ],
    ),

    SequenceType.PROPOSAL_FOLLOWUP: SequenceTemplate(
        id="TMPL-PROPOSAL",
        name="Proposal Follow-up Sequence",
        description="Follow-up sequence after sending a proposal",
        sequence_type=SequenceType.PROPOSAL_FOLLOWUP,
        trigger_type=TriggerType.STATUS_CHANGE,
        trigger_conditions={"new_status": "proposal_sent"},
        steps=[
            EmailStepTemplate(
                step_number=1,
                delay_days=2,
                delay_hours=0,
                subject_template="Following up on {company}'s JASPER proposal",
                body_template="""Hi {name},

I wanted to check in and see if you've had a chance to review the proposal I sent for {company}.

I'm happy to walk you through any sections or answer questions. The financial model structure we proposed is specifically designed to meet DFI requirements.

Would a 20-minute call this week work?

Best,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="professional",
            ),
            EmailStepTemplate(
                step_number=2,
                delay_days=5,
                delay_hours=0,
                subject_template="Quick check-in: {company} proposal",
                body_template="""Hi {name},

Just a quick follow-up on the proposal. I know you're busy, so I wanted to offer a few options:

1. If you have questions, I can schedule a quick call
2. If you need more time, just let me know your timeline
3. If the proposal doesn't fit, I'd appreciate any feedback

Looking forward to hearing from you.

Best,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="understanding",
            ),
            EmailStepTemplate(
                step_number=3,
                delay_days=10,
                delay_hours=0,
                subject_template="Still interested in DFI funding for {company}?",
                body_template="""Hi {name},

I wanted to reach out one more time about the proposal for {company}.

If the timing isn't right or circumstances have changed, I completely understand. However, if DFI funding is still a priority, I'm here to help move things forward.

Feel free to reach out when you're ready.

Best regards,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="patient",
            ),
        ],
    ),

    SequenceType.RE_ENGAGEMENT: SequenceTemplate(
        id="TMPL-REENGAGE",
        name="Stale Lead Re-engagement",
        description="Re-engage leads with no activity for 30+ days",
        sequence_type=SequenceType.RE_ENGAGEMENT,
        trigger_type=TriggerType.NO_ACTIVITY,
        trigger_conditions={"days_inactive": 30},
        steps=[
            EmailStepTemplate(
                step_number=1,
                delay_days=0,
                delay_hours=0,
                subject_template="Has anything changed at {company}?",
                body_template="""Hi {name},

It's been a while since we last connected about DFI funding for {company}.

I wanted to check in - have your funding needs or timeline changed? The DFI landscape has some new opportunities that might be relevant for {sector} companies.

If you're still exploring options, I'd love to catch up.

Best,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="curious",
            ),
            EmailStepTemplate(
                step_number=2,
                delay_days=7,
                delay_hours=0,
                subject_template="New DFI opportunities for {sector}",
                body_template="""Hi {name},

I came across some new funding opportunities that made me think of {company}:

- [AI will insert relevant DFI updates based on sector]

Would any of these be worth exploring? Happy to share more details.

Cheers,
Bakiel""",
                use_ai_personalization=True,
                ai_tone="informative",
                ai_context_prompt="Include 2-3 specific DFI funding opportunities relevant to the lead's sector",
            ),
        ],
    ),
}
