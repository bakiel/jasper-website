"""
JASPER CRM - SQLAlchemy Table Definitions
"""

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Integer,
    Float,
    Boolean,
    Enum as SQLEnum,
    ARRAY,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from models.lead import LeadStatus, LeadSource, LeadPriority, Sector, FundingStage, LeadTier, ResearchStatus
from models.notification import NotificationType, NotificationPriority
from models.email_sequence import SequenceType, SequenceStatus, EmailStatus, TriggerType


class LeadTable(Base):
    """SQLAlchemy model for leads table"""
    __tablename__ = "leads"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    company = Column(String(200), nullable=False, index=True)
    phone = Column(String(30))

    sector = Column(SQLEnum(Sector), nullable=False, index=True)
    funding_stage = Column(SQLEnum(FundingStage), nullable=False)
    funding_amount = Column(String(50))
    message = Column(Text)

    source = Column(SQLEnum(LeadSource), default=LeadSource.WEBSITE, index=True)
    referral_source = Column(String(200))
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW, nullable=False, index=True)
    priority = Column(SQLEnum(LeadPriority), default=LeadPriority.MEDIUM, index=True)
    qualification_score = Column(Integer, default=5)

    assigned_to = Column(String(100))
    target_dfis = Column(ARRAY(String), default=[])
    notes = Column(Text)
    tags = Column(ARRAY(String), default=[])

    # AI-generated fields
    ai_summary = Column(Text)
    ai_recommended_package = Column(String(50))
    estimated_value = Column(Float)

    # === Lead Intelligence Agent Fields ===

    # Lead Scoring (0-100)
    score = Column(Integer, default=0, index=True)
    tier = Column(SQLEnum(LeadTier), default=LeadTier.COLD, index=True)

    # BANT Qualification (stored as JSON)
    bant = Column(JSON, default={
        "budget_qualified": False,
        "budget_notes": None,
        "authority_qualified": False,
        "authority_notes": None,
        "need_qualified": False,
        "need_notes": None,
        "timeline_qualified": False,
        "timeline_notes": None,
    })

    # Research Agent
    research_status = Column(SQLEnum(ResearchStatus), default=ResearchStatus.NONE, index=True)
    last_researched_at = Column(DateTime(timezone=True))
    company_info = Column(JSON)  # CompanyProfile as JSON
    person_info = Column(JSON)   # PersonProfile as JSON
    similar_deals = Column(JSON, default=[])  # List[SimilarDeal] as JSON

    # Engagement Tracking
    responded = Column(Boolean, default=False, index=True)
    engagement_score = Column(Integer, default=0)
    emails_opened = Column(Integer, default=0)
    asked_about_pricing = Column(Boolean, default=False)

    # Call Management
    has_call_scheduled = Column(Boolean, default=False, index=True)
    next_call_at = Column(DateTime(timezone=True))
    total_calls = Column(Integer, default=0)

    # Communication
    linkedin = Column(String(500))
    whatsapp_id = Column(String(50))
    preferred_channel = Column(String(50))

    # Project Details (for scoring)
    project_type = Column(String(100))
    deal_size = Column(Float)
    timeline = Column(String(100))

    # Follow-up
    next_action = Column(String(500))
    next_action_date = Column(DateTime(timezone=True))
    sequence_id = Column(String(50))
    sequence_step = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_contacted_at = Column(DateTime(timezone=True))


class NotificationTable(Base):
    """SQLAlchemy model for notifications table"""
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(String(1000), nullable=False)
    link = Column(String(500))
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.MEDIUM)
    user_id = Column(String(100), nullable=False, index=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ActivityLogTable(Base):
    """SQLAlchemy model for activity logging"""
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False, index=True)  # lead, invoice, project
    entity_id = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # created, updated, status_changed, etc.
    details = Column(Text)
    user_id = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============== EMAIL SEQUENCE TABLES ==============

class SequenceTemplateTable(Base):
    """Reusable email sequence templates"""
    __tablename__ = "sequence_templates"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    sequence_type = Column(SQLEnum(SequenceType), nullable=False, index=True)
    trigger_type = Column(SQLEnum(TriggerType), nullable=False)
    trigger_conditions = Column(JSON, default={})
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to steps
    steps = relationship("SequenceStepTemplateTable", back_populates="template", cascade="all, delete-orphan")


class SequenceStepTemplateTable(Base):
    """Email step templates within a sequence template"""
    __tablename__ = "sequence_step_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(String(50), ForeignKey("sequence_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    delay_days = Column(Integer, default=0)
    delay_hours = Column(Integer, default=0)
    subject_template = Column(String(500), nullable=False)
    body_template = Column(Text, nullable=False)
    use_ai_personalization = Column(Boolean, default=True)
    ai_tone = Column(String(50), default="professional")
    ai_context_prompt = Column(Text)
    send_time_preference = Column(String(50), default="business_hours")

    # Relationship
    template = relationship("SequenceTemplateTable", back_populates="steps")


class EmailSequenceTable(Base):
    """Active email sequence for a specific lead"""
    __tablename__ = "email_sequences"

    id = Column(String(50), primary_key=True, index=True)
    lead_id = Column(String(50), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_email = Column(String(255), nullable=False)
    lead_name = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    template_id = Column(String(50), nullable=False)  # No FK - uses DEFAULT_SEQUENCES in-memory
    template_name = Column(String(200), nullable=False)
    sequence_type = Column(SQLEnum(SequenceType), nullable=False, index=True)
    status = Column(SQLEnum(SequenceStatus), default=SequenceStatus.ACTIVE, nullable=False, index=True)

    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, nullable=False)

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    paused_at = Column(DateTime(timezone=True))
    last_email_sent_at = Column(DateTime(timezone=True))

    # Engagement metrics
    emails_sent = Column(Integer, default=0)
    emails_opened = Column(Integer, default=0)
    emails_clicked = Column(Integer, default=0)
    replied = Column(Boolean, default=False)

    # Context for AI personalization
    lead_context = Column(JSON, default={})

    # Relationships
    steps = relationship("EmailStepTable", back_populates="sequence", cascade="all, delete-orphan")


class EmailStepTable(Base):
    """Actual email step in an active sequence"""
    __tablename__ = "email_steps"

    id = Column(String(50), primary_key=True, index=True)
    sequence_id = Column(String(50), ForeignKey("email_sequences.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(50), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)

    # Template fields
    delay_days = Column(Integer, default=0)
    delay_hours = Column(Integer, default=0)
    subject_template = Column(String(500), nullable=False)
    body_template = Column(Text, nullable=False)
    use_ai_personalization = Column(Boolean, default=True)
    ai_tone = Column(String(50), default="professional")
    ai_context_prompt = Column(Text)
    send_time_preference = Column(String(50), default="business_hours")

    # Status tracking
    status = Column(SQLEnum(EmailStatus), default=EmailStatus.PENDING, nullable=False, index=True)
    scheduled_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    replied_at = Column(DateTime(timezone=True))

    # AI-generated content
    ai_generated_subject = Column(String(500))
    ai_generated_body = Column(Text)

    # Tracking
    message_id = Column(String(200))  # Email provider message ID
    error_message = Column(Text)

    # Relationship
    sequence = relationship("EmailSequenceTable", back_populates="steps")
