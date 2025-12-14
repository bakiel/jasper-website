"""
JASPER Lead Intelligence System - Orchestrator (Brain)
Central coordinator that handles all events and routes to agents.

Key Principle: Agents NEVER call each other directly.
The orchestrator coordinates everything.

Event Flow:
    EVENT → ORCHESTRATOR → AGENTS (in sequence) → LEAD FILE (updated)
                ↓
         Context passed between agents
                ↓
         Owner notified when needed
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from orchestrator.events import Event, EventType
from orchestrator.actions import Action, ActionType, ActionExecutor, ActionResult
from models.lead import Lead, LeadTier, LeadStatus
from services.scoring import LeadScoringService

logger = logging.getLogger(__name__)


class JASPEROrchestrator:
    """
    Central coordinator - no agent works in isolation.

    The brain receives events, coordinates agents, and ensures
    the Lead File is always up-to-date with full context.

    Usage:
        orchestrator = JASPEROrchestrator(
            research_agent=research,
            comms_agent=comms,
            call_coach=call_coach,
            ...
        )
        await orchestrator.handle_event(event)
    """

    def __init__(
        self,
        # Agents
        research_agent=None,
        comms_agent=None,
        call_coach=None,
        # Services
        lead_service=None,
        aleph_client=None,
        owner_notifier=None,
        scoring_service: LeadScoringService = None,
        # Action Executor
        action_executor: ActionExecutor = None,
    ):
        """
        Initialize orchestrator with all dependencies.

        Args:
            research_agent: Research Agent instance
            comms_agent: Comms Agent instance
            call_coach: Call Coach Agent instance
            lead_service: Lead CRUD service
            aleph_client: ALEPH AI client
            owner_notifier: Owner notification service
            scoring_service: Lead scoring service
            action_executor: Action executor instance
        """
        # Agents
        self.research = research_agent
        self.comms = comms_agent
        self.call_coach = call_coach

        # Services
        self.leads = lead_service
        self.aleph = aleph_client
        self.notifier = owner_notifier
        self.scoring = scoring_service or LeadScoringService(aleph_client)

        # Executor
        self.executor = action_executor or ActionExecutor(
            lead_service=lead_service,
            aleph_client=aleph_client,
            owner_notifier=owner_notifier,
            research_agent=research_agent,
            call_coach=call_coach,
        )

        # Event handlers registry
        self._handlers = {
            EventType.LEAD_CREATED: self._handle_lead_created,
            EventType.MESSAGE_RECEIVED: self._handle_message_received,
            EventType.CALL_SCHEDULED: self._handle_call_scheduled,
            EventType.CALL_COMPLETED: self._handle_call_completed,
            EventType.DFI_OPPORTUNITY: self._handle_dfi_opportunity,
            EventType.ESCALATION: self._handle_escalation,
            EventType.RESEARCH_REQUESTED: self._handle_research_requested,
            EventType.NO_RESPONSE: self._handle_no_response,
            EventType.PROPOSAL_REQUESTED: self._handle_proposal_requested,
            EventType.EMAIL_OPENED: self._handle_email_opened,
            EventType.EMAIL_CLICKED: self._handle_email_clicked,
        }

        logger.info("JASPER Orchestrator initialized")

    # =========================================================================
    # MAIN EVENT HANDLER
    # =========================================================================

    async def handle_event(self, event: Event) -> Dict[str, Any]:
        """
        Main entry point for all events.

        Routes events to appropriate handlers and ensures
        all actions are executed.

        Args:
            event: The event to handle

        Returns:
            Result dict with actions taken
        """
        logger.info(f"Handling event: {event.type} (lead_id={event.lead_id})")

        handler = self._handlers.get(event.type)
        if not handler:
            logger.warning(f"No handler for event type: {event.type}")
            return {"handled": False, "reason": "No handler"}

        try:
            result = await handler(event)
            logger.info(f"Event {event.type} handled successfully")
            return {"handled": True, "result": result}

        except Exception as e:
            logger.error(f"Error handling event {event.type}: {e}")
            # Escalate errors for critical events
            if event.type in [EventType.LEAD_CREATED, EventType.CALL_SCHEDULED]:
                await self._escalate_error(event, str(e))
            return {"handled": False, "error": str(e)}

    # =========================================================================
    # LEAD LIFECYCLE HANDLERS
    # =========================================================================

    async def _handle_lead_created(self, event: Event) -> dict:
        """
        Handle new lead creation.

        Flow:
        1. Research Agent (light mode)
        2. Score lead
        3. Embed in ALEPH
        4. Comms Agent (initial outreach)
        5. Notify owner if hot
        """
        lead_id = event.lead_id
        actions_taken = []

        # Get the lead
        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        # 1. Research Agent (light mode)
        if self.research:
            logger.info(f"Running light research for lead {lead_id}")
            lead = await self.research.run_light(lead)
            lead.research_status = "light"
            lead.last_researched_at = datetime.utcnow()
            actions_taken.append("research_light")

        # 2. Score lead
        lead = await self.scoring.score_lead(lead)
        actions_taken.append(f"scored_{lead.score}")

        # 3. Embed in ALEPH
        if self.aleph:
            vector_id = await self.aleph.embed_lead(lead)
            lead.vector_id = vector_id
            lead.embedded_at = datetime.utcnow()
            actions_taken.append("embedded")

        # 4. Comms Agent (initial outreach)
        if self.comms:
            await self.comms.initial_outreach(lead)
            lead.status = LeadStatus.CONTACTED
            lead.last_contact_at = datetime.utcnow()
            actions_taken.append("outreach_sent")

        # 5. Notify owner if hot
        if lead.tier == LeadTier.HOT and self.notifier:
            await self.notifier.notify_hot_lead(lead)
            lead.owner_notified = True
            actions_taken.append("owner_notified")

        # Check high value
        if lead.deal_size and lead.deal_size > 100_000 and self.notifier:
            await self.notifier.notify_high_value(lead)
            actions_taken.append("high_value_notified")

        # Save updated lead
        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "actions": actions_taken}

    async def _handle_research_requested(self, event: Event) -> dict:
        """Handle manual research request."""
        lead_id = event.lead_id
        mode = event.data.get("mode", "light")

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        if self.research:
            if mode == "deep":
                lead = await self.research.run_deep(lead)
            else:
                lead = await self.research.run_light(lead)

            lead.research_status = mode
            lead.last_researched_at = datetime.utcnow()

        # Rescore after research
        lead = await self.scoring.score_lead(lead)

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "mode": mode, "new_score": lead.score}

    # =========================================================================
    # COMMUNICATION HANDLERS
    # =========================================================================

    async def _handle_message_received(self, event: Event) -> dict:
        """
        Handle inbound message.

        Flow:
        1. Classify intent
        2. Get Lead File context
        3. Generate response with full context
        4. Execute any actions
        5. Update Lead File
        """
        lead_id = event.lead_id
        message_content = event.data.get("content", "")
        channel = event.data.get("channel", "whatsapp")
        actions_taken = []

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        # Mark as responded
        if not lead.responded:
            lead.responded = True
            actions_taken.append("marked_responded")

        # 1. Classify intent
        intent = None
        if self.comms:
            intent = await self.comms.classify_intent(message_content)
            actions_taken.append(f"intent_{intent}")

        # 2. Handle specific intents
        if intent == "schedule_call":
            # Trigger call scheduling flow
            if self.notifier:
                await self.notifier.notify_call_requested(lead, message_content)
            lead.requested_call = True
            actions_taken.append("call_requested_notified")

        elif intent == "pricing":
            lead.asked_about_pricing = True
            actions_taken.append("pricing_interest")

        elif intent == "ready_to_buy":
            lead.requested_proposal = True
            lead.status = LeadStatus.PROPOSAL
            actions_taken.append("proposal_stage")

        # 3. Generate response
        response = None
        if self.comms:
            response = await self.comms.generate_response(
                lead=lead,
                message=message_content,
                intent=intent,
                channel=channel
            )
            actions_taken.append("response_generated")

            # Execute response actions
            if response and response.get("actions"):
                for action in response["actions"]:
                    await self.executor.execute(action)

        # 4. Update lead
        lead.last_contact_at = datetime.utcnow()
        lead.last_contact_channel = channel

        # Rescore
        lead = await self.scoring.score_lead(lead)

        await self._update_lead_file(lead)

        return {
            "lead_id": lead_id,
            "intent": intent,
            "actions": actions_taken,
            "response": response.get("reply") if response else None
        }

    async def _handle_no_response(self, event: Event) -> dict:
        """Handle follow-up trigger when lead hasn't responded."""
        lead_id = event.lead_id

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        if self.comms:
            # Advance to next step in sequence
            await self.comms.advance_sequence(lead)

        return {"lead_id": lead_id, "sequence_advanced": True}

    async def _handle_email_opened(self, event: Event) -> dict:
        """Handle email open tracking."""
        lead_id = event.lead_id

        lead = await self._get_lead_file(lead_id)
        if not lead:
            return {"error": "Lead not found"}

        lead.emails_opened += 1

        # Rescore (engagement signal)
        lead = await self.scoring.score_lead(lead)

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "emails_opened": lead.emails_opened}

    async def _handle_email_clicked(self, event: Event) -> dict:
        """Handle email link click tracking."""
        lead_id = event.lead_id

        lead = await self._get_lead_file(lead_id)
        if not lead:
            return {"error": "Lead not found"}

        lead.emails_clicked += 1

        # Rescore (strong engagement signal)
        lead = await self.scoring.score_lead(lead)

        # Notify owner if tier changed to hot
        if lead.tier == LeadTier.HOT and not lead.owner_notified:
            if self.notifier:
                await self.notifier.notify_hot_lead(lead)
            lead.owner_notified = True

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "emails_clicked": lead.emails_clicked}

    # =========================================================================
    # CALL HANDLERS
    # =========================================================================

    async def _handle_call_scheduled(self, event: Event) -> dict:
        """
        Handle call scheduling.

        Flow:
        1. Research Agent (deep mode)
        2. Generate call brief with all context
        3. Notify owner
        """
        lead_id = event.lead_id
        scheduled_at = event.data.get("scheduled_at")
        actions_taken = []

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        # 1. Research Agent (deep mode)
        if self.research:
            lead = await self.research.run_deep(lead)
            lead.research_status = "deep"
            lead.last_researched_at = datetime.utcnow()
            actions_taken.append("research_deep")

        # 2. Generate call brief
        if self.call_coach:
            brief = await self.call_coach.generate_brief(lead)
            actions_taken.append("brief_generated")

        # 3. Update lead
        lead.has_call_scheduled = True
        if scheduled_at:
            lead.next_call_at = datetime.fromisoformat(scheduled_at) if isinstance(scheduled_at, str) else scheduled_at

        # 4. Notify owner
        if self.notifier:
            await self.notifier.notify_call_requested(lead, f"Call scheduled for {scheduled_at}")
            actions_taken.append("owner_notified")

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "actions": actions_taken}

    async def _handle_call_completed(self, event: Event) -> dict:
        """
        Handle call completion.

        Flow:
        1. Generate summary from notes
        2. Update Lead File
        3. Comms Agent (follow-up email)
        """
        lead_id = event.lead_id
        call_id = event.data.get("call_id")
        outcome = event.data.get("outcome")
        notes = event.data.get("notes", {})
        actions_taken = []

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        # 1. Generate summary
        summary = None
        if self.call_coach:
            summary = await self.call_coach.summarize(lead, notes)
            actions_taken.append("summary_generated")

        # 2. Update lead based on outcome
        lead.has_call_scheduled = False
        lead.total_calls += 1

        if outcome == "qualified":
            lead.status = LeadStatus.QUALIFIED
            # Update BANT from notes
            if notes.get("authority_confirmed"):
                lead.bant.authority_qualified = True
            if notes.get("budget_mentioned"):
                lead.bant.budget_qualified = True
            if notes.get("timeline_discussed"):
                lead.bant.timeline_qualified = True

        elif outcome == "proposal":
            lead.status = LeadStatus.PROPOSAL
            lead.requested_proposal = True

        elif outcome == "not_a_fit":
            lead.status = LeadStatus.LOST

        elif outcome == "needs_followup":
            if notes.get("follow_up_date"):
                lead.next_action_date = datetime.fromisoformat(notes["follow_up_date"])
            if notes.get("follow_up_action"):
                lead.next_action = notes["follow_up_action"]

        # Update deal info from call
        if notes.get("deal_size_discussed"):
            lead.deal_size = notes["deal_size_discussed"]

        # 3. Rescore
        lead = await self.scoring.score_lead(lead)
        actions_taken.append(f"rescored_{lead.score}")

        # 4. Send follow-up email
        if self.comms and summary:
            await self.comms.send_followup_email(lead, summary)
            actions_taken.append("followup_sent")

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "outcome": outcome, "actions": actions_taken}

    # =========================================================================
    # LEAD GEN HANDLERS
    # =========================================================================

    async def _handle_dfi_opportunity(self, event: Event) -> dict:
        """
        Handle DFI opportunity from monitor bot.

        Flow:
        1. Create new lead
        2. Notify owner via Telegram
        3. Trigger lead_created flow
        """
        data = event.data
        actions_taken = []

        # 1. Notify owner first (DFI opps are time-sensitive)
        if self.notifier:
            await self.notifier.notify_dfi_opportunity(
                title=data.get("title", "DFI Opportunity"),
                dfi_source=data.get("dfi_source", "Unknown"),
                description=data.get("description", ""),
                relevance_score=data.get("relevance_score", 0),
                url=data.get("url", ""),
                deadline=data.get("deadline")
            )
            actions_taken.append("telegram_notified")

        # 2. Create lead
        if self.leads:
            lead = await self.leads.create({
                "name": data.get("title", "DFI Opportunity"),
                "company": data.get("dfi_source"),
                "source": "dfi_monitor",
                "source_detail": data.get("url"),
                "project_description": data.get("description"),
                "target_dfi": data.get("dfi_source"),
                "notes": f"Relevance: {data.get('relevance_score', 0):.0%}"
            })
            actions_taken.append(f"lead_created_{lead.id}")

            # 3. Trigger lead_created flow
            from .events import lead_created_event
            new_event = lead_created_event(lead.id, "dfi_monitor")
            await self.handle_event(new_event)

        return {"actions": actions_taken}

    # =========================================================================
    # PIPELINE HANDLERS
    # =========================================================================

    async def _handle_proposal_requested(self, event: Event) -> dict:
        """Handle proposal request."""
        lead_id = event.lead_id

        lead = await self._get_lead_file(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        lead.requested_proposal = True
        lead.status = LeadStatus.PROPOSAL

        # Notify owner
        if self.notifier:
            await self.notifier.notify_call_requested(
                lead,
                "Proposal requested - please prepare and send"
            )

        await self._update_lead_file(lead)

        return {"lead_id": lead_id, "status": "proposal"}

    # =========================================================================
    # ERROR HANDLERS
    # =========================================================================

    async def _handle_escalation(self, event: Event) -> dict:
        """Handle manual escalation."""
        lead_id = event.lead_id
        reason = event.data.get("reason", "Manual escalation")
        context = event.data.get("context", "")

        lead = await self._get_lead_file(lead_id)
        if lead:
            lead.escalated = True
            lead.escalation_reason = reason
            await self._update_lead_file(lead)

        if self.notifier:
            await self.notifier.notify_escalation(lead, reason, context)

        return {"lead_id": lead_id, "escalated": True}

    async def _escalate_error(self, event: Event, error: str):
        """Escalate system errors."""
        if self.notifier:
            await self.notifier.send_whatsapp(
                f"⚠️ *System Error*\n\nEvent: {event.type}\nLead: {event.lead_id}\nError: {error}"
            )

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    async def _get_lead_file(self, lead_id: str) -> Optional[Lead]:
        """Get Lead File by ID."""
        if self.leads:
            return await self.leads.get(lead_id)
        return None

    async def _update_lead_file(self, lead: Lead):
        """Update Lead File."""
        lead.updated_at = datetime.utcnow()
        if self.leads:
            await self.leads.update(lead.id, lead.dict())
