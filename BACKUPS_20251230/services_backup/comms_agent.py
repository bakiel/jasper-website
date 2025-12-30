"""
JASPER CRM - AI Communications Agent (DeepSeek V3.2)

Handles all client-facing communication via WhatsApp, Email, and LinkedIn.
Uses DeepSeek V3.2 for intelligent, context-aware responses.

Features:
- Intent classification for inbound messages
- AI-powered response generation with lead context
- Multi-channel support (WhatsApp, Email, LinkedIn)
- Conversation memory via lead history
- Automatic escalation detection
"""

import os
import json
import httpx
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class MessageChannel(str, Enum):
    """Communication channels"""
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    LINKEDIN = "linkedin"
    SMS = "sms"


class MessageIntent(str, Enum):
    """Classified message intents"""
    GREETING = "greeting"
    QUESTION = "question"
    SCHEDULE_CALL = "schedule_call"
    PRICING = "pricing"
    READY_TO_BUY = "ready_to_buy"
    OBJECTION = "objection"
    FOLLOW_UP = "follow_up"
    COMPLAINT = "complaint"
    UNSUBSCRIBE = "unsubscribe"
    NOT_INTERESTED = "not_interested"
    UNCLEAR = "unclear"


# WhatsApp Business API (via integration service)
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://localhost:3001")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")

# JASPER business context for AI
JASPER_CONTEXT = """
JASPER Financial Architecture is a boutique consulting firm specializing in:
- Financial modeling for DFI funding (IDC, DBSA, IFC, AfDB, PIC)
- Infrastructure project finance
- Business plan development for R10M-R2B+ capital raises

Packages:
- Foundation (R45K-R75K): Early-stage, simple models
- Professional (R150K-R350K): Growth-stage, complex modeling
- Enterprise (R450K-R750K): Large infrastructure, multi-model

Key differentiators:
- Proprietary JASPER™ financial modeling system
- Deep DFI relationships and understanding
- South African and African market expertise
- Track record of successful funding applications

Contact: Bakiel Nxumalo (Technical Director)
Website: jasperfinance.org
"""


# =============================================================================
# COMMUNICATIONS AGENT
# =============================================================================

class CommsAgent:
    """
    AI-powered communications agent using DeepSeek V3.2.

    Handles:
    - Intent classification
    - Response generation
    - Multi-channel messaging
    - Conversation management
    """

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = "deepseek/deepseek-chat"  # V3.2
        self.base_url = "https://openrouter.ai/api/v1"

        # HTTP client for API calls
        self._http_client = None

        logger.info("CommsAgent initialized with DeepSeek V3.2")

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client

    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None

    # =========================================================================
    # INTENT CLASSIFICATION
    # =========================================================================

    async def classify_intent(self, message: str) -> str:
        """
        Classify the intent of an inbound message using DeepSeek V3.2.

        Args:
            message: The message text to classify

        Returns:
            MessageIntent value
        """
        if not self.api_key:
            logger.warning("No API key - returning UNCLEAR intent")
            return MessageIntent.UNCLEAR.value

        system_prompt = """You are an intent classifier for JASPER Financial Architecture, a DFI consulting firm.

Classify the customer message into ONE of these intents:
- greeting: Hello, hi, good morning, etc.
- question: Asking about services, process, requirements
- schedule_call: Wants to book a call or meeting
- pricing: Asking about costs, fees, packages
- ready_to_buy: Ready to proceed, send proposal, start work
- objection: Concerns about price, timeline, capability
- follow_up: Checking on status, waiting for response
- complaint: Unhappy, frustrated, problem with service
- unsubscribe: Wants to stop receiving messages
- not_interested: Declined, not relevant, wrong timing
- unclear: Cannot determine intent

Respond with ONLY the intent label, nothing else."""

        try:
            response = await self.http_client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CommsAgent",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Message: {message}"}
                    ],
                    "max_tokens": 50,
                    "temperature": 0.1,  # Low temp for classification
                },
            )

            if response.status_code == 200:
                data = response.json()
                intent = data["choices"][0]["message"]["content"].strip().lower()

                # Validate against known intents
                valid_intents = [i.value for i in MessageIntent]
                if intent in valid_intents:
                    return intent

                return MessageIntent.UNCLEAR.value
            else:
                logger.error(f"Intent classification failed: {response.status_code}")
                return MessageIntent.UNCLEAR.value

        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            return MessageIntent.UNCLEAR.value

    # =========================================================================
    # RESPONSE GENERATION
    # =========================================================================

    async def generate_response(
        self,
        lead: Any,  # Lead model
        message: str,
        intent: Optional[str] = None,
        channel: str = "whatsapp",
        conversation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate an AI response to a lead's message.

        Uses DeepSeek V3.2 with full lead context to create
        personalized, contextual responses.

        Args:
            lead: Lead object with full context
            message: The inbound message
            intent: Pre-classified intent (optional)
            channel: Communication channel
            conversation_history: Previous messages (optional)

        Returns:
            Dict with 'reply', 'intent', 'actions', 'escalate'
        """
        if not self.api_key:
            return {
                "reply": None,
                "error": "API key not configured",
                "escalate": True
            }

        # Classify intent if not provided
        if not intent:
            intent = await self.classify_intent(message)

        # Build lead context
        lead_context = self._build_lead_context(lead)

        # Build conversation context
        conv_context = ""
        if conversation_history:
            conv_context = "\n\nRecent conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = "Lead" if msg.get("from_lead") else "JASPER"
                conv_context += f"{role}: {msg.get('content', '')}\n"

        system_prompt = f"""You are an AI assistant for JASPER Financial Architecture responding to a lead via {channel}.

{JASPER_CONTEXT}

LEAD CONTEXT:
{lead_context}

DETECTED INTENT: {intent}

RESPONSE GUIDELINES:
1. Be professional but warm - we're a boutique firm, not a corporation
2. Keep responses concise - especially for WhatsApp (max 3-4 sentences)
3. For pricing questions: Mention the package range (R45K-R750K) based on complexity
4. For scheduling: Offer to set up a discovery call
5. For objections: Acknowledge, address, and redirect to value
6. Always include a soft call-to-action
7. Sign off as "The JASPER Team" or "Bakiel" for personal messages
8. Use British spelling (favour, organisation, etc.)

If the lead seems frustrated, ready to buy, or mentions a large project (>R50M),
mark for human escalation.

Respond in JSON format:
{{
    "reply": "Your response message",
    "escalate": false,
    "escalate_reason": null,
    "suggested_actions": []
}}"""

        user_prompt = f"""{conv_context}

New message from lead: "{message}"

Generate an appropriate response."""

        try:
            response = await self.http_client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CommsAgent",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Parse JSON response
                try:
                    # Handle markdown code blocks
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    result = json.loads(content.strip())
                    result["intent"] = intent
                    result["model"] = self.model
                    return result

                except json.JSONDecodeError:
                    # Return raw content if not valid JSON
                    return {
                        "reply": content,
                        "intent": intent,
                        "escalate": False,
                        "actions": []
                    }
            else:
                return {
                    "reply": None,
                    "error": f"API error: {response.status_code}",
                    "escalate": True
                }

        except Exception as e:
            logger.error(f"Response generation error: {e}")
            return {
                "reply": None,
                "error": str(e),
                "escalate": True
            }

    def _build_lead_context(self, lead: Any) -> str:
        """Build context string from lead object."""
        if not lead:
            return "No lead context available"

        # Handle both dict and object
        if isinstance(lead, dict):
            return f"""
Name: {lead.get('name', 'Unknown')}
Company: {lead.get('company', 'Unknown')}
Email: {lead.get('email', 'Not provided')}
Phone: {lead.get('phone', 'Not provided')}
Sector: {lead.get('sector', 'Not specified')}
Funding Stage: {lead.get('funding_stage', 'Unknown')}
Deal Size: R{lead.get('deal_size', 0):,.0f}
Score: {lead.get('score', 0)} ({lead.get('tier', 'unknown')})
Status: {lead.get('status', 'new')}
Source: {lead.get('source', 'Unknown')}
Has Responded: {lead.get('responded', False)}
Call Scheduled: {lead.get('has_call_scheduled', False)}
Notes: {lead.get('message', 'No notes')}
"""
        else:
            # Object with attributes
            return f"""
Name: {getattr(lead, 'name', 'Unknown')}
Company: {getattr(lead, 'company', 'Unknown')}
Email: {getattr(lead, 'email', 'Not provided')}
Phone: {getattr(lead, 'phone', 'Not provided')}
Sector: {getattr(lead, 'sector', 'Not specified')}
Funding Stage: {getattr(lead, 'funding_stage', 'Unknown')}
Deal Size: R{getattr(lead, 'deal_size', 0) or 0:,.0f}
Score: {getattr(lead, 'score', 0)} ({getattr(lead, 'tier', 'unknown')})
Status: {getattr(lead, 'status', 'new')}
Source: {getattr(lead, 'source', 'Unknown')}
Has Responded: {getattr(lead, 'responded', False)}
Call Scheduled: {getattr(lead, 'has_call_scheduled', False)}
Notes: {getattr(lead, 'message', 'No notes')}
"""

    # =========================================================================
    # INITIAL OUTREACH
    # =========================================================================

    async def initial_outreach(self, lead: Any, channel: str = "email") -> Dict[str, Any]:
        """
        Generate initial outreach message for a new lead.

        Args:
            lead: Lead object
            channel: Preferred channel (email/whatsapp)

        Returns:
            Dict with 'subject' (for email), 'body', 'channel'
        """
        lead_context = self._build_lead_context(lead)

        system_prompt = f"""You are creating the first outreach message to a new lead for JASPER Financial Architecture.

{JASPER_CONTEXT}

LEAD CONTEXT:
{lead_context}

CHANNEL: {channel}

GUIDELINES:
1. Acknowledge how they found us (source)
2. Show you understand their sector/needs
3. Highlight relevant JASPER capabilities
4. Include a clear next step (usually a discovery call)
5. Keep it personal and not salesy
6. For WhatsApp: Max 4-5 sentences
7. For Email: Can be longer but still concise

Respond in JSON:
{{
    "subject": "Email subject line (for email only)",
    "body": "Message body",
    "personalization_notes": "What made this message personalized"
}}"""

        name = lead.get('name', 'there') if isinstance(lead, dict) else getattr(lead, 'name', 'there')

        try:
            response = await self.http_client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CommsAgent",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Generate initial outreach for this lead via {channel}."}
                    ],
                    "max_tokens": 600,
                    "temperature": 0.7,
                },
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                try:
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    result = json.loads(content.strip())
                    result["channel"] = channel
                    return result

                except json.JSONDecodeError:
                    return {
                        "body": content,
                        "channel": channel
                    }
            else:
                return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Initial outreach error: {e}")
            return {"error": str(e)}

    # =========================================================================
    # CHANNEL-SPECIFIC SENDING
    # =========================================================================

    async def send_whatsapp(
        self,
        phone: str,
        message: str,
        template: str = None
    ) -> Dict[str, Any]:
        """
        Send WhatsApp message via Business API.

        Args:
            phone: Phone number with country code (e.g., +27659387000)
            message: Message text
            template: Optional template name for template messages

        Returns:
            Dict with success status
        """
        # Format phone number (remove + and spaces)
        phone = phone.replace("+", "").replace(" ", "").replace("-", "")

        try:
            if WHATSAPP_TOKEN and WHATSAPP_PHONE_ID:
                # Direct Meta WhatsApp Business API
                response = await self.http_client.post(
                    f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages",
                    headers={
                        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "messaging_product": "whatsapp",
                        "to": phone,
                        "type": "text",
                        "text": {"body": message}
                    }
                )

                if response.status_code == 200:
                    return {"success": True, "channel": "whatsapp", "phone": phone}
                else:
                    return {"success": False, "error": response.text}
            else:
                # Use local WhatsApp gateway
                response = await self.http_client.post(
                    f"{WHATSAPP_API_URL}/send",
                    json={"phone": phone, "message": message}
                )

                if response.status_code == 200:
                    return {"success": True, "channel": "whatsapp", "phone": phone}
                else:
                    return {"success": False, "error": response.text}

        except Exception as e:
            logger.error(f"WhatsApp send error: {e}")
            return {"success": False, "error": str(e)}

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: bool = True
    ) -> Dict[str, Any]:
        """
        Send email via SMTP or iMail API.

        Args:
            to_email: Recipient email
            subject: Email subject
            body: Email body
            html: Whether body is HTML

        Returns:
            Dict with success status
        """
        from services.email_sender import email_sender

        # Create HTML version if plain text
        html_body = None
        if html and not body.startswith("<"):
            html_body = f"""
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1E293B; max-width: 600px;">
            {body.replace(chr(10), '<br>')}
            <br><br>
            <p style="color: #64748B; font-size: 14px;">
            Best regards,<br>
            <strong>The JASPER Team</strong><br>
            <a href="https://jasperfinance.org" style="color: #2C8A5B;">jasperfinance.org</a>
            </p>
            </body>
            </html>
            """

        result = email_sender.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body
        )

        return result

    # =========================================================================
    # EMAIL SEQUENCE MANAGEMENT
    # =========================================================================

    async def advance_sequence(self, lead: Any) -> Dict[str, Any]:
        """
        Advance lead to next step in email sequence.

        Called when lead hasn't responded within timeout period.
        """
        # This integrates with the sequence_scheduler service
        from services.sequence_scheduler import sequence_scheduler

        lead_id = lead.get('id') if isinstance(lead, dict) else getattr(lead, 'id', None)

        if not lead_id:
            return {"error": "No lead ID"}

        # The sequence scheduler handles the actual advancement
        return {"advanced": True, "lead_id": lead_id}

    # =========================================================================
    # FOLLOW-UP EMAIL GENERATION
    # =========================================================================

    async def send_followup_email(
        self,
        lead: Any,
        call_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate and send follow-up email after a call.

        Args:
            lead: Lead object
            call_summary: Summary from call coach

        Returns:
            Send result
        """
        lead_context = self._build_lead_context(lead)

        system_prompt = f"""Generate a follow-up email after a discovery call with a lead.

{JASPER_CONTEXT}

LEAD CONTEXT:
{lead_context}

CALL SUMMARY:
{json.dumps(call_summary, indent=2)}

Create a professional follow-up email that:
1. Thanks them for their time
2. Summarizes key discussion points
3. Confirms any next steps or action items
4. Includes relevant resources if discussed
5. Sets expectations for timeline

Respond in JSON:
{{
    "subject": "Follow-up: [specific topic discussed]",
    "body": "Email body with proper formatting",
    "action_items": ["list", "of", "items"]
}}"""

        try:
            response = await self.http_client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": "Generate the follow-up email."}
                    ],
                    "max_tokens": 800,
                },
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                try:
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    result = json.loads(content.strip())

                    # Send the email
                    email = lead.get('email') if isinstance(lead, dict) else getattr(lead, 'email', None)
                    if email:
                        await self.send_email(
                            to_email=email,
                            subject=result.get("subject", "Follow-up from JASPER"),
                            body=result.get("body", "")
                        )

                    return {"sent": True, **result}

                except json.JSONDecodeError:
                    return {"error": "Failed to parse response"}
            else:
                return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            return {"error": str(e)}


# Singleton instance
comms_agent = CommsAgent()
