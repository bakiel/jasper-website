"""
ALEPH AI Infrastructure - Completion Service
OpenRouter API routing for text completions
"""

import httpx
from typing import Dict, Any, Optional, List, AsyncGenerator
import json

from ..config import settings, COMPLETION_MODELS


class CompletionService:
    """
    Text completion service via OpenRouter.

    Model Tiers:
    1. Gemini 2.5 Flash Lite (FREE) - 60% - Classification, scoring
    2. Grok Code Fast-1 ($0.15/$0.60) - 15% - Code, emails
    3. DeepSeek V3.2 ($0.27/$0.40) - 20% - Long-form, proposals
    4. Gemini 2.0 Flash (FREE) - 5% - Fallback
    """

    def __init__(self):
        self.base_url = settings.openrouter_base_url
        self.api_key = settings.openrouter_api_key

    def _get_model_for_task(self, task: str) -> str:
        """Route task to appropriate model."""
        for model_key, config in COMPLETION_MODELS.items():
            if task in config["tasks"]:
                return config["id"]

        # Default to gemini-flash for unknown tasks
        return COMPLETION_MODELS["gemini-flash"]["id"]

    async def complete(
        self,
        prompt: str,
        model: Optional[str] = None,
        task: Optional[str] = None,
        system: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Generate text completion.

        Args:
            prompt: User prompt
            model: Specific model ("gemini", "grok", "deepseek") or None for auto
            task: Task type for auto-routing
            system: System prompt
            max_tokens: Maximum response tokens
            temperature: Sampling temperature

        Returns:
            Completion result with metadata
        """
        # Determine model
        if model:
            model_map = {
                "gemini": COMPLETION_MODELS["gemini-flash-lite"]["id"],
                "grok": COMPLETION_MODELS["grok-code"]["id"],
                "deepseek": COMPLETION_MODELS["deepseek"]["id"],
                "fallback": COMPLETION_MODELS["gemini-flash"]["id"],
            }
            model_id = model_map.get(model, COMPLETION_MODELS["gemini-flash"]["id"])
        elif task:
            model_id = self._get_model_for_task(task)
        else:
            model_id = COMPLETION_MODELS["gemini-flash-lite"]["id"]

        # Build messages
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Make request
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://aleph.kutlwano.holdings",
                        "X-Title": "ALEPH AI Infrastructure",
                    },
                    json={
                        "model": model_id,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    return {
                        "error": f"API error: {response.status_code}",
                        "text": "",
                        "model": model_id,
                    }

                data = response.json()

                # Calculate cost
                usage = data.get("usage", {})
                input_tokens = usage.get("prompt_tokens", 0)
                output_tokens = usage.get("completion_tokens", 0)

                # Find cost per million tokens
                model_config = None
                for config in COMPLETION_MODELS.values():
                    if config["id"] == model_id:
                        model_config = config
                        break

                cost = 0.0
                if model_config:
                    cost = (
                        (input_tokens * model_config["cost_input"] / 1_000_000) +
                        (output_tokens * model_config["cost_output"] / 1_000_000)
                    )

                return {
                    "text": data["choices"][0]["message"]["content"],
                    "model": model_id,
                    "tokens": {
                        "input": input_tokens,
                        "output": output_tokens,
                        "total": input_tokens + output_tokens,
                    },
                    "cost_usd": round(cost, 6),
                }

        except Exception as e:
            return {
                "error": str(e),
                "text": "",
                "model": model_id,
            }

    async def complete_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        task: Optional[str] = None,
        system: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Stream text completion.

        Yields chunks of generated text.
        """
        # Determine model
        if model:
            model_map = {
                "gemini": COMPLETION_MODELS["gemini-flash-lite"]["id"],
                "grok": COMPLETION_MODELS["grok-code"]["id"],
                "deepseek": COMPLETION_MODELS["deepseek"]["id"],
                "fallback": COMPLETION_MODELS["gemini-flash"]["id"],
            }
            model_id = model_map.get(model, COMPLETION_MODELS["gemini-flash"]["id"])
        elif task:
            model_id = self._get_model_for_task(task)
        else:
            model_id = COMPLETION_MODELS["gemini-flash-lite"]["id"]

        # Build messages
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://aleph.kutlwano.holdings",
                        "X-Title": "ALEPH AI Infrastructure",
                    },
                    json={
                        "model": model_id,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "stream": True,
                    },
                    timeout=120.0,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data)
                                content = chunk["choices"][0]["delta"].get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue

        except Exception as e:
            yield f"[Error: {str(e)}]"

    async def classify(
        self,
        text: str,
        categories: List[str],
    ) -> Dict[str, Any]:
        """
        Classify text into categories using Gemini (FREE).

        Args:
            text: Text to classify
            categories: List of possible categories

        Returns:
            Classification result with confidence
        """
        prompt = f"""Classify the following text into one of these categories: {', '.join(categories)}

Text: {text}

Respond with only the category name."""

        result = await self.complete(
            prompt=prompt,
            task="classification",
            max_tokens=50,
            temperature=0.1,
        )

        classified = result.get("text", "").strip()

        return {
            "category": classified if classified in categories else categories[0],
            "raw_response": classified,
            "model": result.get("model"),
            "cost_usd": result.get("cost_usd", 0),
        }

    async def score_lead(
        self,
        lead_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Score a lead for JASPER CRM using Gemini (FREE).

        Args:
            lead_data: Lead information dict

        Returns:
            Score (0-100) with reasoning
        """
        prompt = f"""Score this business lead for DFI financial modeling services (0-100).

Lead Information:
- Company: {lead_data.get('company', 'Unknown')}
- Sector: {lead_data.get('sector', 'Unknown')}
- Funding Needed: {lead_data.get('funding_amount', 'Unknown')}
- Description: {lead_data.get('description', '')}
- Region: {lead_data.get('region', 'Unknown')}

Scoring criteria:
- DFI eligibility (sector alignment): 30 points
- Funding scale (R5M-R500M ideal): 25 points
- Documentation readiness: 20 points
- Urgency/timeline: 15 points
- Communication quality: 10 points

Return JSON: {{"score": number, "reasoning": "brief explanation"}}"""

        result = await self.complete(
            prompt=prompt,
            task="scoring",
            max_tokens=200,
            temperature=0.2,
        )

        try:
            # Try to parse JSON from response
            text = result.get("text", "")
            if "{" in text:
                json_str = text[text.index("{"):text.rindex("}")+1]
                parsed = json.loads(json_str)
                return {
                    "score": parsed.get("score", 50),
                    "reasoning": parsed.get("reasoning", ""),
                    "model": result.get("model"),
                    "cost_usd": result.get("cost_usd", 0),
                }
        except:
            pass

        return {
            "score": 50,
            "reasoning": "Could not parse score",
            "model": result.get("model"),
            "cost_usd": result.get("cost_usd", 0),
        }

    async def generate_proposal_draft(
        self,
        project_brief: str,
        similar_proposals: List[Dict[str, Any]],
        dfi_matches: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate proposal draft using DeepSeek V3.2.

        Args:
            project_brief: Client project description
            similar_proposals: Similar past proposals from RAG
            dfi_matches: Matched DFIs from vector search

        Returns:
            Draft proposal text
        """
        context = ""
        if similar_proposals:
            context += "Reference Proposals:\n"
            for p in similar_proposals[:3]:
                context += f"- {p.get('name', 'Untitled')}: {p.get('summary', '')[:200]}\n"

        if dfi_matches:
            context += "\nMatched DFIs:\n"
            for d in dfi_matches[:5]:
                context += f"- {d.get('name', 'Unknown')}: {d.get('focus', '')}\n"

        prompt = f"""Generate a professional proposal draft for JASPER Financial Architecture.

Project Brief:
{project_brief}

{context}

Structure:
1. Executive Summary (200 words)
2. Project Understanding
3. Proposed Approach
4. DFI Strategy (which DFIs to target and why)
5. Financial Model Scope
6. Timeline and Milestones
7. Investment Required

Maintain professional tone. Use South African English spelling."""

        result = await self.complete(
            prompt=prompt,
            model="deepseek",
            system="You are a senior financial consultant at JASPER Financial Architecture, specializing in DFI engagements. Write in professional but accessible language.",
            max_tokens=3000,
            temperature=0.7,
        )

        return {
            "draft": result.get("text", ""),
            "model": result.get("model"),
            "tokens": result.get("tokens"),
            "cost_usd": result.get("cost_usd", 0),
        }


# Singleton instance
completion_service = CompletionService()
