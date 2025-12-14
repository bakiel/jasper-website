"""
JASPER Lead Intelligence System - Agentic Brain (DeepSeek V3.2)

This is the AI-powered orchestrator that uses DeepSeek V3.2's function-calling
capabilities to dynamically decide which tools/agents to invoke.

Key Difference from rule-based brain.py:
- brain.py: Hardcoded handler registry (if event X → call handler Y)
- agentic_brain.py: AI decides which tools to call based on context

DeepSeek V3.2 Capabilities Used:
- Function-calling interface (tools)
- 128K+ context window (full lead history)
- "Thinking-with-tools" for complex reasoning
- Agentic planning for multi-step sequences
"""

import os
import json
import httpx
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Callable
from enum import Enum

from orchestrator.events import Event, EventType
from models.lead import Lead, LeadTier, LeadStatus

logger = logging.getLogger(__name__)


# =============================================================================
# TOOL DEFINITIONS
# These are the functions DeepSeek V3.2 can call
# =============================================================================

JASPER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "research_agent_light",
            "description": "Run quick research on a lead - company info, LinkedIn, basic web presence. Takes ~5 seconds. Use for new leads or when basic context is needed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to research"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "research_agent_deep",
            "description": "Run deep research on a lead - financials, news, DFI history, competitive landscape. Takes ~30 seconds. Use before important calls or proposals.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to research"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "comms_generate_response",
            "description": "Generate a response message for a lead based on context and intent. Handles WhatsApp, email, or LinkedIn.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to respond to"
                    },
                    "channel": {
                        "type": "string",
                        "enum": ["whatsapp", "email", "linkedin"],
                        "description": "Communication channel"
                    },
                    "intent": {
                        "type": "string",
                        "enum": ["greeting", "question", "schedule_call", "pricing", "ready_to_buy", "objection", "follow_up"],
                        "description": "Detected intent of inbound message"
                    },
                    "context": {
                        "type": "string",
                        "description": "Additional context for response generation"
                    }
                },
                "required": ["lead_id", "channel"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "comms_send_initial_outreach",
            "description": "Send initial outreach message to a new lead. Personalized based on source and company info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to contact"
                    },
                    "channel": {
                        "type": "string",
                        "enum": ["whatsapp", "email"],
                        "description": "Preferred outreach channel"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "call_coach_generate_brief",
            "description": "Generate a pre-call briefing document with talking points, objection handlers, and key questions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID for the upcoming call"
                    },
                    "call_type": {
                        "type": "string",
                        "enum": ["discovery", "demo", "proposal", "closing"],
                        "description": "Type of call being prepared"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "call_coach_summarize",
            "description": "Summarize a completed call and extract action items, BANT updates, and next steps.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID from the call"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Raw call notes to summarize"
                    },
                    "outcome": {
                        "type": "string",
                        "enum": ["qualified", "not_a_fit", "needs_followup", "proposal"],
                        "description": "Call outcome"
                    }
                },
                "required": ["lead_id", "notes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "score_lead",
            "description": "Score a lead based on engagement, fit, and BANT criteria. Updates tier (hot/warm/cold).",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to score"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "notify_owner",
            "description": "Send notification to lead owner via WhatsApp/Telegram. Use for hot leads, important updates, or urgent actions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to notify about"
                    },
                    "notification_type": {
                        "type": "string",
                        "enum": ["hot_lead", "high_value", "call_requested", "proposal_requested", "escalation", "engagement_spike"],
                        "description": "Type of notification"
                    },
                    "message": {
                        "type": "string",
                        "description": "Custom message to include"
                    }
                },
                "required": ["lead_id", "notification_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "embed_in_aleph",
            "description": "Embed lead data in ALEPH vector database for similarity search and retrieval.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to embed"
                    },
                    "include_research": {
                        "type": "boolean",
                        "description": "Whether to include research findings in embedding"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_blog_post",
            "description": "Generate and optionally publish a blog post. Use for content marketing, SEO, or thought leadership.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Blog post topic or title"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["dfi-insights", "financial-modeling", "infrastructure-finance", "case-studies", "industry-news"],
                        "description": "Blog category"
                    },
                    "seo_keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "SEO keywords to target"
                    },
                    "publish_immediately": {
                        "type": "boolean",
                        "description": "Whether to publish immediately or save as draft"
                    },
                    "lead_id": {
                        "type": "string",
                        "description": "Optional: related lead ID for personalized content"
                    }
                },
                "required": ["topic", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_lead_status",
            "description": "Update lead pipeline status and associated fields.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to update"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
                        "description": "New status"
                    },
                    "tier": {
                        "type": "string",
                        "enum": ["hot", "warm", "cold"],
                        "description": "Lead tier"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Notes about the status change"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "classify_intent",
            "description": "Classify the intent of an inbound message from a lead.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The message content to classify"
                    }
                },
                "required": ["message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_lead_context",
            "description": "Retrieve full context for a lead including history, research, and interactions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID to get context for"
                    }
                },
                "required": ["lead_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_follow_up",
            "description": "Schedule a follow-up action for a lead.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {
                        "type": "string",
                        "description": "The lead ID"
                    },
                    "action": {
                        "type": "string",
                        "description": "The follow-up action to take"
                    },
                    "days_from_now": {
                        "type": "integer",
                        "description": "Days from now to schedule"
                    }
                },
                "required": ["lead_id", "action", "days_from_now"]
            }
        }
    }
]


# =============================================================================
# AGENTIC BRAIN CLASS
# =============================================================================

class AgenticBrain:
    """
    DeepSeek V3.2 powered orchestrator that uses function-calling
    to dynamically decide which tools/agents to invoke.

    Unlike the rule-based JASPEROrchestrator, this brain:
    - Reasons about context before acting
    - Decides tool sequences dynamically
    - Handles edge cases with AI judgment
    - Plans multi-step workflows
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
        scoring_service=None,
        blog_service=None,
    ):
        """Initialize the agentic brain with all dependencies."""
        # Store dependencies
        self.research = research_agent
        self.comms = comms_agent
        self.call_coach = call_coach
        self.leads = lead_service
        self.aleph = aleph_client
        self.notifier = owner_notifier
        self.scoring = scoring_service
        self.blog = blog_service

        # DeepSeek V3.2 via OpenRouter
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = "deepseek/deepseek-chat"  # V3.2
        self.base_url = "https://openrouter.ai/api/v1"

        # Build tool executor mapping
        self._tool_executors = self._build_tool_executors()

        logger.info("JASPER Agentic Brain (DeepSeek V3.2) initialized")

    def _build_tool_executors(self) -> Dict[str, Callable]:
        """Map tool names to their executor methods."""
        return {
            "research_agent_light": self._exec_research_light,
            "research_agent_deep": self._exec_research_deep,
            "comms_generate_response": self._exec_comms_response,
            "comms_send_initial_outreach": self._exec_initial_outreach,
            "call_coach_generate_brief": self._exec_call_brief,
            "call_coach_summarize": self._exec_call_summarize,
            "score_lead": self._exec_score_lead,
            "notify_owner": self._exec_notify_owner,
            "embed_in_aleph": self._exec_embed,
            "create_blog_post": self._exec_create_blog,
            "update_lead_status": self._exec_update_status,
            "classify_intent": self._exec_classify_intent,
            "get_lead_context": self._exec_get_context,
            "schedule_follow_up": self._exec_schedule_followup,
        }

    # =========================================================================
    # MAIN EVENT HANDLER
    # =========================================================================

    async def handle_event(self, event: Event) -> Dict[str, Any]:
        """
        Main entry point for all events.

        Instead of routing to hardcoded handlers, we:
        1. Build context about the event
        2. Ask DeepSeek V3.2 what tools to call
        3. Execute the tools in sequence
        4. Return results
        """
        logger.info(f"[AgenticBrain] Handling event: {event.type} (lead_id={event.lead_id})")

        # 1. Build context
        context = await self._build_event_context(event)

        # 2. Create the prompt for DeepSeek V3.2
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_event_prompt(event, context)

        # 3. Call DeepSeek V3.2 with function-calling
        tool_calls = await self._get_tool_calls(system_prompt, user_prompt)

        if not tool_calls:
            logger.warning(f"[AgenticBrain] No tool calls returned for event {event.type}")
            return {"handled": False, "reason": "No tools called"}

        # 4. Execute tools in sequence
        results = []
        for tool_call in tool_calls:
            tool_name = tool_call.get("function", {}).get("name")
            tool_args = json.loads(tool_call.get("function", {}).get("arguments", "{}"))

            logger.info(f"[AgenticBrain] Executing tool: {tool_name} with args: {tool_args}")

            executor = self._tool_executors.get(tool_name)
            if executor:
                try:
                    result = await executor(**tool_args)
                    results.append({
                        "tool": tool_name,
                        "success": True,
                        "result": result
                    })
                except Exception as e:
                    logger.error(f"[AgenticBrain] Tool {tool_name} failed: {e}")
                    results.append({
                        "tool": tool_name,
                        "success": False,
                        "error": str(e)
                    })
            else:
                logger.warning(f"[AgenticBrain] Unknown tool: {tool_name}")
                results.append({
                    "tool": tool_name,
                    "success": False,
                    "error": "Unknown tool"
                })

        return {
            "handled": True,
            "event_type": event.type,
            "lead_id": event.lead_id,
            "tools_called": len(results),
            "results": results
        }

    # =========================================================================
    # CONTEXT BUILDING
    # =========================================================================

    async def _build_event_context(self, event: Event) -> Dict[str, Any]:
        """Build full context about the event for AI reasoning."""
        context = {
            "event_type": event.type,
            "event_data": event.data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Get lead context if available
        if event.lead_id and self.leads:
            try:
                lead = await self.leads.get(event.lead_id)
                if lead:
                    context["lead"] = {
                        "id": lead.id,
                        "name": lead.name,
                        "company": lead.company,
                        "email": lead.email,
                        "status": lead.status.value if hasattr(lead.status, 'value') else lead.status,
                        "tier": lead.tier.value if hasattr(lead.tier, 'value') else lead.tier,
                        "score": lead.score,
                        "source": lead.source,
                        "deal_size": lead.deal_size,
                        "responded": lead.responded,
                        "total_calls": lead.total_calls,
                        "research_status": lead.research_status,
                        "has_call_scheduled": lead.has_call_scheduled,
                        "requested_proposal": lead.requested_proposal,
                        "owner_notified": lead.owner_notified,
                    }
            except Exception as e:
                logger.error(f"Failed to get lead context: {e}")

        return context

    def _build_system_prompt(self) -> str:
        """Build the system prompt for DeepSeek V3.2."""
        return """You are JASPER's AI brain - the intelligent orchestrator for a DFI-focused CRM system.

Your job is to decide which tools to call when events occur. You have access to:
- Research agents (light/deep) for gathering lead intelligence
- Comms agents for generating responses and outreach
- Call coach for pre-call briefs and post-call summaries
- Scoring service to update lead tiers
- Notification service to alert the human owner
- ALEPH embedding for vector storage
- Blog service for content marketing

DECISION PRINCIPLES:
1. New leads need: light research → scoring → embedding → initial outreach → notify if hot
2. Inbound messages need: intent classification → response generation → status updates
3. Scheduled calls need: deep research → call brief → owner notification
4. Completed calls need: summarization → status update → follow-up scheduling
5. High engagement needs: rescoring → owner notification if tier changed

IMPORTANT RULES:
- Always score leads after any significant update
- Always embed leads after research
- Notify owner for: hot leads, high value (>R100K), call requests, proposals
- Use light research for new leads, deep research before calls
- Consider the lead's current state before deciding actions

Respond with the tools you want to call. The system will execute them in sequence."""

    def _build_event_prompt(self, event: Event, context: Dict[str, Any]) -> str:
        """Build the user prompt describing the event."""
        prompt_parts = [
            f"EVENT: {event.type}",
            f"LEAD_ID: {event.lead_id}",
        ]

        if event.data:
            prompt_parts.append(f"EVENT_DATA: {json.dumps(event.data)}")

        if context.get("lead"):
            prompt_parts.append(f"LEAD_CONTEXT: {json.dumps(context['lead'])}")

        prompt_parts.append("\nWhat tools should I call to handle this event? Consider the lead's current state and what actions make sense.")

        return "\n".join(prompt_parts)

    # =========================================================================
    # DEEPSEEK V3.2 API CALL
    # =========================================================================

    async def _get_tool_calls(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> List[Dict[str, Any]]:
        """Call DeepSeek V3.2 with function-calling to get tool decisions."""
        if not self.api_key:
            logger.error("[AgenticBrain] OPENROUTER_API_KEY not configured")
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM AgenticBrain",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "tools": JASPER_TOOLS,
                        "tool_choice": "auto",
                        "max_tokens": 4000,
                    },
                    timeout=60.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    message = data.get("choices", [{}])[0].get("message", {})
                    tool_calls = message.get("tool_calls", [])

                    logger.info(f"[AgenticBrain] DeepSeek V3.2 returned {len(tool_calls)} tool calls")
                    return tool_calls
                else:
                    logger.error(f"[AgenticBrain] API error: {response.status_code} - {response.text}")
                    return []

        except Exception as e:
            logger.error(f"[AgenticBrain] Failed to call DeepSeek V3.2: {e}")
            return []

    # =========================================================================
    # TOOL EXECUTORS
    # =========================================================================

    async def _exec_research_light(self, lead_id: str) -> Dict[str, Any]:
        """Execute light research on a lead."""
        if not self.research:
            return {"error": "Research agent not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        lead = await self.research.run_light(lead)
        lead.research_status = "light"
        lead.last_researched_at = datetime.utcnow()

        if self.leads:
            await self.leads.update(lead_id, lead.dict())

        return {"status": "completed", "research_type": "light"}

    async def _exec_research_deep(self, lead_id: str) -> Dict[str, Any]:
        """Execute deep research on a lead."""
        if not self.research:
            return {"error": "Research agent not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        lead = await self.research.run_deep(lead)
        lead.research_status = "deep"
        lead.last_researched_at = datetime.utcnow()

        if self.leads:
            await self.leads.update(lead_id, lead.dict())

        return {"status": "completed", "research_type": "deep"}

    async def _exec_comms_response(
        self,
        lead_id: str,
        channel: str,
        intent: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a response for a lead."""
        if not self.comms:
            return {"error": "Comms agent not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        response = await self.comms.generate_response(
            lead=lead,
            message=context or "",
            intent=intent,
            channel=channel
        )

        return {"response_generated": True, "channel": channel}

    async def _exec_initial_outreach(
        self,
        lead_id: str,
        channel: str = "email"
    ) -> Dict[str, Any]:
        """Send initial outreach to a lead."""
        if not self.comms:
            return {"error": "Comms agent not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        await self.comms.initial_outreach(lead)

        lead.status = LeadStatus.CONTACTED
        lead.last_contact_at = datetime.utcnow()

        if self.leads:
            await self.leads.update(lead_id, lead.dict())

        return {"outreach_sent": True, "channel": channel}

    async def _exec_call_brief(
        self,
        lead_id: str,
        call_type: str = "discovery"
    ) -> Dict[str, Any]:
        """Generate a pre-call brief."""
        if not self.call_coach:
            return {"error": "Call coach not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        brief = await self.call_coach.generate_brief(lead)

        return {"brief_generated": True, "call_type": call_type}

    async def _exec_call_summarize(
        self,
        lead_id: str,
        notes: str,
        outcome: Optional[str] = None
    ) -> Dict[str, Any]:
        """Summarize a completed call."""
        if not self.call_coach:
            return {"error": "Call coach not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        summary = await self.call_coach.summarize(lead, {"notes": notes, "outcome": outcome})

        return {"summary_generated": True, "outcome": outcome}

    async def _exec_score_lead(self, lead_id: str) -> Dict[str, Any]:
        """Score a lead."""
        if not self.scoring:
            return {"error": "Scoring service not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        lead = await self.scoring.score_lead(lead)

        if self.leads:
            await self.leads.update(lead_id, lead.dict())

        return {
            "scored": True,
            "score": lead.score,
            "tier": lead.tier.value if hasattr(lead.tier, 'value') else lead.tier
        }

    async def _exec_notify_owner(
        self,
        lead_id: str,
        notification_type: str,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Notify the lead owner."""
        if not self.notifier:
            return {"error": "Notifier not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None

        notification_methods = {
            "hot_lead": self.notifier.notify_hot_lead,
            "high_value": self.notifier.notify_high_value,
            "call_requested": lambda l: self.notifier.notify_call_requested(l, message or "Call requested"),
            "proposal_requested": lambda l: self.notifier.notify_call_requested(l, message or "Proposal requested"),
            "escalation": lambda l: self.notifier.notify_escalation(l, message or "Escalation", ""),
            "engagement_spike": self.notifier.notify_hot_lead,
        }

        method = notification_methods.get(notification_type)
        if method and lead:
            await method(lead)
            lead.owner_notified = True
            if self.leads:
                await self.leads.update(lead_id, {"owner_notified": True})

        return {"notified": True, "type": notification_type}

    async def _exec_embed(
        self,
        lead_id: str,
        include_research: bool = True
    ) -> Dict[str, Any]:
        """Embed lead in ALEPH vector DB."""
        if not self.aleph:
            return {"error": "ALEPH client not configured"}

        lead = await self.leads.get(lead_id) if self.leads else None
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        vector_id = await self.aleph.embed_lead(lead)

        lead.vector_id = vector_id
        lead.embedded_at = datetime.utcnow()

        if self.leads:
            await self.leads.update(lead_id, lead.dict())

        return {"embedded": True, "vector_id": vector_id}

    async def _exec_create_blog(
        self,
        topic: str,
        category: str,
        seo_keywords: Optional[List[str]] = None,
        publish_immediately: bool = False,
        lead_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a blog post."""
        if not self.blog:
            # Fallback: call the blog API directly
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://localhost:3000/api/blog/auto-post",
                        headers={
                            "X-AI-API-Key": os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key"),
                            "Content-Type": "application/json"
                        },
                        json={
                            "title": topic,
                            "category": category,
                            "tags": seo_keywords or [],
                            "publishImmediately": publish_immediately
                        },
                        timeout=30.0
                    )

                    if response.status_code == 200:
                        return {"blog_created": True, "topic": topic}
                    else:
                        return {"error": f"Blog API error: {response.status_code}"}

            except Exception as e:
                return {"error": f"Failed to create blog: {e}"}

        return {"blog_created": True, "topic": topic, "category": category}

    async def _exec_update_status(
        self,
        lead_id: str,
        status: Optional[str] = None,
        tier: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update lead status."""
        if not self.leads:
            return {"error": "Lead service not configured"}

        updates = {}
        if status:
            updates["status"] = status
        if tier:
            updates["tier"] = tier
        if notes:
            updates["status_notes"] = notes

        updates["updated_at"] = datetime.utcnow()

        await self.leads.update(lead_id, updates)

        return {"updated": True, "status": status, "tier": tier}

    async def _exec_classify_intent(self, message: str) -> Dict[str, Any]:
        """Classify message intent."""
        if not self.comms:
            return {"error": "Comms agent not configured"}

        intent = await self.comms.classify_intent(message)

        return {"intent": intent}

    async def _exec_get_context(self, lead_id: str) -> Dict[str, Any]:
        """Get full lead context."""
        if not self.leads:
            return {"error": "Lead service not configured"}

        lead = await self.leads.get(lead_id)
        if not lead:
            return {"error": f"Lead {lead_id} not found"}

        return {"lead": lead.dict() if hasattr(lead, 'dict') else lead}

    async def _exec_schedule_followup(
        self,
        lead_id: str,
        action: str,
        days_from_now: int
    ) -> Dict[str, Any]:
        """Schedule a follow-up action."""
        if not self.leads:
            return {"error": "Lead service not configured"}

        from datetime import timedelta
        follow_up_date = datetime.utcnow() + timedelta(days=days_from_now)

        await self.leads.update(lead_id, {
            "next_action": action,
            "next_action_date": follow_up_date
        })

        return {
            "scheduled": True,
            "action": action,
            "date": follow_up_date.isoformat()
        }


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

def create_agentic_brain(
    research_agent=None,
    comms_agent=None,
    call_coach=None,
    lead_service=None,
    aleph_client=None,
    owner_notifier=None,
    scoring_service=None,
    blog_service=None,
) -> AgenticBrain:
    """Create and configure the Agentic Brain."""
    return AgenticBrain(
        research_agent=research_agent,
        comms_agent=comms_agent,
        call_coach=call_coach,
        lead_service=lead_service,
        aleph_client=aleph_client,
        owner_notifier=owner_notifier,
        scoring_service=scoring_service,
        blog_service=blog_service,
    )
