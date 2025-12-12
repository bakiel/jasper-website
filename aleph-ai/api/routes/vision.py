"""
ALEPH AI Infrastructure - Vision Routes
POST /v1/vision/* - Vision analysis endpoints
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..models import vision_service

router = APIRouter(prefix="/v1/vision", tags=["Vision"])


class OCRRequest(BaseModel):
    """OCR request for document extraction."""
    image: str = Field(..., description="Base64 encoded image or PDF page")
    output_format: str = Field("text", description="text, doctags, markdown, json")
    extract: Optional[List[str]] = Field(None, description="What to extract: text, tables, figures")


class OCRResponse(BaseModel):
    """OCR response."""
    text: str
    format: str
    model: str
    error: Optional[str] = None


class AnalyzeRequest(BaseModel):
    """General vision analysis request."""
    image: str = Field(..., description="Base64 encoded image")
    prompt: str = Field(..., description="Analysis prompt")
    max_tokens: int = Field(500, description="Maximum response tokens")


class AnalyzeResponse(BaseModel):
    """Vision analysis response."""
    description: str
    model: str
    error: Optional[str] = None


class DetectRequest(BaseModel):
    """Object detection request."""
    image: str = Field(..., description="Base64 encoded image")
    objects: List[str] = Field(..., description="Objects to detect")
    return_boxes: bool = Field(True, description="Return bounding boxes")


class DetectResponse(BaseModel):
    """Detection response."""
    detections: List[Dict[str, Any]]
    model: str
    error: Optional[str] = None


class CaptionRequest(BaseModel):
    """Image captioning request."""
    image: str = Field(..., description="Base64 encoded image")
    style: str = Field("detailed", description="brief, detailed, artistic")


@router.post("/ocr", response_model=OCRResponse)
async def extract_document(
    request: OCRRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Extract text and structure from documents using SmolDocling.

    Optimized for:
    - Tables and forms
    - PDF pages
    - Handwritten text
    - Formulas and code

    Processing: ~0.35s per page
    """
    try:
        result = await vision_service.ocr(
            image=request.image,
            output_format=request.output_format,
            extract=request.extract,
        )

        return OCRResponse(
            text=result.get("text", ""),
            format=result.get("format", "text"),
            model=result.get("model", "smoldocling-256m"),
            error=result.get("error"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(
    request: AnalyzeRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Analyze image with SmolVLM-500M.

    Capabilities:
    - Image description
    - Visual question answering
    - Style analysis
    - Content understanding
    """
    try:
        result = await vision_service.analyze(
            image=request.image,
            prompt=request.prompt,
            max_tokens=request.max_tokens,
        )

        return AnalyzeResponse(
            description=result.get("description", ""),
            model=result.get("model", "smolvlm-500m"),
            error=result.get("error"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect", response_model=DetectResponse)
async def detect_objects(
    request: DetectRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Detect and locate objects using Moondream-2B.

    Features:
    - Zero-shot detection
    - Bounding box coordinates
    - Object counting
    - Localization

    Note: Model loaded on-demand, first request may be slower.
    """
    try:
        result = await vision_service.detect(
            image=request.image,
            objects=request.objects,
            return_boxes=request.return_boxes,
        )

        return DetectResponse(
            detections=result.get("detections", []),
            model=result.get("model", "moondream-2b"),
            error=result.get("error"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/caption")
async def caption_image(
    request: CaptionRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Generate image caption with SmolVLM.

    Styles:
    - brief: One sentence
    - detailed: Full description
    - artistic: Style and composition focus
    """
    try:
        result = await vision_service.caption(
            image=request.image,
            style=request.style,
        )

        return {
            "caption": result.get("description", ""),
            "style": request.style,
            "model": result.get("model", "smolvlm-500m"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DesignRequest(BaseModel):
    """Design analysis request."""
    image: str = Field(..., description="Base64 encoded design image")


@router.post("/design")
async def describe_design(
    request: DesignRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    """
    Analyze design for ALEPH Creative-Hub.

    Extracts:
    - Style (minimalist, vintage, modern, etc.)
    - Color palette
    - Typography
    - Visual elements
    - Target audience
    """
    try:
        result = await vision_service.describe_design(request.image)

        return {
            "analysis": result.get("description", ""),
            "model": result.get("model", "smolvlm-500m"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
async def vision_info():
    """Get vision models information."""
    return {
        "models": {
            "smoldocling": {
                "params": "256M",
                "ram": "500MB",
                "speed": "0.35s/page",
                "specialization": "Document OCR, tables, forms",
                "cost": 0,
            },
            "smolvlm": {
                "params": "500M",
                "ram": "1.2GB",
                "specialization": "General vision, captions, VQA",
                "cost": 0,
            },
            "moondream": {
                "params": "1.86B",
                "ram": "4GB",
                "specialization": "Object detection, counting",
                "on_demand": True,
                "cost": 0,
            },
        },
        "layer": "self-hosted",
    }
