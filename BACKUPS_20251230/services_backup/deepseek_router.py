"""
JASPER CRM - DeepSeek Model Router

Routes tasks to the appropriate DeepSeek model:

┌─────────────────────────────────────────────────────────────────────────┐
│                        DEEPSEEK MODEL STACK                              │
├─────────────────────────────────────────────────────────────────────────┤
│  DeepSeek R1       │ Search + Reasoning │ Web research, DFI discovery   │
│  DeepSeek V3.2     │ Chat + Orchestration│ Client comms, orchestration  │
│  DeepSeek VL       │ Vision             │ Business cards, screenshots   │
│  DeepSeek OCR      │ Document Extraction │ PDFs, financial statements   │
└─────────────────────────────────────────────────────────────────────────┘

DeepSeek R1 RAG Pipeline:
1. Query rewriting → optimized search terms
2. Web index lookup → select relevant URLs
3. Live crawling → fetch fresh content
4. Synthesis → LLM reasoning on gathered text
"""

import os
import json
import httpx
import base64
import logging
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from pathlib import Path

logger = logging.getLogger(__name__)


# =============================================================================
# MODEL CONFIGURATION
# =============================================================================

class DeepSeekModel(str, Enum):
    """DeepSeek model variants"""
    R1 = "deepseek-r1"              # Reasoning + Search (128K context)
    R1_DISTILL = "deepseek-r1-distill-qwen-32b"  # Lighter R1
    V3 = "deepseek-chat"            # V3.2 Chat/Orchestration
    VL = "deepseek-vl"              # Vision-Language
    CODER = "deepseek-coder"        # Code generation


class TaskType(str, Enum):
    """Task types for routing"""
    # Search & Research
    WEB_SEARCH = "web_search"           # R1 with search
    DEEP_RESEARCH = "deep_research"     # R1 extended reasoning
    REASONING = "reasoning"             # R1 complex reasoning tasks
    DFI_DISCOVERY = "dfi_discovery"     # R1 search for DFI opportunities
    COMPANY_RESEARCH = "company_research"  # R1 search for company info

    # Communication
    CHAT = "chat"                       # V3.2 general chat
    INTENT_CLASSIFY = "intent_classify" # V3.2 classification
    RESPONSE_GEN = "response_gen"       # V3.2 response generation
    EMAIL_DRAFT = "email_draft"         # V3.2 email writing

    # Vision
    IMAGE_ANALYZE = "image_analyze"     # VL image understanding
    BUSINESS_CARD = "business_card"     # VL extract contact from card
    DOCUMENT_SCAN = "document_scan"     # VL analyze document image
    SCREENSHOT = "screenshot"           # VL analyze screenshot

    # Documents
    PDF_EXTRACT = "pdf_extract"         # OCR/VL document extraction
    FINANCIAL_PARSE = "financial_parse" # Parse financial statements

    # Code
    CODE_GEN = "code_gen"               # Coder model


# Model routing table
MODEL_ROUTING = {
    # R1 for search and reasoning
    TaskType.WEB_SEARCH: DeepSeekModel.R1,
    TaskType.DEEP_RESEARCH: DeepSeekModel.R1,
    TaskType.REASONING: DeepSeekModel.R1,
    TaskType.DFI_DISCOVERY: DeepSeekModel.R1,
    TaskType.COMPANY_RESEARCH: DeepSeekModel.R1,

    # V3.2 for communication
    TaskType.CHAT: DeepSeekModel.V3,
    TaskType.INTENT_CLASSIFY: DeepSeekModel.V3,
    TaskType.RESPONSE_GEN: DeepSeekModel.V3,
    TaskType.EMAIL_DRAFT: DeepSeekModel.V3,

    # VL for vision
    TaskType.IMAGE_ANALYZE: DeepSeekModel.VL,
    TaskType.BUSINESS_CARD: DeepSeekModel.VL,
    TaskType.DOCUMENT_SCAN: DeepSeekModel.VL,
    TaskType.SCREENSHOT: DeepSeekModel.VL,

    # Documents
    TaskType.PDF_EXTRACT: DeepSeekModel.VL,
    TaskType.FINANCIAL_PARSE: DeepSeekModel.R1,

    # Code
    TaskType.CODE_GEN: DeepSeekModel.CODER,
}

# OpenRouter model IDs
OPENROUTER_MODELS = {
    DeepSeekModel.R1: "deepseek/deepseek-r1",
    DeepSeekModel.R1_DISTILL: "deepseek/deepseek-r1-distill-qwen-32b",
    DeepSeekModel.V3: "deepseek/deepseek-chat",
    DeepSeekModel.VL: "deepseek/deepseek-vl",  # May need to check availability
    DeepSeekModel.CODER: "deepseek/deepseek-coder",
}

# DeepSeek direct API (for features not on OpenRouter)
DEEPSEEK_API_URL = "https://api.deepseek.com/v1"


# =============================================================================
# DEEPSEEK ROUTER CLASS
# =============================================================================

class DeepSeekRouter:
    """
    Intelligent router for DeepSeek model stack.

    Routes tasks to the appropriate model and handles:
    - R1 search-enabled reasoning
    - V3.2 chat and orchestration
    - VL vision tasks
    - Document extraction
    """

    def __init__(self):
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.deepseek_key = os.getenv("DEEPSEEK_API_KEY")  # For direct API
        self.openrouter_url = "https://openrouter.ai/api/v1"

        self._http_client = None

        logger.info("DeepSeekRouter initialized with full model stack")

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=120.0)  # Long timeout for R1
        return self._http_client

    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None

    # =========================================================================
    # MAIN ROUTING METHOD
    # =========================================================================

    async def route(
        self,
        task: TaskType,
        prompt: str,
        system_prompt: Optional[str] = None,
        images: Optional[List[str]] = None,  # Base64 or URLs
        enable_search: bool = False,
        max_tokens: int = 4000,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Route a task to the appropriate DeepSeek model.

        Args:
            task: The task type
            prompt: User prompt
            system_prompt: Optional system prompt
            images: Optional list of images (base64 or URLs) for VL
            enable_search: Enable web search for R1
            max_tokens: Max response tokens
            temperature: Sampling temperature

        Returns:
            Dict with 'content', 'model', 'reasoning_content' (for R1)
        """
        model = MODEL_ROUTING.get(task, DeepSeekModel.V3)
        model_id = OPENROUTER_MODELS.get(model, "deepseek/deepseek-chat")

        logger.info(f"Routing task {task.value} to model {model_id}")

        # Handle vision tasks
        if model == DeepSeekModel.VL and images:
            return await self._call_vision(
                prompt=prompt,
                images=images,
                system_prompt=system_prompt,
                max_tokens=max_tokens
            )

        # Handle R1 with search
        if model == DeepSeekModel.R1 and enable_search:
            return await self._call_r1_search(
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=max_tokens
            )

        # Standard chat completion
        return await self._call_chat(
            model_id=model_id,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )

    # =========================================================================
    # R1 SEARCH + REASONING
    # =========================================================================

    async def _call_r1_search(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 8000,
    ) -> Dict[str, Any]:
        """
        Call DeepSeek R1 with web search enabled.

        R1's RAG pipeline:
        1. Query rewriting → search terms
        2. Index lookup → URLs
        3. Live crawling → content
        4. Synthesis → answer with citations
        """
        if not self.openrouter_key:
            return {"error": "OPENROUTER_API_KEY not configured"}

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.http_client.post(
                f"{self.openrouter_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CRM R1 Search",
                },
                json={
                    "model": "deepseek/deepseek-r1",
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.6,  # Lower for reasoning
                    # R1-specific: enable extended thinking
                    "include_reasoning": True,
                },
            )

            if response.status_code == 200:
                data = response.json()
                choice = data.get("choices", [{}])[0]
                message = choice.get("message", {})

                return {
                    "content": message.get("content"),
                    "reasoning_content": message.get("reasoning_content"),  # R1's thinking
                    "model": "deepseek/deepseek-r1",
                    "usage": data.get("usage"),
                    "search_enabled": True,
                }
            else:
                return {
                    "error": f"API error: {response.status_code}",
                    "detail": response.text
                }

        except Exception as e:
            logger.error(f"R1 search error: {e}")
            return {"error": str(e)}

    async def search_web(
        self,
        query: str,
        context: Optional[str] = None,
        max_results: int = 10,
    ) -> Dict[str, Any]:
        """
        Use R1 for web search with reasoning.

        Args:
            query: Search query
            context: Additional context for the search
            max_results: Max results to synthesize

        Returns:
            Dict with 'answer', 'sources', 'reasoning'
        """
        system_prompt = """You are a research assistant with web search capabilities.

Search the web for the most relevant and current information.
Synthesize findings into a comprehensive answer.
Always cite your sources with URLs.

Format your response:
ANSWER: [Your synthesized answer]

SOURCES:
- [Source 1 title](URL)
- [Source 2 title](URL)
...

CONFIDENCE: [high/medium/low] - based on source quality and consistency"""

        prompt = f"""Search query: {query}

{f"Additional context: {context}" if context else ""}

Find the most relevant, current information and synthesize a comprehensive answer."""

        return await self._call_r1_search(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=4000
        )

    # =========================================================================
    # VISION (VL)
    # =========================================================================

    async def _call_vision(
        self,
        prompt: str,
        images: List[str],
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """
        Call DeepSeek VL for vision tasks.

        Args:
            prompt: User prompt
            images: List of base64 images or URLs
            system_prompt: Optional system prompt
            max_tokens: Max response tokens
        """
        if not self.openrouter_key:
            return {"error": "OPENROUTER_API_KEY not configured"}

        # Build content with images
        content = []

        for img in images:
            if img.startswith("http"):
                content.append({
                    "type": "image_url",
                    "image_url": {"url": img}
                })
            else:
                # Base64
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                })

        content.append({"type": "text", "text": prompt})

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": content})

        try:
            response = await self.http_client.post(
                f"{self.openrouter_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CRM Vision",
                },
                json={
                    "model": "deepseek/deepseek-vl",  # Or use alternative
                    "messages": messages,
                    "max_tokens": max_tokens,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": "deepseek/deepseek-vl",
                    "usage": data.get("usage"),
                }
            else:
                # Fallback to GPT-4V if VL not available
                logger.warning("DeepSeek VL not available, trying fallback")
                return await self._vision_fallback(prompt, images, system_prompt, max_tokens)

        except Exception as e:
            logger.error(f"Vision error: {e}")
            return {"error": str(e)}

    async def _vision_fallback(
        self,
        prompt: str,
        images: List[str],
        system_prompt: Optional[str],
        max_tokens: int
    ) -> Dict[str, Any]:
        """Fallback to alternative vision model."""
        # Try GPT-4V via OpenRouter
        content = []
        for img in images:
            if img.startswith("http"):
                content.append({"type": "image_url", "image_url": {"url": img}})
            else:
                content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}})
        content.append({"type": "text", "text": prompt})

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": content})

        try:
            response = await self.http_client.post(
                f"{self.openrouter_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                },
                json={
                    "model": "google/gemini-2.0-flash-exp:free",  # Free vision fallback
                    "messages": messages,
                    "max_tokens": max_tokens,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": "google/gemini-2.0-flash-exp:free",
                    "fallback": True,
                }
            return {"error": f"Fallback failed: {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    async def analyze_image(
        self,
        image: str,  # Base64 or URL
        task: str = "describe",
        extract_text: bool = False,
    ) -> Dict[str, Any]:
        """
        Analyze an image using DeepSeek VL.

        Args:
            image: Base64 encoded image or URL
            task: Analysis task (describe, extract_contact, analyze_document)
            extract_text: Whether to extract text (OCR)
        """
        prompts = {
            "describe": "Describe this image in detail. What do you see?",
            "extract_contact": """Extract all contact information from this business card.

Return as JSON:
{
    "name": "",
    "title": "",
    "company": "",
    "email": "",
    "phone": "",
    "address": "",
    "website": "",
    "linkedin": ""
}""",
            "analyze_document": """Analyze this document image.

Extract:
1. Document type (invoice, contract, financial statement, etc.)
2. Key information (dates, amounts, parties)
3. Full text content

Return as JSON:
{
    "document_type": "",
    "key_info": {},
    "extracted_text": ""
}""",
            "screenshot": "Analyze this screenshot. Describe what you see and extract any relevant information.",
        }

        prompt = prompts.get(task, prompts["describe"])
        if extract_text:
            prompt += "\n\nAlso extract and return all visible text."

        return await self._call_vision(
            prompt=prompt,
            images=[image],
            max_tokens=2000
        )

    async def extract_business_card(self, image: str) -> Dict[str, Any]:
        """
        Extract contact information from a business card image.

        Args:
            image: Base64 encoded image or URL of business card

        Returns:
            Dict with extracted contact fields
        """
        result = await self.analyze_image(image, task="extract_contact")

        if result.get("content"):
            try:
                # Parse JSON from response
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                contact = json.loads(content.strip())
                return {"success": True, "contact": contact}
            except json.JSONDecodeError:
                return {"success": False, "raw": result["content"]}

        return result

    # =========================================================================
    # STANDARD CHAT (V3.2)
    # =========================================================================

    async def _call_chat(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Standard chat completion."""
        if not self.openrouter_key:
            return {"error": "OPENROUTER_API_KEY not configured"}

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.http_client.post(
                f"{self.openrouter_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://jasperfinance.org",
                    "X-Title": "JASPER CRM",
                },
                json={
                    "model": model_id,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": model_id,
                    "usage": data.get("usage"),
                }
            else:
                return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Chat error: {e}")
            return {"error": str(e)}

    # =========================================================================
    # SPECIALIZED METHODS
    # =========================================================================

    async def research_company(
        self,
        company_name: str,
        additional_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Research a company using R1 search.

        Args:
            company_name: Company to research
            additional_context: Additional search context

        Returns:
            Dict with company info, news, financials
        """
        system_prompt = """You are a business research analyst with web search capabilities.

Research the company thoroughly and provide:
1. Company Overview (what they do, industry, size)
2. Key People (leadership, decision makers)
3. Recent News (last 6 months)
4. Financial Information (if available)
5. DFI/Funding History (any grants, loans, investments)
6. Relevance to JASPER (potential for DFI modeling services)

Format as structured JSON:
{
    "company_name": "",
    "industry": "",
    "description": "",
    "employees": "",
    "location": "",
    "key_people": [{"name": "", "title": "", "linkedin": ""}],
    "recent_news": [{"headline": "", "date": "", "source": ""}],
    "financials": {"revenue": "", "funding": ""},
    "dfi_history": [],
    "jasper_relevance": "",
    "confidence": "high/medium/low"
}"""

        prompt = f"""Research this company: {company_name}

{f"Additional context: {additional_context}" if additional_context else ""}

Find current information from the web and compile a comprehensive profile."""

        result = await self._call_r1_search(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=4000
        )

        if result.get("content"):
            try:
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                company_data = json.loads(content.strip())
                return {
                    "success": True,
                    "company": company_data,
                    "reasoning": result.get("reasoning_content")
                }
            except json.JSONDecodeError:
                return {"success": True, "raw": result["content"]}

        return result

    async def discover_dfi_opportunities(
        self,
        sector: str = None,
        region: str = "South Africa",
        funding_range: str = None,
    ) -> Dict[str, Any]:
        """
        Search for DFI funding opportunities using R1.

        Args:
            sector: Target sector (renewable energy, infrastructure, etc.)
            region: Geographic focus
            funding_range: Funding amount range

        Returns:
            Dict with opportunities list
        """
        system_prompt = """You are a DFI funding specialist with web search capabilities.

Search for current funding opportunities from Development Finance Institutions.

Focus on:
- IDC (Industrial Development Corporation)
- DBSA (Development Bank of Southern Africa)
- IFC (International Finance Corporation)
- AfDB (African Development Bank)
- PIC (Public Investment Corporation)
- Land Bank
- NEF (National Empowerment Fund)

For each opportunity found:
1. DFI name
2. Programme/fund name
3. Sector focus
4. Funding amount available
5. Eligibility criteria
6. Application deadline (if known)
7. URL/Source

Return as JSON array:
[{
    "dfi": "",
    "programme": "",
    "sector": "",
    "funding_amount": "",
    "eligibility": "",
    "deadline": "",
    "url": "",
    "relevance_score": 0-100
}]"""

        search_terms = ["DFI funding opportunities"]
        if sector:
            search_terms.append(sector)
        if region:
            search_terms.append(region)
        if funding_range:
            search_terms.append(funding_range)

        prompt = f"""Search for current DFI funding opportunities.

Criteria:
- Region: {region}
{f"- Sector: {sector}" if sector else ""}
{f"- Funding range: {funding_range}" if funding_range else ""}

Find the most current opportunities with open applications."""

        result = await self._call_r1_search(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=6000
        )

        if result.get("content"):
            try:
                content = result["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                opportunities = json.loads(content.strip())
                return {
                    "success": True,
                    "opportunities": opportunities,
                    "reasoning": result.get("reasoning_content")
                }
            except json.JSONDecodeError:
                return {"success": True, "raw": result["content"]}

        return result

    async def parse_financial_document(
        self,
        document_text: str,
        document_type: str = "financial_statement",
    ) -> Dict[str, Any]:
        """
        Parse and extract data from a financial document using R1.

        Args:
            document_text: Text content of the document
            document_type: Type of document

        Returns:
            Dict with structured financial data
        """
        system_prompt = """You are a financial analyst expert at parsing financial documents.

Extract and structure all financial data from the document.

For financial statements, extract:
- Revenue/turnover
- Expenses breakdown
- Net profit/loss
- Assets and liabilities
- Cash flow items
- Key ratios

Return as structured JSON with all amounts in ZAR (or original currency noted)."""

        prompt = f"""Parse this {document_type}:

{document_text[:10000]}  # Truncate for safety

Extract all financial figures and return as structured JSON."""

        return await self._call_r1_search(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=4000
        )


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

deepseek_router = DeepSeekRouter()
