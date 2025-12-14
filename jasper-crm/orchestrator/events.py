"""
JASPER Lead Intelligence System - Event Types
All events that trigger orchestrator workflows.

Event Flow:
    EVENT → ORCHESTRATOR → AGENTS (in sequence) → LEAD FILE (updated)
                ↓
         Context passed between agents
                ↓
         Owner notified when needed
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
import uuid


class EventType(str, Enum):
    """Types of events that trigger orchestrator workflows"""

    # Lead Lifecycle Events
    LEAD_CREATED = "lead_created"           # New lead from any source
    LEAD_UPDATED = "lead_updated"           # Lead data changed
    LEAD_QUALIFIED = "lead_qualified"       # BANT criteria met
    LEAD_SCORED = "lead_scored"             # Score recalculated

    # Communication Events
    MESSAGE_RECEIVED = "message_received"   # Inbound message (WhatsApp/email)
    MESSAGE_SENT = "message_sent"           # Outbound message sent
    EMAIL_OPENED = "email_opened"           # Email tracking pixel fired
    EMAIL_CLICKED = "email_clicked"         # Email link clicked
    NO_RESPONSE = "no_response"             # Follow-up sequence trigger

    # Call Events
    CALL_SCHEDULED = "call_scheduled"       # Call booked
    CALL_REMINDER = "call_reminder"         # 24h/1h before call
    CALL_STARTED = "call_started"           # Call in progress
    CALL_COMPLETED = "call_completed"       # Call ended, notes submitted
    CALL_NO_SHOW = "call_no_show"           # Lead didn't show

    # Pipeline Events
    PROPOSAL_REQUESTED = "proposal_requested"
    PROPOSAL_SENT = "proposal_sent"
    PROPOSAL_VIEWED = "proposal_viewed"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"

    # Lead Gen Events (from bots)
    DFI_OPPORTUNITY = "dfi_opportunity"     # DFI monitor found opportunity
    COLD_EMAIL_RESPONSE = "cold_email_response"  # Response to cold email
    LINKEDIN_ENGAGEMENT = "linkedin_engagement"  # LinkedIn activity

    # Research Events
    RESEARCH_REQUESTED = "research_requested"  # Manual research trigger
    RESEARCH_COMPLETED = "research_completed"  # Research agent done

    # Content & Marketing Events
    CONTENT_REQUESTED = "content_requested"  # AI content generation request
    BLOG_PUBLISHED = "blog_published"        # Blog post published
    SEO_OPPORTUNITY = "seo_opportunity"      # SEO keyword opportunity found

    # System Events
    ESCALATION = "escalation"               # Manual escalation
    DAILY_DIGEST = "daily_digest"           # Scheduled digest
    ERROR = "error"                         # Something went wrong


class Event(BaseModel):
    """
    Event object passed to orchestrator.

    Example:
        event = Event(
            type=EventType.LEAD_CREATED,
            lead_id="abc123",
            data={"source": "whatsapp", "phone": "+27..."}
        )
        await orchestrator.handle_event(event)
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: EventType
    lead_id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Tracing
    correlation_id: Optional[str] = None  # For tracking related events
    source: Optional[str] = None  # Where event originated (whatsapp, api, scheduler)
    user_id: Optional[str] = None  # If triggered by user action

    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ============================================================================
# EVENT FACTORIES
# ============================================================================

def lead_created_event(
    lead_id: str,
    source: str,
    data: dict = None
) -> Event:
    """Create lead_created event."""
    return Event(
        type=EventType.LEAD_CREATED,
        lead_id=lead_id,
        source=source,
        data=data or {}
    )


def message_received_event(
    lead_id: str,
    channel: str,
    content: str,
    from_address: str
) -> Event:
    """Create message_received event."""
    return Event(
        type=EventType.MESSAGE_RECEIVED,
        lead_id=lead_id,
        source=channel,
        data={
            "channel": channel,
            "content": content,
            "from_address": from_address
        }
    )


def call_scheduled_event(
    lead_id: str,
    scheduled_at: datetime,
    meeting_type: str = "discovery"
) -> Event:
    """Create call_scheduled event."""
    return Event(
        type=EventType.CALL_SCHEDULED,
        lead_id=lead_id,
        source="scheduler",
        data={
            "scheduled_at": scheduled_at.isoformat(),
            "meeting_type": meeting_type
        }
    )


def call_completed_event(
    lead_id: str,
    call_id: str,
    outcome: str,
    notes: dict
) -> Event:
    """Create call_completed event."""
    return Event(
        type=EventType.CALL_COMPLETED,
        lead_id=lead_id,
        source="call_coach",
        data={
            "call_id": call_id,
            "outcome": outcome,
            "notes": notes
        }
    )


def dfi_opportunity_event(
    title: str,
    dfi_source: str,
    url: str,
    description: str,
    relevance_score: float
) -> Event:
    """Create dfi_opportunity event from monitor bot."""
    return Event(
        type=EventType.DFI_OPPORTUNITY,
        source="dfi_monitor",
        data={
            "title": title,
            "dfi_source": dfi_source,
            "url": url,
            "description": description,
            "relevance_score": relevance_score
        }
    )


def escalation_event(
    lead_id: str,
    reason: str,
    context: str = ""
) -> Event:
    """Create escalation event."""
    return Event(
        type=EventType.ESCALATION,
        lead_id=lead_id,
        source="agent",
        data={
            "reason": reason,
            "context": context
        }
    )


def research_requested_event(
    lead_id: str,
    mode: str = "light"  # light or deep
) -> Event:
    """Create research_requested event."""
    return Event(
        type=EventType.RESEARCH_REQUESTED,
        lead_id=lead_id,
        source="api",
        data={"mode": mode}
    )


def content_requested_event(
    topic: str,
    category: str,
    seo_keywords: list = None,
    lead_id: str = None,
    publish_immediately: bool = False,
    trigger_source: str = "manual"  # manual, crm_insight, seo_opportunity
) -> Event:
    """Create content_requested event for AI blog generation."""
    return Event(
        type=EventType.CONTENT_REQUESTED,
        lead_id=lead_id,
        source=trigger_source,
        data={
            "topic": topic,
            "category": category,
            "seo_keywords": seo_keywords or [],
            "publish_immediately": publish_immediately,
            "trigger_source": trigger_source
        }
    )


def seo_opportunity_event(
    keyword: str,
    search_volume: int,
    difficulty: int,
    suggested_topic: str
) -> Event:
    """Create seo_opportunity event from keyword analysis."""
    return Event(
        type=EventType.SEO_OPPORTUNITY,
        source="seo_analyzer",
        data={
            "keyword": keyword,
            "search_volume": search_volume,
            "difficulty": difficulty,
            "suggested_topic": suggested_topic
        }
    )
