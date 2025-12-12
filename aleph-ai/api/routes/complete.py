"""
ALEPH AI Infrastructure - Completion Routes
POST /v1/complete - Text completions via OpenRouter
"""

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..models import completion_service
from ..services import task_router

router = APIRouter(prefix="/v1/complete", tags=["Completion"])


class CompleteRequest(BaseModel):
    """Text completion request."""
    prompt: str = Field(..., description="User prompt")
    model: Optional[str] = Field(None, description="gemini, grok, deepseek, or auto")
    task: Optional[str] = Field(None, description="Task type for auto-routing")
    system: Optional[str] = Field(None, description="System prompt")
    max_tokens: int = Field(1000, description="Maximum response tokens")
    temperature: float = Field(0.7, description="Sampling temperature", ge=0.0, le=2.0)


class CompleteResponse(BaseModel):
    """Completion response."""
    text: str
    model: str
    tokens: Dict[str, int]
    cost_usd: float


class ClassifyRequest(BaseModel):
    """Text classification request."""
    text: str = Field(..., description="Text to classify")
    categories: List[str] = Field(..., description="Possible categories")


class ClassifyResponse(BaseModel):
    """Classification response."""
    category: str
    raw_response: str
    model: str
    cost_usd: float


class ScoreLeadRequest(BaseModel):
    """Lead scoring request for JASPER CRM."""
    company: Optional[str] = None
    sector: Optional[str] = None
    funding_amount: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None


class ScoreLeadResponse(BaseModel):
    """Lead scoring response."""
    score: int = Field(..., ge=0, le=100)
    reasoning: str
    model: str
    cost_usd: float


@router.post("", response_model=CompleteResponse)
async def generate_completion(
    request: CompleteRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate text completion via OpenRouter.

    Model Routing:
    - gemini: FREE - Classification, scoring
    - grok: $0.15 - Code, emails
    - deepseek: $0.27 - Long-form, proposals
    - auto: Routes based on task type
    """
    try:
        result = await completion_service.complete(
            prompt=request.prompt,
            model=request.model,
            task=request.task,
            system=request.system,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return CompleteResponse(
            text=result["text"],
            model=result["model"],
            tokens=result.get("tokens", {"input": 0, "output": 0, "total": 0}),
            cost_usd=result.get("cost_usd", 0),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_completion(
    request: CompleteRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Stream text completion via OpenRouter.

    Returns server-sent events with text chunks.
    """
    async def generate():
        async for chunk in completion_service.complete_stream(
            prompt=request.prompt,
            model=request.model,
            task=request.task,
            system=request.system,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@router.post("/classify", response_model=ClassifyResponse)
async def classify_text(
    request: ClassifyRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Classify text into categories using Gemini (FREE).

    Perfect for:
    - Email categorization
    - Lead qualification
    - Sentiment analysis
    - Content tagging
    """
    try:
        result = await completion_service.classify(
            text=request.text,
            categories=request.categories,
        )

        return ClassifyResponse(
            category=result["category"],
            raw_response=result["raw_response"],
            model=result["model"],
            cost_usd=result.get("cost_usd", 0),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score-lead", response_model=ScoreLeadResponse)
async def score_lead(
    request: ScoreLeadRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Score a business lead for JASPER CRM.

    Uses Gemini (FREE) to evaluate:
    - DFI eligibility (30 points)
    - Funding scale (25 points)
    - Documentation readiness (20 points)
    - Urgency (15 points)
    - Communication (10 points)
    """
    try:
        result = await completion_service.score_lead(request.model_dump())

        return ScoreLeadResponse(
            score=result["score"],
            reasoning=result["reasoning"],
            model=result["model"],
            cost_usd=result.get("cost_usd", 0),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_completion_models():
    """List available completion models with costs."""
    from ..config import COMPLETION_MODELS

    return {
        "models": {
            key: {
                "id": config["id"],
                "cost_input": config["cost_input"],
                "cost_output": config["cost_output"],
                "context": config["context"],
                "tasks": config["tasks"],
                "usage_percent": config["usage_percent"],
            }
            for key, config in COMPLETION_MODELS.items()
        },
        "provider": "openrouter",
    }


@router.post("/route")
async def get_routing_info(
    task: str,
    input_tokens: int = 1000,
    output_tokens: int = 500,
):
    """
    Get routing information for a task type.

    Shows which model would be used and estimated cost.
    """
    model_id = task_router.get_completion_model(task)
    cost = task_router.estimate_cost(task, input_tokens, output_tokens)

    return {
        "task": task,
        "model": model_id,
        "estimated_cost_usd": round(cost, 6),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }
