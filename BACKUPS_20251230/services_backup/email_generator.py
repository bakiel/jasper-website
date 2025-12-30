"""
JASPER CRM - AI Email Generator Service
Enhanced with ALEPH AI for RAG-powered personalization
"""

import os
import json
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from models.email_sequence import (
    EmailStepTemplate,
    SequenceType,
    EmailPreviewResponse,
)
from services.aleph_client import aleph


# Tone prompts for AI personalization
TONE_PROMPTS = {
    "professional": "Write in a professional, business-appropriate tone. Be clear, concise, and respectful.",
    "warm": "Write with a warm, friendly tone while maintaining professionalism. Show genuine interest and care.",
    "urgent": "Write with a sense of urgency but without being pushy. Emphasize time-sensitivity appropriately.",
    "friendly": "Write in a casual, friendly manner. Be approachable and personable.",
    "helpful": "Write with a helpful, solution-oriented tone. Focus on providing value.",
    "patient": "Write with patience and understanding. Acknowledge that timing may not be right.",
    "curious": "Write with genuine curiosity about the lead's situation. Ask thoughtful questions.",
    "informative": "Write in an informative, educational tone. Share valuable insights.",
    "understanding": "Write with empathy and understanding. Acknowledge the lead's perspective.",
}


class EmailGenerator:
    """AI-powered email generation with ALEPH RAG enhancement"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        # Use DeepSeek for email generation (cost-effective, good quality)
        self.email_model = "deepseek/deepseek-chat"
        # Use cheaper model for simple personalization
        self.personalization_model = "openai/gpt-5-nano"
        # ALEPH AI client for RAG
        self.aleph = aleph

    async def _get_rag_context(
        self,
        lead_context: Dict[str, Any],
        include_similar_leads: bool = True,
        include_winning_templates: bool = True,
    ) -> Dict[str, Any]:
        """
        Get RAG context from ALEPH AI for enhanced personalization.

        Returns:
            - Similar won leads for social proof
            - Winning templates that worked for similar leads
            - Knowledge base context about the sector/DFI
        """
        rag_context = {
            "similar_leads": [],
            "winning_insights": [],
            "knowledge_context": "",
            "sector_insights": "",
        }

        try:
            # Build lead context string for semantic search
            lead_text = f"""
            Company: {lead_context.get('company', '')}
            Sector: {lead_context.get('sector', '')}
            Funding Stage: {lead_context.get('funding_stage', '')}
            Amount: {lead_context.get('funding_amount', '')}
            Message: {lead_context.get('message', '')}
            """

            # 1. Find similar WON leads for social proof
            if include_similar_leads:
                similar_won = await self.aleph.find_similar_leads(
                    lead_context=lead_text,
                    status_filter="won",
                    top_k=3,
                )

                for lead in similar_won:
                    if lead.get("metadata"):
                        rag_context["similar_leads"].append({
                            "company": lead["metadata"].get("company", ""),
                            "sector": lead["metadata"].get("sector", ""),
                            "deal_value": lead["metadata"].get("deal_value", ""),
                            "similarity": lead.get("score", 0),
                        })

            # 2. Find winning templates
            if include_winning_templates:
                won_leads, template_ids = await self.aleph.find_winning_templates(
                    lead_context=lead_text,
                    top_k=3,
                )

                if won_leads:
                    rag_context["winning_insights"] = [
                        f"Template that converted a {l.get('metadata', {}).get('sector', 'similar')} lead"
                        for l in won_leads[:3]
                    ]

            # 3. Get sector-specific knowledge from knowledge base
            sector = lead_context.get("sector", "")
            if sector:
                rag_result = await self.aleph.rag_query(
                    query=f"Key insights for {sector} sector DFI funding",
                    collections=["jasper_knowledge", "jasper_case_studies"],
                    top_k=3,
                )
                rag_context["sector_insights"] = rag_result.get("context", "")

        except Exception as e:
            # Graceful fallback - continue without RAG if ALEPH unavailable
            rag_context["error"] = str(e)

        return rag_context

    async def generate_email(
        self,
        step_template: EmailStepTemplate,
        lead_context: Dict[str, Any],
        additional_context: Optional[str] = None,
        use_rag: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate a personalized email based on template and lead context.
        Enhanced with ALEPH AI RAG for deeper personalization.

        Args:
            step_template: The email step template with subject/body templates
            lead_context: Lead information for personalization
            additional_context: Optional extra context from user
            use_rag: Whether to use ALEPH AI for RAG enhancement

        Returns:
            Dict with generated subject, body, and metadata
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "OPENROUTER_API_KEY not configured",
            }

        # Get RAG context from ALEPH AI
        rag_context = {}
        if use_rag:
            rag_context = await self._get_rag_context(lead_context)

        # Get tone prompt
        tone_prompt = TONE_PROMPTS.get(step_template.ai_tone, TONE_PROMPTS["professional"])

        # Build enhanced system prompt with RAG context
        system_prompt = f"""You are an AI assistant for JASPER Financial Architecture, a DFI (Development Finance Institution) financial modeling consultancy led by Bakiel Nxumalo.

Your task is to personalize email templates for lead nurturing sequences.

{tone_prompt}

Key JASPER value propositions to incorporate naturally:
- 21+ years of DFI expertise
- Helped secure R100M+ in development financing
- Specializes in infrastructure, agriculture, renewable energy
- Works with major DFIs: DBSA, IDC, IFC, AfDB
- Financial models that "speak the DFI language"
"""

        # Add RAG-enhanced context
        if rag_context.get("similar_leads"):
            system_prompt += "\n\nSIMILAR SUCCESSFUL PROJECTS (for subtle social proof):\n"
            for lead in rag_context["similar_leads"]:
                system_prompt += f"- {lead.get('sector', 'Similar')} company secured funding\n"

        if rag_context.get("sector_insights"):
            system_prompt += f"\n\nSECTOR INSIGHTS:\n{rag_context['sector_insights']}\n"

        if rag_context.get("winning_insights"):
            system_prompt += "\n\nWINNING APPROACHES:\n"
            for insight in rag_context["winning_insights"]:
                system_prompt += f"- {insight}\n"

        system_prompt += """
Guidelines:
- Replace template variables with actual values
- Add sector-specific insights where relevant
- Reference similar success stories subtly if available
- Keep the email concise and scannable
- Include clear call-to-action
- Maintain the author voice (Bakiel Nxumalo)
- Use South African English spelling (realise, favour, etc.)

Respond with JSON format:
{
    "subject": "<personalized subject line>",
    "body": "<personalized email body>",
    "personalization_notes": ["<note about what was personalized>"]
}"""

        # Build user prompt with context
        user_prompt = f"""Personalize this email template for the lead:

TEMPLATE:
Subject: {step_template.subject_template}
Body:
{step_template.body_template}

LEAD CONTEXT:
- Name: {lead_context.get('name', 'there')}
- Company: {lead_context.get('company', 'your company')}
- Sector: {lead_context.get('sector', 'your sector')}
- Funding Stage: {lead_context.get('funding_stage', 'growth')}
- Funding Amount: {lead_context.get('funding_amount', 'undisclosed')}
- Source: {lead_context.get('source', 'referral')}
- Previous Interactions: {lead_context.get('interaction_summary', 'None yet')}
"""

        if step_template.ai_context_prompt:
            user_prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{step_template.ai_context_prompt}"

        if additional_context:
            user_prompt += f"\n\nUSER CONTEXT:\n{additional_context}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM Email Generator",
                    },
                    json={
                        "model": self.email_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "max_tokens": 1500,
                        "temperature": 0.7,  # Slightly creative for personalization
                    },
                    timeout=45.0,
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
                        return {
                            "success": True,
                            "subject": result.get("subject", step_template.subject_template),
                            "body": result.get("body", step_template.body_template),
                            "personalization_notes": result.get("personalization_notes", []),
                            "model": self.email_model,
                            "usage": data.get("usage"),
                            "rag_enhanced": bool(rag_context.get("similar_leads") or rag_context.get("sector_insights")),
                            "similar_leads_used": len(rag_context.get("similar_leads", [])),
                        }
                    except json.JSONDecodeError:
                        # If parsing fails, use raw content
                        return {
                            "success": True,
                            "subject": step_template.subject_template,
                            "body": content,  # Use raw response as body
                            "personalization_notes": ["Fallback: raw AI response used"],
                            "model": self.email_model,
                            "rag_enhanced": False,
                        }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "details": response.text,
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def preview_email(
        self,
        step_template: EmailStepTemplate,
        lead_context: Dict[str, Any],
    ) -> EmailPreviewResponse:
        """Generate a preview of an AI-personalized email"""
        result = await self.generate_email(step_template, lead_context)

        if result.get("success"):
            return EmailPreviewResponse(
                subject=result["subject"],
                body=result["body"],
                ai_model_used=result.get("model", "unknown"),
                personalization_notes=result.get("personalization_notes", []),
            )
        else:
            # Return template as-is with error note
            return EmailPreviewResponse(
                subject=self._simple_replace(step_template.subject_template, lead_context),
                body=self._simple_replace(step_template.body_template, lead_context),
                ai_model_used="template_fallback",
                personalization_notes=[f"AI generation failed: {result.get('error')}"],
            )

    def _simple_replace(self, template: str, context: Dict[str, Any]) -> str:
        """Simple variable replacement without AI"""
        result = template
        replacements = {
            "{name}": context.get("name", "there"),
            "{company}": context.get("company", "your company"),
            "{sector}": context.get("sector", "your sector"),
            "{funding_stage}": context.get("funding_stage", "growth"),
            "{funding_amount}": context.get("funding_amount", "your funding needs"),
        }
        for key, value in replacements.items():
            result = result.replace(key, str(value))
        return result

    async def generate_reply_suggestion(
        self,
        original_email: str,
        lead_reply: str,
        lead_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate a suggested reply when a lead responds to a sequence email.
        Enhanced with ALEPH AI for reply classification.

        Args:
            original_email: The email that was sent
            lead_reply: The lead's reply
            lead_context: Lead information

        Returns:
            Dict with suggested reply and analysis
        """
        # First, classify the reply using ALEPH AI (uses free Gemini)
        classification = await self.aleph.classify_reply(lead_reply)

        system_prompt = """You are JASPER's AI assistant helping craft email replies.

Analyze the lead's reply and generate:
1. A sentiment assessment (positive, neutral, negative, objection)
2. Key points from their reply
3. Suggested response
4. Recommended next action (schedule_call, send_proposal, add_to_nurture, close_lost)

Respond in JSON:
{
    "sentiment": "<sentiment>",
    "key_points": ["<point1>", "<point2>"],
    "suggested_reply": "<email reply>",
    "recommended_action": "<action>",
    "confidence": <0.0-1.0>
}"""

        # Enhance with ALEPH classification
        aleph_context = ""
        if classification.get("intent") != "UNKNOWN":
            aleph_context = f"""
ALEPH AI CLASSIFICATION:
- Intent: {classification.get('intent')}
- Confidence: {classification.get('confidence', 0):.0%}
- Suggested Action: {classification.get('suggested_action', 'N/A')}

Use this classification to guide your response.
"""

        user_prompt = f"""{aleph_context}
ORIGINAL EMAIL SENT:
{original_email}

LEAD'S REPLY:
{lead_reply}

LEAD CONTEXT:
- Name: {lead_context.get('name')}
- Company: {lead_context.get('company')}
- Sector: {lead_context.get('sector')}

Generate a thoughtful reply suggestion."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM Reply Generator",
                    },
                    json={
                        "model": self.email_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "max_tokens": 1000,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]

                    # Parse JSON
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    result = json.loads(content.strip())
                    result["success"] = True
                    result["model"] = self.email_model
                    result["aleph_classification"] = classification
                    return result
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "aleph_classification": classification,
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "aleph_classification": classification,
            }

    async def analyze_email_performance(
        self,
        sequence_stats: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Analyze email sequence performance and suggest improvements.

        Args:
            sequence_stats: Performance metrics for the sequence

        Returns:
            Dict with analysis and recommendations
        """
        system_prompt = """You are an email marketing optimization expert for JASPER Financial Architecture.

Analyze the email sequence performance and provide:
1. Overall assessment
2. Specific issues identified
3. Actionable recommendations
4. A/B test suggestions

Be specific and data-driven in your analysis."""

        user_prompt = f"""EMAIL SEQUENCE PERFORMANCE:
{json.dumps(sequence_stats, indent=2)}

Analyze and provide improvement recommendations."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM Analytics",
                    },
                    json={
                        "model": self.personalization_model,  # Cheaper for analysis
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "max_tokens": 800,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "analysis": data["choices"][0]["message"]["content"],
                        "model": self.personalization_model,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def embed_lead_for_search(
        self,
        lead_id: str,
        lead_context: Dict[str, Any],
    ) -> bool:
        """
        Embed and store lead in Milvus for semantic search.
        Called when a new lead is created or updated.
        """
        lead_text = f"""
        Company: {lead_context.get('company', '')}
        Sector: {lead_context.get('sector', '')}
        Funding Stage: {lead_context.get('funding_stage', '')}
        Amount: {lead_context.get('funding_amount', '')}
        Message: {lead_context.get('message', '')}
        Source: {lead_context.get('source', '')}
        """

        metadata = {
            "lead_id": lead_id,
            "company": lead_context.get("company", ""),
            "sector": lead_context.get("sector", ""),
            "status": lead_context.get("status", "new"),
            "created_at": datetime.utcnow().isoformat(),
        }

        return await self.aleph.ingest(
            text=lead_text,
            collection="jasper_leads",
            doc_id=lead_id,
            metadata=metadata,
        )


# Singleton instance
email_generator = EmailGenerator()
