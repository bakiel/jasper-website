"""
JASPER Lead Intelligence System - Action Types and Executor
Actions that can be executed by agents through the orchestrator.

Actions are the output of agent processing. The orchestrator
executes them to affect the real world.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


class ActionType(str, Enum):
    """Types of actions agents can request"""

    # Communication Actions
    SEND_WHATSAPP = "send_whatsapp"
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"

    # Lead Actions
    CREATE_LEAD = "create_lead"
    UPDATE_LEAD = "update_lead"
    SCORE_LEAD = "score_lead"
    EMBED_LEAD = "embed_lead"  # Add to ALEPH

    # Research Actions
    RUN_RESEARCH = "run_research"

    # Call Actions
    SCHEDULE_CALL = "schedule_call"
    GENERATE_BRIEF = "generate_brief"
    SEND_REMINDER = "send_reminder"

    # Pipeline Actions
    SEND_PROPOSAL = "send_proposal"
    UPDATE_STATUS = "update_status"

    # Notification Actions
    NOTIFY_OWNER = "notify_owner"
    ESCALATE = "escalate"

    # Sequence Actions
    START_SEQUENCE = "start_sequence"
    ADVANCE_SEQUENCE = "advance_sequence"
    STOP_SEQUENCE = "stop_sequence"

    # Log Actions
    LOG_ACTIVITY = "log_activity"


class Action(BaseModel):
    """
    Action to be executed by orchestrator.

    Example:
        action = Action(
            type=ActionType.SEND_WHATSAPP,
            data={"phone": "+27...", "message": "Hello!"}
        )
    """

    type: ActionType
    data: Dict[str, Any] = Field(default_factory=dict)
    priority: int = 0  # Higher = more urgent
    delay_seconds: int = 0  # Delay before execution
    retry_count: int = 0
    max_retries: int = 3

    class Config:
        use_enum_values = True


class ActionResult(BaseModel):
    """Result of action execution."""

    action_type: ActionType
    success: bool
    data: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    executed_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# ACTION EXECUTOR
# ============================================================================

class ActionExecutor:
    """
    Executes actions requested by agents.

    The executor is the bridge between agent decisions and real-world effects.
    It handles retries, logging, and error recovery.

    Usage:
        executor = ActionExecutor(
            whatsapp_service=whatsapp,
            email_service=email,
            lead_service=leads,
            ...
        )
        result = await executor.execute(action)
    """

    def __init__(
        self,
        whatsapp_service=None,
        email_service=None,
        lead_service=None,
        aleph_client=None,
        owner_notifier=None,
        research_agent=None,
        call_coach=None,
    ):
        """
        Initialize executor with service dependencies.

        Args:
            whatsapp_service: WhatsApp sending service
            email_service: Email sending service
            lead_service: Lead CRUD service
            aleph_client: ALEPH AI client
            owner_notifier: Owner notification service
            research_agent: Research agent instance
            call_coach: Call coach agent instance
        """
        self.whatsapp = whatsapp_service
        self.email = email_service
        self.leads = lead_service
        self.aleph = aleph_client
        self.notifier = owner_notifier
        self.research = research_agent
        self.call_coach = call_coach

        # Action handlers mapping
        self._handlers = {
            ActionType.SEND_WHATSAPP: self._send_whatsapp,
            ActionType.SEND_EMAIL: self._send_email,
            ActionType.CREATE_LEAD: self._create_lead,
            ActionType.UPDATE_LEAD: self._update_lead,
            ActionType.SCORE_LEAD: self._score_lead,
            ActionType.EMBED_LEAD: self._embed_lead,
            ActionType.RUN_RESEARCH: self._run_research,
            ActionType.SCHEDULE_CALL: self._schedule_call,
            ActionType.GENERATE_BRIEF: self._generate_brief,
            ActionType.NOTIFY_OWNER: self._notify_owner,
            ActionType.ESCALATE: self._escalate,
            ActionType.UPDATE_STATUS: self._update_status,
            ActionType.LOG_ACTIVITY: self._log_activity,
            ActionType.START_SEQUENCE: self._start_sequence,
        }

    async def execute(self, action: Action) -> ActionResult:
        """
        Execute an action.

        Args:
            action: Action to execute

        Returns:
            ActionResult with success/failure status
        """
        handler = self._handlers.get(action.type)
        if not handler:
            logger.error(f"No handler for action type: {action.type}")
            return ActionResult(
                action_type=action.type,
                success=False,
                error=f"Unknown action type: {action.type}"
            )

        try:
            result_data = await handler(action.data)
            return ActionResult(
                action_type=action.type,
                success=True,
                data=result_data or {}
            )
        except Exception as e:
            logger.error(f"Action {action.type} failed: {e}")

            # Retry logic
            if action.retry_count < action.max_retries:
                action.retry_count += 1
                logger.info(f"Retrying action {action.type} (attempt {action.retry_count})")
                return await self.execute(action)

            return ActionResult(
                action_type=action.type,
                success=False,
                error=str(e)
            )

    async def execute_batch(self, actions: List[Action]) -> List[ActionResult]:
        """
        Execute multiple actions in sequence.

        Args:
            actions: List of actions to execute

        Returns:
            List of ActionResults
        """
        # Sort by priority (higher first)
        sorted_actions = sorted(actions, key=lambda a: -a.priority)

        results = []
        for action in sorted_actions:
            result = await self.execute(action)
            results.append(result)

        return results

    # =========================================================================
    # ACTION HANDLERS
    # =========================================================================

    async def _send_whatsapp(self, data: dict) -> dict:
        """Send WhatsApp message."""
        if not self.whatsapp:
            raise ValueError("WhatsApp service not configured")

        phone = data.get("phone")
        message = data.get("message")

        if not phone or not message:
            raise ValueError("phone and message required")

        result = await self.whatsapp.send(phone, message)
        return {"sent": True, "phone": phone}

    async def _send_email(self, data: dict) -> dict:
        """Send email."""
        if not self.email:
            raise ValueError("Email service not configured")

        to = data.get("to")
        subject = data.get("subject")
        body = data.get("body")

        if not all([to, subject, body]):
            raise ValueError("to, subject, and body required")

        result = await self.email.send(to, subject, body, html=data.get("html", True))
        return {"sent": True, "to": to}

    async def _create_lead(self, data: dict) -> dict:
        """Create new lead."""
        if not self.leads:
            raise ValueError("Lead service not configured")

        lead = await self.leads.create(data)
        return {"lead_id": lead.id}

    async def _update_lead(self, data: dict) -> dict:
        """Update existing lead."""
        if not self.leads:
            raise ValueError("Lead service not configured")

        lead_id = data.get("lead_id")
        updates = data.get("updates", {})

        if not lead_id:
            raise ValueError("lead_id required")

        lead = await self.leads.update(lead_id, updates)
        return {"lead_id": lead.id, "updated": True}

    async def _score_lead(self, data: dict) -> dict:
        """Recalculate lead score."""
        if not self.leads:
            raise ValueError("Lead service not configured")

        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValueError("lead_id required")

        lead = await self.leads.get(lead_id)
        # Scoring is done in the leads service
        scored_lead = await self.leads.score(lead)
        return {"lead_id": lead_id, "score": scored_lead.score, "tier": scored_lead.tier}

    async def _embed_lead(self, data: dict) -> dict:
        """Embed lead in ALEPH."""
        if not self.aleph:
            raise ValueError("ALEPH client not configured")

        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValueError("lead_id required")

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        vector_id = await self.aleph.embed_lead(lead)
        return {"lead_id": lead_id, "vector_id": vector_id}

    async def _run_research(self, data: dict) -> dict:
        """Run research on lead."""
        if not self.research:
            raise ValueError("Research agent not configured")

        lead_id = data.get("lead_id")
        mode = data.get("mode", "light")

        if not lead_id:
            raise ValueError("lead_id required")

        if mode == "deep":
            result = await self.research.run_deep(lead_id)
        else:
            result = await self.research.run_light(lead_id)

        return {"lead_id": lead_id, "mode": mode, "completed": True}

    async def _schedule_call(self, data: dict) -> dict:
        """Schedule a call."""
        lead_id = data.get("lead_id")
        scheduled_at = data.get("scheduled_at")
        meeting_type = data.get("meeting_type", "discovery")

        # Would integrate with calendar service
        return {
            "lead_id": lead_id,
            "scheduled_at": scheduled_at,
            "meeting_type": meeting_type
        }

    async def _generate_brief(self, data: dict) -> dict:
        """Generate call brief."""
        if not self.call_coach:
            raise ValueError("Call coach not configured")

        lead_id = data.get("lead_id")
        if not lead_id:
            raise ValueError("lead_id required")

        brief = await self.call_coach.generate_brief(lead_id)
        return {"lead_id": lead_id, "brief_generated": True}

    async def _notify_owner(self, data: dict) -> dict:
        """Notify owner (Bakiel)."""
        if not self.notifier:
            raise ValueError("Owner notifier not configured")

        notification_type = data.get("type", "general")
        lead_id = data.get("lead_id")

        if lead_id and self.leads:
            lead = await self.leads.get(lead_id)

            if notification_type == "new_lead":
                await self.notifier.notify_new_lead(lead)
            elif notification_type == "high_value":
                await self.notifier.notify_high_value(lead)
            elif notification_type == "hot_lead":
                await self.notifier.notify_hot_lead(lead)
            elif notification_type == "call_requested":
                await self.notifier.notify_call_requested(lead, data.get("message", ""))

        return {"notified": True, "type": notification_type}

    async def _escalate(self, data: dict) -> dict:
        """Escalate to owner immediately."""
        if not self.notifier:
            raise ValueError("Owner notifier not configured")

        lead_id = data.get("lead_id")
        reason = data.get("reason", "Escalation requested")
        context = data.get("context", "")

        if lead_id and self.leads:
            lead = await self.leads.get(lead_id)
            await self.notifier.notify_escalation(lead, reason, context)

            # Mark lead as escalated
            await self.leads.update(lead_id, {"escalated": True, "escalation_reason": reason})

        return {"escalated": True, "reason": reason}

    async def _update_status(self, data: dict) -> dict:
        """Update lead pipeline status."""
        if not self.leads:
            raise ValueError("Lead service not configured")

        lead_id = data.get("lead_id")
        status = data.get("status")

        if not lead_id or not status:
            raise ValueError("lead_id and status required")

        lead = await self.leads.update(lead_id, {"status": status})
        return {"lead_id": lead_id, "status": status}

    async def _log_activity(self, data: dict) -> dict:
        """Log activity to lead."""
        lead_id = data.get("lead_id")
        activity_type = data.get("activity_type")
        description = data.get("description")

        # Would log to activity table
        logger.info(f"Activity logged for {lead_id}: {activity_type} - {description}")
        return {"logged": True}

    async def _start_sequence(self, data: dict) -> dict:
        """Start follow-up sequence for lead."""
        lead_id = data.get("lead_id")
        sequence_name = data.get("sequence", "no_response")

        # Would start Celery task for sequence
        logger.info(f"Starting sequence '{sequence_name}' for lead {lead_id}")
        return {"lead_id": lead_id, "sequence": sequence_name, "started": True}


# ============================================================================
# ACTION FACTORIES
# ============================================================================

def send_whatsapp_action(phone: str, message: str, priority: int = 0) -> Action:
    """Create send_whatsapp action."""
    return Action(
        type=ActionType.SEND_WHATSAPP,
        data={"phone": phone, "message": message},
        priority=priority
    )


def send_email_action(
    to: str,
    subject: str,
    body: str,
    html: bool = True,
    priority: int = 0
) -> Action:
    """Create send_email action."""
    return Action(
        type=ActionType.SEND_EMAIL,
        data={"to": to, "subject": subject, "body": body, "html": html},
        priority=priority
    )


def notify_owner_action(
    notification_type: str,
    lead_id: str = None,
    message: str = ""
) -> Action:
    """Create notify_owner action."""
    return Action(
        type=ActionType.NOTIFY_OWNER,
        data={"type": notification_type, "lead_id": lead_id, "message": message},
        priority=10  # High priority
    )


def escalate_action(lead_id: str, reason: str, context: str = "") -> Action:
    """Create escalate action."""
    return Action(
        type=ActionType.ESCALATE,
        data={"lead_id": lead_id, "reason": reason, "context": context},
        priority=100  # Highest priority
    )


def update_lead_action(lead_id: str, updates: dict) -> Action:
    """Create update_lead action."""
    return Action(
        type=ActionType.UPDATE_LEAD,
        data={"lead_id": lead_id, "updates": updates}
    )


def run_research_action(lead_id: str, mode: str = "light") -> Action:
    """Create run_research action."""
    return Action(
        type=ActionType.RUN_RESEARCH,
        data={"lead_id": lead_id, "mode": mode}
    )
