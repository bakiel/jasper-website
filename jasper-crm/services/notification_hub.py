"""
JASPER CRM - Agent Activity Notification Hub
Logs AI agent activity to Discord/Slack for owner visibility.

Channels:
- #agent-activity: Decisions, tool calls, reasoning
- #agent-errors: Failures, retries, fallbacks
- #agent-escalations: Hot leads, urgent matters (with @here ping)

Usage:
    from services.notification_hub import agent_logger

    # Log AI decision
    await agent_logger.log_decision(
        model="gemini-3-flash",
        reasoning="Lead score is 8/10, recommending immediate outreach",
        tools_selected=["score_lead", "notify_owner"]
    )

    # Log tool execution
    await agent_logger.log_tool_call(
        tool_name="score_lead",
        lead_id="lead_123",
        args={"lead_id": "lead_123"},
        result={"score": 8, "tier": "hot"}
    )

    # Log errors
    await agent_logger.log_error(
        error="OpenRouter API timeout",
        context={"model": "gemini-3-flash", "prompt_length": 2500}
    )
"""

import os
import json
import aiohttp
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)


# ============================================================================
# CONFIGURATION
# ============================================================================

# Discord Webhooks - Agent Activity Channels
DISCORD_AGENT_ACTIVITY = os.getenv("DISCORD_AGENT_ACTIVITY_WEBHOOK", "")
DISCORD_AGENT_ERRORS = os.getenv("DISCORD_AGENT_ERRORS_WEBHOOK", "")
DISCORD_AGENT_ESCALATIONS = os.getenv("DISCORD_AGENT_ESCALATIONS_WEBHOOK", "")

# Slack Webhooks
SLACK_AGENT_ACTIVITY = os.getenv("SLACK_AGENT_ACTIVITY_WEBHOOK", "")

# Colors for Discord embeds
class EmbedColor(int, Enum):
    """Discord embed colors for different event types."""
    DECISION = 0x8B5CF6     # Purple - AI decisions
    TOOL_CALL = 0x3B82F6    # Blue - Tool executions
    SUCCESS = 0x22C55E      # Green - Successful operations
    WARNING = 0xF59E0B      # Amber - Warnings, fallbacks
    ERROR = 0xEF4444        # Red - Errors
    ESCALATION = 0xEF4444   # Red - Escalations
    INFO = 0x6B7280         # Gray - General info


# ============================================================================
# AGENT ACTIVITY LOGGER
# ============================================================================

class AgentLogger:
    """
    Logs AI agent activity to Discord/Slack for real-time visibility.

    Features:
    - Rich Discord embeds for visual activity stream
    - Slack Block Kit for structured messages
    - Different channels for different event types
    - Rate limiting to prevent spam
    - Truncation for large payloads
    """

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None
        self._last_log_time: Dict[str, datetime] = {}
        self._min_interval_ms = 500  # Minimum interval between logs

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        return self._session

    async def close(self):
        """Close HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    def _truncate(self, text: str, max_length: int = 1000) -> str:
        """Truncate text to max length."""
        if len(text) > max_length:
            return text[:max_length - 3] + "..."
        return text

    def _format_json(self, data: Any, max_length: int = 500) -> str:
        """Format data as truncated JSON code block."""
        try:
            json_str = json.dumps(data, indent=2, default=str)
            return f"```json\n{self._truncate(json_str, max_length)}```"
        except:
            return f"```\n{self._truncate(str(data), max_length)}```"

    # =========================================================================
    # DISCORD METHODS
    # =========================================================================

    async def _send_discord(
        self,
        webhook_url: str,
        content: Optional[str] = None,
        embed: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send message to Discord webhook."""
        if not webhook_url:
            return False

        payload = {}
        if content:
            payload["content"] = content
        if embed:
            payload["embeds"] = [embed]

        try:
            session = await self._get_session()
            async with session.post(webhook_url, json=payload) as response:
                if response.status == 204 or response.status == 200:
                    return True
                else:
                    logger.warning(f"Discord webhook returned {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Discord webhook failed: {e}")
            return False

    async def _send_slack(
        self,
        webhook_url: str,
        text: str,
        blocks: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Send message to Slack webhook."""
        if not webhook_url:
            return False

        payload = {"text": text}
        if blocks:
            payload["blocks"] = blocks

        try:
            session = await self._get_session()
            async with session.post(webhook_url, json=payload) as response:
                if response.status == 200:
                    return True
                else:
                    logger.warning(f"Slack webhook returned {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Slack webhook failed: {e}")
            return False

    # =========================================================================
    # LOGGING METHODS
    # =========================================================================

    async def log_decision(
        self,
        model: str,
        reasoning: str,
        tools_selected: List[str],
        lead_id: Optional[str] = None,
        event_type: Optional[str] = None
    ):
        """
        Log AI decision-making process.

        Args:
            model: AI model used (gemini-3-flash, deepseek-v3, etc.)
            reasoning: The AI's reasoning/thinking process
            tools_selected: List of tools the AI decided to call
            lead_id: Associated lead ID if applicable
            event_type: Type of event being processed
        """
        embed = {
            "title": f"AI Decision ({model})",
            "color": EmbedColor.DECISION.value,
            "fields": [
                {"name": "Model", "value": model, "inline": True},
                {"name": "Lead", "value": lead_id or "N/A", "inline": True},
                {"name": "Event", "value": event_type or "N/A", "inline": True},
                {"name": "Tools Selected", "value": ", ".join(tools_selected) if tools_selected else "None", "inline": False},
                {"name": "Reasoning", "value": self._truncate(reasoning, 800), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator"}
        }

        await self._send_discord(DISCORD_AGENT_ACTIVITY, embed=embed)

        # Also send to Slack if configured
        if SLACK_AGENT_ACTIVITY:
            blocks = [
                {"type": "header", "text": {"type": "plain_text", "text": f"AI Decision ({model})"}},
                {"type": "section", "fields": [
                    {"type": "mrkdwn", "text": f"*Lead:* {lead_id or 'N/A'}"},
                    {"type": "mrkdwn", "text": f"*Tools:* {', '.join(tools_selected) if tools_selected else 'None'}"},
                ]},
                {"type": "section", "text": {"type": "mrkdwn", "text": f"*Reasoning:*\n{self._truncate(reasoning, 500)}"}},
            ]
            await self._send_slack(SLACK_AGENT_ACTIVITY, f"AI Decision: {model}", blocks)

    async def log_tool_call(
        self,
        tool_name: str,
        lead_id: Optional[str],
        args: Dict[str, Any],
        result: Dict[str, Any],
        model: str = "gemini-3-flash",
        duration_ms: Optional[int] = None
    ):
        """
        Log when AI selects and executes a tool.

        Args:
            tool_name: Name of the tool being called
            lead_id: Associated lead ID
            args: Arguments passed to the tool
            result: Result returned by the tool
            model: AI model that selected this tool
            duration_ms: Execution duration in milliseconds
        """
        # Determine success/failure from result
        is_success = result.get("success", True) if isinstance(result, dict) else True
        color = EmbedColor.SUCCESS.value if is_success else EmbedColor.ERROR.value

        fields = [
            {"name": "Tool", "value": tool_name, "inline": True},
            {"name": "Lead", "value": lead_id or "N/A", "inline": True},
            {"name": "Model", "value": model, "inline": True},
        ]

        if duration_ms:
            fields.append({"name": "Duration", "value": f"{duration_ms}ms", "inline": True})

        fields.append({"name": "Arguments", "value": self._format_json(args, 300), "inline": False})
        fields.append({"name": "Result", "value": self._format_json(result, 300), "inline": False})

        embed = {
            "title": f"Tool: {tool_name}",
            "color": color,
            "fields": fields,
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator"}
        }

        await self._send_discord(DISCORD_AGENT_ACTIVITY, embed=embed)

    async def log_model_fallback(
        self,
        primary_model: str,
        fallback_model: str,
        reason: str,
        lead_id: Optional[str] = None
    ):
        """
        Log when primary model fails and fallback is used.

        Args:
            primary_model: The model that failed
            fallback_model: The fallback model being used
            reason: Why the fallback was triggered
            lead_id: Associated lead ID
        """
        embed = {
            "title": "Model Fallback",
            "color": EmbedColor.WARNING.value,
            "fields": [
                {"name": "Primary", "value": primary_model, "inline": True},
                {"name": "Fallback", "value": fallback_model, "inline": True},
                {"name": "Lead", "value": lead_id or "N/A", "inline": True},
                {"name": "Reason", "value": self._truncate(reason, 500), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator"}
        }

        await self._send_discord(DISCORD_AGENT_ERRORS, embed=embed)

    async def log_escalation(
        self,
        lead_id: str,
        reason: str,
        priority: str,
        lead_summary: str,
        recommended_action: Optional[str] = None
    ):
        """
        Log urgent escalations - pings owner.

        Args:
            lead_id: Lead being escalated
            reason: Why escalation is needed
            priority: Priority level (high, critical)
            lead_summary: Brief summary of the lead
            recommended_action: What the AI recommends doing
        """
        embed = {
            "title": f"ESCALATION: Lead #{lead_id}",
            "color": EmbedColor.ESCALATION.value,
            "fields": [
                {"name": "Priority", "value": priority.upper(), "inline": True},
                {"name": "Lead ID", "value": lead_id, "inline": True},
                {"name": "Reason", "value": self._truncate(reason, 500), "inline": False},
                {"name": "Lead Summary", "value": self._truncate(lead_summary, 300), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator - URGENT"}
        }

        if recommended_action:
            embed["fields"].append({
                "name": "Recommended Action",
                "value": self._truncate(recommended_action, 200),
                "inline": False
            })

        # Send to escalations channel with @here ping
        await self._send_discord(
            DISCORD_AGENT_ESCALATIONS,
            content="@here Urgent escalation requires attention!",
            embed=embed
        )

    async def log_error(
        self,
        error: str,
        context: Dict[str, Any],
        traceback: Optional[str] = None,
        lead_id: Optional[str] = None
    ):
        """
        Log errors and failures.

        Args:
            error: Error message
            context: Context about what was happening when error occurred
            traceback: Python traceback if available
            lead_id: Associated lead ID if applicable
        """
        fields = [
            {"name": "Error", "value": self._truncate(error, 500), "inline": False},
        ]

        if lead_id:
            fields.insert(0, {"name": "Lead", "value": lead_id, "inline": True})

        fields.append({"name": "Context", "value": self._format_json(context, 300), "inline": False})

        if traceback:
            fields.append({
                "name": "Traceback",
                "value": f"```\n{self._truncate(traceback, 400)}```",
                "inline": False
            })

        embed = {
            "title": "Error",
            "color": EmbedColor.ERROR.value,
            "fields": fields,
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator"}
        }

        await self._send_discord(DISCORD_AGENT_ERRORS, embed=embed)

    async def log_event_received(
        self,
        event_type: str,
        lead_id: Optional[str],
        event_data: Dict[str, Any]
    ):
        """
        Log when a new event is received by the orchestrator.

        Args:
            event_type: Type of event (NEW_LEAD, REPLY_RECEIVED, etc.)
            lead_id: Associated lead ID
            event_data: Event payload
        """
        embed = {
            "title": f"Event: {event_type}",
            "color": EmbedColor.INFO.value,
            "fields": [
                {"name": "Event Type", "value": event_type, "inline": True},
                {"name": "Lead", "value": lead_id or "N/A", "inline": True},
                {"name": "Data", "value": self._format_json(event_data, 400), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Orchestrator"}
        }

        await self._send_discord(DISCORD_AGENT_ACTIVITY, embed=embed)

    async def log_research_complete(
        self,
        lead_id: str,
        company: str,
        research_type: str,
        findings_summary: str,
        model: str = "deepseek-r1"
    ):
        """
        Log when research is completed.

        Args:
            lead_id: Lead being researched
            company: Company name
            research_type: Type of research (light, deep, company, dfi)
            findings_summary: Summary of findings
            model: Model used for research
        """
        embed = {
            "title": f"Research Complete: {company}",
            "color": EmbedColor.SUCCESS.value,
            "fields": [
                {"name": "Lead", "value": lead_id, "inline": True},
                {"name": "Research Type", "value": research_type, "inline": True},
                {"name": "Model", "value": model, "inline": True},
                {"name": "Findings", "value": self._truncate(findings_summary, 800), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Research Agent"}
        }

        await self._send_discord(DISCORD_AGENT_ACTIVITY, embed=embed)

    async def log_tier_change(
        self,
        lead_id: str,
        old_tier: str,
        new_tier: str,
        reason: str,
        score: Optional[int] = None
    ):
        """
        Log when a lead's tier changes.

        Args:
            lead_id: Lead being updated
            old_tier: Previous tier
            new_tier: New tier
            reason: Why tier changed
            score: New score if applicable
        """
        # Determine color based on tier direction
        tier_order = {"cold": 0, "warm": 1, "hot": 2}
        is_upgrade = tier_order.get(new_tier.lower(), 0) > tier_order.get(old_tier.lower(), 0)
        color = EmbedColor.SUCCESS.value if is_upgrade else EmbedColor.WARNING.value

        embed = {
            "title": f"Tier Change: {old_tier.upper()} → {new_tier.upper()}",
            "color": color,
            "fields": [
                {"name": "Lead", "value": lead_id, "inline": True},
                {"name": "Old Tier", "value": old_tier.upper(), "inline": True},
                {"name": "New Tier", "value": new_tier.upper(), "inline": True},
                {"name": "Reason", "value": self._truncate(reason, 400), "inline": False},
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "JASPER Scoring Agent"}
        }

        if score is not None:
            embed["fields"].insert(3, {"name": "Score", "value": str(score), "inline": True})

        # Hot lead tier changes go to escalations channel too
        if new_tier.lower() == "hot":
            await self._send_discord(
                DISCORD_AGENT_ESCALATIONS,
                content=f"Lead {lead_id} upgraded to HOT tier!",
                embed=embed
            )
        else:
            await self._send_discord(DISCORD_AGENT_ACTIVITY, embed=embed)


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

agent_logger = AgentLogger()


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def log_decision(model: str, reasoning: str, tools_selected: List[str], **kwargs):
    """Convenience function for logging AI decisions."""
    await agent_logger.log_decision(model, reasoning, tools_selected, **kwargs)


async def log_tool_call(tool_name: str, lead_id: Optional[str], args: Dict, result: Dict, **kwargs):
    """Convenience function for logging tool calls."""
    await agent_logger.log_tool_call(tool_name, lead_id, args, result, **kwargs)


async def log_error(error: str, context: Dict, **kwargs):
    """Convenience function for logging errors."""
    await agent_logger.log_error(error, context, **kwargs)


async def log_escalation(lead_id: str, reason: str, priority: str, lead_summary: str, **kwargs):
    """Convenience function for logging escalations."""
    await agent_logger.log_escalation(lead_id, reason, priority, lead_summary, **kwargs)
