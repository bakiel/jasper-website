"""
JASPER Lead Intelligence System - Owner Notification Service
Keeps Bakiel in the loop via Email, WhatsApp, and Telegram.

Notification Triggers:
- New lead created → Email summary
- High-value inquiry (>R100K) → WhatsApp alert
- Call requested → WhatsApp + Email
- Escalation → WhatsApp immediately
- DFI opportunity → Telegram
- Daily digest → Email 6 PM SAST
"""

import os
import httpx
import logging
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum

from models.lead import Lead, LeadTier

logger = logging.getLogger(__name__)


# ============================================================================
# CONFIGURATION
# ============================================================================

OWNER_CONFIG = {
    "name": "Bakiel Nxumalo",
    "email": os.getenv("OWNER_EMAIL", "bakielisrael@gmail.com"),
    "whatsapp": os.getenv("OWNER_WHATSAPP", "+27659387000"),
    "telegram_chat_id": os.getenv("TELEGRAM_CHAT_ID", ""),
}

# Service URLs
WHATSAPP_API = os.getenv("WHATSAPP_API", "http://localhost:3001")
SMTP_CONFIG = {
    "host": os.getenv("SMTP_HOST", "smtp.hostinger.com"),
    "port": int(os.getenv("SMTP_PORT", "465")),
    "user": os.getenv("SMTP_USER", "models@jasperfinance.org"),
    "password": os.getenv("SMTP_PASS", ""),
}
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Thresholds
HIGH_VALUE_THRESHOLD = 100_000  # R100K


# ============================================================================
# NOTIFICATION TYPES
# ============================================================================

class NotificationType(str, Enum):
    """Types of owner notifications"""
    NEW_LEAD = "new_lead"
    HIGH_VALUE = "high_value"
    HOT_LEAD = "hot_lead"
    CALL_REQUESTED = "call_requested"
    ESCALATION = "escalation"
    DFI_OPPORTUNITY = "dfi_opportunity"
    DAILY_DIGEST = "daily_digest"
    PROPOSAL_REQUESTED = "proposal_requested"


# ============================================================================
# NOTIFICATION TEMPLATES
# ============================================================================

TEMPLATES = {
    NotificationType.NEW_LEAD: {
        "whatsapp": """🆕 *New Lead*

*{name}*
{company}
{source}

{project_summary}

Score: {score} {tier_emoji}

Portal: https://portal.jasperfinance.org/leads/{lead_id}""",

        "email_subject": "New Lead: {name} from {company}",
        "email_body": """
<h2>New Lead Received</h2>

<table>
<tr><td><strong>Name:</strong></td><td>{name}</td></tr>
<tr><td><strong>Company:</strong></td><td>{company}</td></tr>
<tr><td><strong>Source:</strong></td><td>{source}</td></tr>
<tr><td><strong>Score:</strong></td><td>{score} ({tier})</td></tr>
</table>

<h3>Project Details</h3>
<p>{project_summary}</p>

<p><a href="https://portal.jasperfinance.org/leads/{lead_id}">View in Portal →</a></p>
"""
    },

    NotificationType.HIGH_VALUE: {
        "whatsapp": """💰 *HIGH VALUE LEAD*

*{name}* - {company}
Deal Size: *R{deal_size:,.0f}*

{project_summary}

DFI Target: {target_dfi}

⚡ Immediate follow-up required

Portal: https://portal.jasperfinance.org/leads/{lead_id}""",

        "email_subject": "⚡ High Value Lead: R{deal_size:,.0f} - {company}",
    },

    NotificationType.HOT_LEAD: {
        "whatsapp": """🔥 *HOT LEAD - Score {score}*

*{name}*
{company}

{qualification_summary}

Recommended: Immediate call

Portal: https://portal.jasperfinance.org/leads/{lead_id}""",
    },

    NotificationType.CALL_REQUESTED: {
        "whatsapp": """📞 *Call Requested*

*{name}* from {company} wants to schedule a call.

Contact: {phone}
Email: {email}

Message: "{message}"

Portal: https://portal.jasperfinance.org/leads/{lead_id}""",

        "email_subject": "Call Request: {name} from {company}",
    },

    NotificationType.ESCALATION: {
        "whatsapp": """⚠️ *ESCALATION REQUIRED*

Lead: *{name}* - {company}
Reason: {reason}

{context}

Immediate attention needed.

Portal: https://portal.jasperfinance.org/leads/{lead_id}""",
    },

    NotificationType.DFI_OPPORTUNITY: {
        "telegram": """🏦 *DFI Opportunity Detected*

*{title}*

Source: {dfi_source}
Relevance: {relevance_score}%

{description}

Deadline: {deadline}

{url}""",
    },

    NotificationType.DAILY_DIGEST: {
        "email_subject": "JASPER Daily Digest - {date}",
        "email_body": """
<h2>Daily Lead Summary</h2>

<h3>Today's Stats</h3>
<table>
<tr><td>New Leads:</td><td>{new_leads}</td></tr>
<tr><td>Hot Leads:</td><td>{hot_leads}</td></tr>
<tr><td>Calls Scheduled:</td><td>{calls_scheduled}</td></tr>
<tr><td>Proposals Sent:</td><td>{proposals_sent}</td></tr>
</table>

<h3>Attention Required</h3>
{attention_list}

<h3>Pipeline Summary</h3>
{pipeline_summary}

<p><a href="https://portal.jasperfinance.org/dashboard">View Dashboard →</a></p>
"""
    },
}


# ============================================================================
# OWNER NOTIFIER SERVICE
# ============================================================================

class OwnerNotifier:
    """
    Service for notifying Bakiel about important events.

    Usage:
        notifier = OwnerNotifier()
        await notifier.notify_new_lead(lead)
        await notifier.notify_escalation(lead, "Customer angry")
    """

    def __init__(
        self,
        whatsapp_api: str = WHATSAPP_API,
        telegram_token: str = TELEGRAM_TOKEN
    ):
        """
        Initialize notifier.

        Args:
            whatsapp_api: WhatsApp gateway URL
            telegram_token: Telegram bot token
        """
        self.whatsapp_api = whatsapp_api
        self.telegram_token = telegram_token
        self._http_client = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None

    # =========================================================================
    # CHANNEL METHODS
    # =========================================================================

    async def send_whatsapp(self, message: str) -> bool:
        """
        Send WhatsApp message to owner.

        Args:
            message: Message text (supports markdown)

        Returns:
            True if sent successfully
        """
        try:
            response = await self.http_client.post(
                f"{self.whatsapp_api}/send",
                json={
                    "phone": OWNER_CONFIG["whatsapp"],
                    "message": message
                }
            )
            response.raise_for_status()
            logger.info(f"WhatsApp sent to owner: {message[:50]}...")
            return True
        except Exception as e:
            logger.error(f"Failed to send WhatsApp: {e}")
            return False

    async def send_email(
        self,
        subject: str,
        body: str,
        html: bool = True
    ) -> bool:
        """
        Send email to owner.

        Args:
            subject: Email subject
            body: Email body (HTML or plain text)
            html: Whether body is HTML

        Returns:
            True if sent successfully
        """
        # Use iMail API if available
        try:
            response = await self.http_client.post(
                "http://localhost:3003/api/imail/send",
                json={
                    "to": OWNER_CONFIG["email"],
                    "subject": subject,
                    "body": body,
                    "html": html
                },
                headers={"X-API-Key": os.getenv("IMAIL_API_KEY", "")}
            )
            response.raise_for_status()
            logger.info(f"Email sent to owner: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_telegram(self, message: str) -> bool:
        """
        Send Telegram message to owner.

        Args:
            message: Message text (supports markdown)

        Returns:
            True if sent successfully
        """
        if not self.telegram_token or not OWNER_CONFIG["telegram_chat_id"]:
            logger.warning("Telegram not configured")
            return False

        try:
            response = await self.http_client.post(
                f"https://api.telegram.org/bot{self.telegram_token}/sendMessage",
                json={
                    "chat_id": OWNER_CONFIG["telegram_chat_id"],
                    "text": message,
                    "parse_mode": "Markdown"
                }
            )
            response.raise_for_status()
            logger.info(f"Telegram sent to owner: {message[:50]}...")
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram: {e}")
            return False

    # =========================================================================
    # NOTIFICATION METHODS
    # =========================================================================

    async def notify_new_lead(self, lead: Lead) -> bool:
        """
        Notify about new lead.

        - All leads: Email summary
        - Hot leads: Also WhatsApp

        Args:
            lead: The new Lead
        """
        template = TEMPLATES[NotificationType.NEW_LEAD]

        # Get tier emoji
        tier_emoji = {"hot": "🔥", "warm": "🌡️", "cold": "❄️"}.get(lead.tier.value, "")

        context = {
            "name": lead.name,
            "company": lead.company or "Unknown company",
            "source": lead.source.value,
            "project_summary": lead.message or "No project details provided",
            "score": lead.score,
            "tier": lead.tier.value,
            "tier_emoji": tier_emoji,
            "lead_id": lead.id,
        }

        # Always email
        await self.send_email(
            subject=template["email_subject"].format(**context),
            body=template["email_body"].format(**context)
        )

        # WhatsApp for hot leads
        if lead.tier == LeadTier.HOT:
            await self.send_whatsapp(template["whatsapp"].format(**context))

        return True

    async def notify_high_value(self, lead: Lead) -> bool:
        """
        Notify about high-value lead (>R100K).

        Sends: WhatsApp + Email

        Args:
            lead: The high-value Lead
        """
        if not lead.deal_size or lead.deal_size < HIGH_VALUE_THRESHOLD:
            return False

        template = TEMPLATES[NotificationType.HIGH_VALUE]
        target_dfi = lead.target_dfis[0] if lead.target_dfis else "Not specified"

        context = {
            "name": lead.name,
            "company": lead.company or "Unknown company",
            "deal_size": lead.deal_size,
            "project_summary": lead.message or "No details",
            "target_dfi": target_dfi,
            "lead_id": lead.id,
        }

        await self.send_whatsapp(template["whatsapp"].format(**context))
        await self.send_email(
            subject=template["email_subject"].format(**context),
            body=TEMPLATES[NotificationType.NEW_LEAD]["email_body"].format(
                **{**context, "source": lead.source.value, "score": lead.score, "tier": "HIGH VALUE"}
            )
        )

        return True

    async def notify_hot_lead(self, lead: Lead) -> bool:
        """
        Notify about hot lead (score 70+).

        Sends: WhatsApp

        Args:
            lead: The hot Lead
        """
        if lead.tier != LeadTier.HOT:
            return False

        template = TEMPLATES[NotificationType.HOT_LEAD]

        qualification_parts = []
        if lead.bant.budget_qualified:
            qualification_parts.append("✅ Budget confirmed")
        if lead.bant.authority_qualified:
            qualification_parts.append("✅ Decision maker")
        if lead.responded:
            qualification_parts.append("✅ Responded")
        if lead.has_call_scheduled:
            qualification_parts.append("✅ Call scheduled")

        context = {
            "name": lead.name,
            "company": lead.company or "Unknown company",
            "score": lead.score,
            "qualification_summary": "\n".join(qualification_parts) or "High engagement",
            "lead_id": lead.id,
        }

        await self.send_whatsapp(template["whatsapp"].format(**context))
        return True

    async def notify_call_requested(
        self,
        lead: Lead,
        message: str = ""
    ) -> bool:
        """
        Notify when lead requests a call.

        Sends: WhatsApp + Email

        Args:
            lead: The Lead
            message: Any message from the lead
        """
        template = TEMPLATES[NotificationType.CALL_REQUESTED]

        context = {
            "name": lead.name,
            "company": lead.company or "Unknown company",
            "phone": lead.phone or "Not provided",
            "email": lead.email or "Not provided",
            "message": message or "No message",
            "lead_id": lead.id,
        }

        await self.send_whatsapp(template["whatsapp"].format(**context))
        await self.send_email(
            subject=template["email_subject"].format(**context),
            body=f"""
<h2>Call Requested</h2>
<p><strong>{lead.name}</strong> from {lead.company} wants to schedule a call.</p>
<p>Phone: {lead.phone or 'Not provided'}</p>
<p>Email: {lead.email or 'Not provided'}</p>
<p>Message: {message or 'No message'}</p>
<p><a href="https://portal.jasperfinance.org/leads/{lead.id}">View in Portal →</a></p>
"""
        )

        return True

    async def notify_escalation(
        self,
        lead: Lead,
        reason: str,
        context: str = ""
    ) -> bool:
        """
        Notify about escalation - URGENT.

        Sends: WhatsApp immediately

        Args:
            lead: The Lead
            reason: Why escalation is needed
            context: Additional context
        """
        template = TEMPLATES[NotificationType.ESCALATION]

        msg_context = {
            "name": lead.name,
            "company": lead.company or "Unknown company",
            "reason": reason,
            "context": context or "No additional context",
            "lead_id": lead.id,
        }

        await self.send_whatsapp(template["whatsapp"].format(**msg_context))
        return True

    async def notify_dfi_opportunity(
        self,
        title: str,
        dfi_source: str,
        description: str,
        relevance_score: float,
        url: str,
        deadline: Optional[datetime] = None
    ) -> bool:
        """
        Notify about DFI opportunity from monitor.

        Sends: Telegram

        Args:
            title: Opportunity title
            dfi_source: DFI name (IFC, AfDB, etc.)
            description: Brief description
            relevance_score: AI relevance score (0-1)
            url: Link to opportunity
            deadline: Application deadline
        """
        template = TEMPLATES[NotificationType.DFI_OPPORTUNITY]

        context = {
            "title": title,
            "dfi_source": dfi_source,
            "description": description[:200] + "..." if len(description) > 200 else description,
            "relevance_score": int(relevance_score * 100),
            "url": url,
            "deadline": deadline.strftime("%d %b %Y") if deadline else "Not specified",
        }

        await self.send_telegram(template["telegram"].format(**context))
        return True

    async def send_daily_digest(
        self,
        stats: dict,
        attention_leads: List[Lead],
        pipeline: dict
    ) -> bool:
        """
        Send daily digest email.

        Args:
            stats: {new_leads, hot_leads, calls_scheduled, proposals_sent}
            attention_leads: Leads needing attention
            pipeline: Pipeline stage counts
        """
        template = TEMPLATES[NotificationType.DAILY_DIGEST]

        # Build attention list HTML
        attention_html = "<ul>"
        for lead in attention_leads[:10]:
            tier_emoji = {"hot": "🔥", "warm": "🌡️", "cold": "❄️"}.get(lead.tier.value, "")
            attention_html += f"""
<li><strong>{lead.name}</strong> - {lead.company}
    ({tier_emoji} Score: {lead.score})
    <a href="https://portal.jasperfinance.org/leads/{lead.id}">View</a>
</li>"""
        attention_html += "</ul>"

        # Build pipeline HTML
        pipeline_html = "<ul>"
        for stage, count in pipeline.items():
            pipeline_html += f"<li>{stage}: {count}</li>"
        pipeline_html += "</ul>"

        context = {
            "date": datetime.now().strftime("%d %B %Y"),
            "new_leads": stats.get("new_leads", 0),
            "hot_leads": stats.get("hot_leads", 0),
            "calls_scheduled": stats.get("calls_scheduled", 0),
            "proposals_sent": stats.get("proposals_sent", 0),
            "attention_list": attention_html or "<p>None</p>",
            "pipeline_summary": pipeline_html,
        }

        await self.send_email(
            subject=template["email_subject"].format(**context),
            body=template["email_body"].format(**context)
        )

        return True
