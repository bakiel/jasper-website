"""
JASPER CRM - Call Coach Service
AI-powered call preparation and summarization.
"""

import os
import httpx
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CallBrief:
    """Pre-call briefing document"""
    lead_name: str
    company: str
    talking_points: list
    questions_to_ask: list
    objection_handlers: dict
    background_context: str
    call_objectives: list


class CallCoachService:
    """
    AI Call Coach for sales call preparation and summarization.
    Uses DeepSeek V3.2 via OpenRouter for intelligent briefings.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = "deepseek/deepseek-chat"
        self.base_url = "https://openrouter.ai/api/v1"
        logger.info("CallCoachService initialized")

    async def generate_brief(self, lead: Dict[str, Any], call_type: str = "discovery") -> Dict[str, Any]:
        """
        Generate a pre-call briefing document.
        
        Args:
            lead: Lead data dictionary
            call_type: Type of call (discovery, demo, proposal, closing)
            
        Returns:
            Briefing document with talking points, questions, and handlers
        """
        if not self.api_key:
            logger.warning("OpenRouter API key not configured")
            return self._generate_fallback_brief(lead, call_type)

        prompt = f"""You are a sales coach preparing a briefing for a call with a potential client.

LEAD INFO:
- Name: {lead.get('name', 'Unknown')}
- Company: {lead.get('company', 'Unknown')}
- Sector: {lead.get('sector', 'Unknown')}
- Funding Stage: {lead.get('funding_stage', 'Unknown')}
- Message/Notes: {lead.get('message', lead.get('notes', 'No notes'))}

CALL TYPE: {call_type}

Generate a comprehensive call briefing in JSON format with:
1. talking_points: List of 3-5 key points to cover
2. questions_to_ask: List of 4-6 discovery questions  
3. objection_handlers: Dict of common objections and responses
4. call_objectives: List of 2-3 specific goals for this call
5. opening_statement: Suggested opening line
6. background_context: Brief summary of what we know

Focus on DFI funding, financial modeling, and infrastructure finance context.
Return ONLY valid JSON, no markdown."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    # Try to parse JSON from response
                    import json
                    try:
                        brief = json.loads(content)
                        brief["lead_id"] = lead.get("id")
                        brief["call_type"] = call_type
                        logger.info(f"Generated call brief for {lead.get('name')}")
                        return {"success": True, "brief": brief}
                    except json.JSONDecodeError:
                        return {"success": True, "brief": {"raw_content": content}}
                else:
                    logger.error(f"OpenRouter error: {response.status_code}")
                    return self._generate_fallback_brief(lead, call_type)
                    
        except Exception as e:
            logger.error(f"Error generating brief: {e}")
            return self._generate_fallback_brief(lead, call_type)

    async def summarize(self, lead: Dict[str, Any], notes: str, outcome: str = "needs_followup") -> Dict[str, Any]:
        """
        Summarize a completed call and extract action items.
        
        Args:
            lead: Lead data dictionary
            notes: Raw call notes
            outcome: Call outcome (qualified, not_a_fit, needs_followup, proposal)
            
        Returns:
            Summary with action items and next steps
        """
        if not self.api_key:
            return self._generate_fallback_summary(lead, notes, outcome)

        prompt = f"""Summarize this sales call and extract actionable insights.

LEAD: {lead.get('name', 'Unknown')} at {lead.get('company', 'Unknown')}
CALL OUTCOME: {outcome}

CALL NOTES:
{notes}

Generate a JSON summary with:
1. executive_summary: 2-3 sentence summary
2. key_insights: List of important things learned
3. action_items: List of specific follow-up tasks with deadlines
4. bant_updates: Any Budget, Authority, Need, Timeline info learned
5. next_steps: Recommended next actions
6. lead_score_change: Suggested change to lead score (-10 to +10)
7. follow_up_date: Suggested follow-up date (days from now)

Return ONLY valid JSON."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    import json
                    try:
                        summary = json.loads(content)
                        summary["lead_id"] = lead.get("id")
                        summary["outcome"] = outcome
                        logger.info(f"Generated call summary for {lead.get('name')}")
                        return {"success": True, "summary": summary}
                    except json.JSONDecodeError:
                        return {"success": True, "summary": {"raw_content": content}}
                else:
                    return self._generate_fallback_summary(lead, notes, outcome)
                    
        except Exception as e:
            logger.error(f"Error summarizing call: {e}")
            return self._generate_fallback_summary(lead, notes, outcome)

    def _generate_fallback_brief(self, lead: Dict[str, Any], call_type: str) -> Dict[str, Any]:
        """Generate a basic brief without AI."""
        return {
            "success": True,
            "brief": {
                "lead_id": lead.get("id"),
                "call_type": call_type,
                "talking_points": [
                    "Introduce JASPER and our DFI funding expertise",
                    "Understand their project and funding needs",
                    "Discuss timeline and budget expectations"
                ],
                "questions_to_ask": [
                    "What stage is your project at?",
                    "Have you approached any DFIs before?",
                    "What's your target funding amount?",
                    "What's your timeline for securing funding?"
                ],
                "objection_handlers": {
                    "too expensive": "Our models typically save 3-6 months in the funding process",
                    "need to think about it": "Happy to schedule a follow-up. What specific questions can I answer?"
                },
                "call_objectives": [
                    "Qualify the lead's funding needs",
                    "Schedule a demo or proposal discussion"
                ]
            }
        }

    def _generate_fallback_summary(self, lead: Dict[str, Any], notes: str, outcome: str) -> Dict[str, Any]:
        """Generate a basic summary without AI."""
        return {
            "success": True,
            "summary": {
                "lead_id": lead.get("id"),
                "outcome": outcome,
                "executive_summary": f"Call completed with {lead.get('name')}. Outcome: {outcome}",
                "action_items": ["Review notes and update CRM", "Schedule follow-up if needed"],
                "next_steps": ["Follow up within 3 days"],
                "raw_notes": notes
            }
        }


# Singleton instance
call_coach = CallCoachService()
