"""
JASPER CRM - AI Model Router
Routes tasks to appropriate AI models via OpenRouter
"""

import os
import httpx
from typing import Optional, Dict, Any
from enum import Enum


class AITask(str, Enum):
    """Task types for AI routing - JASPER Audited Strategy"""
    CLASSIFICATION = "classification"  # Lead scoring, extraction, categorization (55-70%)
    PRECISION = "precision"            # Client-facing, code, emails (15%)
    RESEARCH = "research"              # DFI matching, deep analysis (10%)
    LONG_FORM = "long_form"            # Proposals, blogs, reports (15-20%)
    BUDGET = "budget"                  # Ultra-simple tasks (5%)
    FALLBACK = "fallback"              # Free fallback


# Model routing - JASPER Audited Strategy (Bakiel's design)
# Tier 1: Workhorse | Tier 2: Precision | Tier 2.5: Research | Tier 3: Long-form | Budget | Fallback
MODEL_ROUTING = {
    AITask.CLASSIFICATION: "openai/gpt-5-nano",                    # Tier 1: $0.05/$0.40 (55-70%)
    AITask.PRECISION: "openai/gpt-5.1-codex-mini",                 # Tier 2: $0.25/$2.00 (15%)
    AITask.RESEARCH: "moonshotai/kimi-k2",                         # Tier 2.5: $0.45/$2.35 (10%)
    AITask.LONG_FORM: "deepseek/deepseek-chat",                    # Tier 3: $0.27/$0.40 (15-20%)
    AITask.BUDGET: "deepseek/deepseek-r1-distill-qwen-8b",         # Budget: $0.02/$0.10 (5%)
    AITask.FALLBACK: "google/gemini-2.0-flash-exp:free",           # Fallback: FREE
}


class AIRouter:
    """Routes AI tasks to appropriate models via OpenRouter"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"

    async def route(
        self,
        task: AITask,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> Dict[str, Any]:
        """
        Route a task to the appropriate AI model

        Args:
            task: The type of AI task
            prompt: The user prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens in response

        Returns:
            Dict with 'content' (response text) and 'model' (model used)
        """
        if not self.api_key:
            return {
                "content": None,
                "model": None,
                "error": "OPENROUTER_API_KEY not configured",
            }

        model = MODEL_ROUTING.get(task, MODEL_ROUTING[AITask.FALLBACK])

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "content": data["choices"][0]["message"]["content"],
                        "model": model,
                        "usage": data.get("usage"),
                    }
                else:
                    return {
                        "content": None,
                        "model": model,
                        "error": f"API error: {response.status_code}",
                    }

        except Exception as e:
            return {
                "content": None,
                "model": model,
                "error": str(e),
            }

    async def qualify_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Qualify a lead using AI to determine:
        - Qualification score (1-10)
        - Recommended JASPER package
        - Summary of the opportunity
        - Suggested target DFIs
        """
        system_prompt = """You are JASPER's lead qualification assistant. Analyze the lead and provide:
1. Qualification score (1-10) based on:
   - Sector alignment with JASPER's DFI modeling expertise
   - Funding stage maturity
   - Message clarity and project readiness
   - Potential deal size

2. Recommended package:
   - Foundation (R45K-R75K): Early-stage, simple models
   - Professional (R150K-R350K): Growth-stage, complex modeling
   - Enterprise (R450K-R750K): Large infrastructure, multi-model

3. Brief summary (2-3 sentences) of the opportunity

4. Suggested DFIs to target (if applicable):
   - DBSA, IDC, PIC, AfDB, IFC, etc.

Respond in JSON format:
{
    "score": <1-10>,
    "package": "<Foundation|Professional|Enterprise>",
    "summary": "<summary>",
    "target_dfis": ["<dfi1>", "<dfi2>"],
    "estimated_value": <value in ZAR>
}"""

        prompt = f"""Lead Details:
- Name: {lead_data.get('name')}
- Company: {lead_data.get('company')}
- Sector: {lead_data.get('sector')}
- Funding Stage: {lead_data.get('funding_stage')}
- Funding Amount: {lead_data.get('funding_amount', 'Not specified')}
- Message: {lead_data.get('message', 'No message')}
- Source: {lead_data.get('source')}"""

        result = await self.route(
            task=AITask.CLASSIFICATION,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=500,
        )

        if result.get("content"):
            try:
                import json
                # Extract JSON from response
                content = result["content"]
                # Handle markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                qualification = json.loads(content.strip())
                return {
                    "success": True,
                    "qualification": qualification,
                    "model": result.get("model"),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse AI response",
                    "raw_response": result["content"],
                }

        return {
            "success": False,
            "error": result.get("error", "Unknown error"),
        }


# Singleton instance
ai_router = AIRouter()
