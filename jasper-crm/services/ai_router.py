"""
JASPER CRM - AI Model Router (DeepSeek Unified)

All tasks now route through DeepSeek model family:
- DeepSeek V3.2 (chat): Classification, qualification, client-facing
- DeepSeek R1: Research, deep analysis, web search
- DeepSeek VL: Vision tasks (business cards, documents)
- DeepSeek Coder: Code generation

Via OpenRouter API.
"""

import os
import httpx
import logging
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)


class AITask(str, Enum):
    """Task types for AI routing - DeepSeek Unified"""
    # V3.2 Tasks (Fast, accurate)
    CLASSIFICATION = "classification"  # Lead scoring, extraction, categorization
    QUALIFICATION = "qualification"    # Lead qualification
    CHAT = "chat"                      # General chat, client-facing
    EMAIL = "email"                    # Email generation

    # R1 Tasks (Reasoning + Search)
    RESEARCH = "research"              # DFI matching, company research
    DEEP_ANALYSIS = "deep_analysis"    # Complex reasoning tasks
    WEB_SEARCH = "web_search"          # Web search + synthesis
    DFI_DISCOVERY = "dfi_discovery"    # Find DFI opportunities

    # Vision Tasks (VL)
    VISION = "vision"                  # Image analysis
    BUSINESS_CARD = "business_card"    # Extract business card info
    DOCUMENT_OCR = "document_ocr"      # Document text extraction

    # Code Tasks
    CODE = "code"                      # Code generation/analysis

    # Legacy (maps to V3.2)
    PRECISION = "precision"
    LONG_FORM = "long_form"
    BUDGET = "budget"
    FALLBACK = "fallback"


class DeepSeekModel(str, Enum):
    """DeepSeek model family"""
    V3 = "deepseek/deepseek-chat"           # V3.2 - Fast chat/classification
    R1 = "deepseek/deepseek-r1"             # R1 - Reasoning + Search
    CODER = "deepseek/deepseek-coder"       # Coder - Code generation
    # VL requires different API handling (see deepseek_router.py)


# DeepSeek Unified Model Routing
MODEL_ROUTING = {
    # V3.2 for fast classification and chat
    AITask.CLASSIFICATION: DeepSeekModel.V3,
    AITask.QUALIFICATION: DeepSeekModel.V3,
    AITask.CHAT: DeepSeekModel.V3,
    AITask.EMAIL: DeepSeekModel.V3,

    # R1 for reasoning and research
    AITask.RESEARCH: DeepSeekModel.R1,
    AITask.DEEP_ANALYSIS: DeepSeekModel.R1,
    AITask.WEB_SEARCH: DeepSeekModel.R1,
    AITask.DFI_DISCOVERY: DeepSeekModel.R1,

    # Coder for code tasks
    AITask.CODE: DeepSeekModel.CODER,

    # Vision tasks route to VL (handled separately)
    AITask.VISION: DeepSeekModel.V3,  # Fallback, use deepseek_router for VL
    AITask.BUSINESS_CARD: DeepSeekModel.V3,
    AITask.DOCUMENT_OCR: DeepSeekModel.V3,

    # Legacy mappings → V3.2
    AITask.PRECISION: DeepSeekModel.V3,
    AITask.LONG_FORM: DeepSeekModel.V3,
    AITask.BUDGET: DeepSeekModel.V3,
    AITask.FALLBACK: DeepSeekModel.V3,
}


class AIRouter:
    """Routes AI tasks to DeepSeek models via OpenRouter"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        logger.info("AIRouter initialized with DeepSeek unified routing")

    async def route(
        self,
        task: AITask,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        enable_search: bool = False,
    ) -> Dict[str, Any]:
        """
        Route a task to the appropriate DeepSeek model

        Args:
            task: The type of AI task
            prompt: The user prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0.0-1.0)
            enable_search: Enable web search for R1 tasks

        Returns:
            Dict with 'content' (response text) and 'model' (model used)
        """
        if not self.api_key:
            logger.error("OPENROUTER_API_KEY not configured")
            return {
                "content": None,
                "model": None,
                "error": "OPENROUTER_API_KEY not configured",
            }

        model = MODEL_ROUTING.get(task, DeepSeekModel.V3)

        # For research tasks, prefer R1 with search enabled
        if task in [AITask.RESEARCH, AITask.WEB_SEARCH, AITask.DFI_DISCOVERY]:
            enable_search = True

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            request_body = {
                "model": model.value if isinstance(model, DeepSeekModel) else model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            # Add search capability for R1
            if enable_search and model == DeepSeekModel.R1:
                request_body["plugins"] = ["web-search"]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://jasperfinance.org",
                        "X-Title": "JASPER CRM",
                    },
                    json=request_body,
                    timeout=60.0,  # Longer timeout for R1 reasoning
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]

                    # Extract reasoning if present (R1 returns thinking + answer)
                    reasoning = None
                    if "<think>" in content and "</think>" in content:
                        reasoning = content.split("<think>")[1].split("</think>")[0]
                        content = content.split("</think>")[-1].strip()

                    return {
                        "content": content,
                        "model": model.value if isinstance(model, DeepSeekModel) else model,
                        "reasoning": reasoning,
                        "usage": data.get("usage"),
                    }
                else:
                    error_text = response.text
                    logger.error(f"OpenRouter API error: {response.status_code} - {error_text}")
                    return {
                        "content": None,
                        "model": model.value if isinstance(model, DeepSeekModel) else model,
                        "error": f"API error: {response.status_code}",
                    }

        except Exception as e:
            logger.error(f"AIRouter error: {e}")
            return {
                "content": None,
                "model": model.value if isinstance(model, DeepSeekModel) else model,
                "error": str(e),
            }

    async def qualify_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Qualify a lead using DeepSeek V3.2 to determine:
        - Qualification score (1-10)
        - Recommended JASPER package
        - Summary of the opportunity
        - Suggested target DFIs
        """
        system_prompt = """You are JASPER's lead qualification assistant powered by DeepSeek. Analyze the lead and provide:

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
   - DBSA, IDC, PIC, AfDB, IFC, OPIC, KfW, etc.

5. Urgency level (low/medium/high) based on funding stage and message tone

Respond in JSON format:
{
    "score": <1-10>,
    "package": "<Foundation|Professional|Enterprise>",
    "summary": "<summary>",
    "target_dfis": ["<dfi1>", "<dfi2>"],
    "estimated_value": <value in ZAR>,
    "urgency": "<low|medium|high>",
    "next_action": "<suggested next step>"
}"""

        prompt = f"""Lead Details:
- Name: {lead_data.get('name')}
- Company: {lead_data.get('company')}
- Sector: {lead_data.get('sector')}
- Funding Stage: {lead_data.get('funding_stage')}
- Funding Amount: {lead_data.get('funding_amount', 'Not specified')}
- Message: {lead_data.get('message', 'No message')}
- Source: {lead_data.get('source')}
- Phone: {lead_data.get('phone', 'Not provided')}
- Email: {lead_data.get('email', 'Not provided')}"""

        result = await self.route(
            task=AITask.QUALIFICATION,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=600,
            temperature=0.3,  # Lower temp for consistent scoring
        )

        if result.get("content"):
            try:
                import json
                content = result["content"]

                # Handle markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                qualification = json.loads(content.strip())

                logger.info(f"Lead qualified: score={qualification.get('score')}, package={qualification.get('package')}")

                return {
                    "success": True,
                    "qualification": qualification,
                    "model": result.get("model"),
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse qualification response: {e}")
                return {
                    "success": False,
                    "error": "Failed to parse AI response",
                    "raw_response": result["content"],
                }

        return {
            "success": False,
            "error": result.get("error", "Unknown error"),
        }

    async def research_company(
        self,
        company_name: str,
        sector: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Research a company using DeepSeek R1 with web search.

        Returns company info, recent news, key people, and DFI relevance.
        """
        system_prompt = """You are JASPER's research assistant. Research this company thoroughly and provide:

1. Company Overview (what they do, size, location)
2. Key People (founders, executives)
3. Recent News or Developments
4. Funding History (if available)
5. DFI Relevance (which DFIs might fund them)

Respond in JSON:
{
    "company_name": "",
    "description": "",
    "industry": "",
    "employees": "",
    "location": "",
    "key_people": [{"name": "", "role": ""}],
    "recent_news": [""],
    "funding_history": "",
    "dfi_relevance": {"score": 1-10, "suitable_dfis": [], "rationale": ""},
    "confidence": "high|medium|low"
}"""

        prompt = f"Research this company: {company_name}"
        if sector:
            prompt += f"\nSector context: {sector}"

        result = await self.route(
            task=AITask.RESEARCH,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=1500,
            temperature=0.5,
            enable_search=True,
        )

        if result.get("content"):
            try:
                import json
                content = result["content"]

                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                research_data = json.loads(content.strip())

                return {
                    "success": True,
                    "company": research_data,
                    "model": result.get("model"),
                    "reasoning": result.get("reasoning"),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse research response",
                    "raw_response": result["content"],
                }

        return {
            "success": False,
            "error": result.get("error", "Unknown error"),
        }

    async def generate_email(
        self,
        lead_data: Dict[str, Any],
        email_type: str = "initial_outreach",
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate professional email using DeepSeek V3.2.

        Args:
            lead_data: Lead information
            email_type: Type of email (initial_outreach, follow_up, proposal_intro)
            context: Additional context
        """
        system_prompt = """You are JASPER's email assistant. Write professional, warm emails that:
- Are concise (under 200 words)
- Reference the lead's specific sector/needs
- Include clear call-to-action
- Maintain professional but approachable tone
- Sign off as the JASPER team

Return JSON:
{
    "subject": "<email subject>",
    "body": "<email body>",
    "cta": "<call to action>"
}"""

        prompt = f"""Write a {email_type} email for:
- Name: {lead_data.get('name')}
- Company: {lead_data.get('company')}
- Sector: {lead_data.get('sector')}
- Their Message: {lead_data.get('message', 'General inquiry')}
{f"Additional Context: {context}" if context else ""}"""

        result = await self.route(
            task=AITask.EMAIL,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=500,
            temperature=0.7,
        )

        if result.get("content"):
            try:
                import json
                content = result["content"]

                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                email_data = json.loads(content.strip())

                return {
                    "success": True,
                    "email": email_data,
                    "model": result.get("model"),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse email response",
                    "raw_response": result["content"],
                }

        return {
            "success": False,
            "error": result.get("error", "Unknown error"),
        }


# Singleton instance
ai_router = AIRouter()
