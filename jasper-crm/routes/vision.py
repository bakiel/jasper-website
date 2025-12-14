"""
JASPER CRM - Vision API Routes

Provides endpoints for:
- Business card scanning (extract contact info)
- Document OCR (extract text from documents)
- Image analysis (general image understanding)

All powered by DeepSeek VL (Vision-Language model).
"""

import logging
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.deepseek_router import deepseek_router, TaskType
from db.leads import create_lead

router = APIRouter(prefix="/api/v1/vision", tags=["Vision AI"])
logger = logging.getLogger(__name__)


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class BusinessCardResponse(BaseModel):
    """Response from business card extraction"""
    success: bool
    contact: Optional[Dict[str, Any]] = None
    lead_created: Optional[str] = None
    raw_text: Optional[str] = None
    confidence: Optional[str] = None
    error: Optional[str] = None


class DocumentOCRResponse(BaseModel):
    """Response from document OCR"""
    success: bool
    text: Optional[str] = None
    summary: Optional[str] = None
    document_type: Optional[str] = None
    key_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ImageAnalysisResponse(BaseModel):
    """Response from image analysis"""
    success: bool
    description: Optional[str] = None
    objects: Optional[List[str]] = None
    text_found: Optional[str] = None
    analysis: Optional[str] = None
    error: Optional[str] = None


class AnalyzeImageRequest(BaseModel):
    """Request for image analysis with base64 image"""
    image_base64: str = Field(..., description="Base64 encoded image")
    task: str = Field(default="describe", description="Task: describe, extract_text, analyze")
    context: Optional[str] = Field(None, description="Additional context for analysis")


# =============================================================================
# BUSINESS CARD SCANNING
# =============================================================================

@router.post("/business-card", response_model=BusinessCardResponse)
async def scan_business_card(
    file: UploadFile = File(...),
    create_lead_from_card: bool = Form(default=False),
    source: str = Form(default="business_card"),
    background_tasks: BackgroundTasks = None,
):
    """
    Extract contact information from a business card image.

    Upload a photo of a business card, and DeepSeek VL will extract:
    - Name
    - Company
    - Job title
    - Email
    - Phone
    - Website
    - Address

    Optionally creates a lead from the extracted info.

    Accepts: JPEG, PNG, WebP images
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, WebP)"
        )

    try:
        # Read and encode image
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")

        # Determine MIME type
        mime_type = file.content_type or "image/jpeg"

        # Create data URL
        image_data_url = f"data:{mime_type};base64,{image_base64}"

        # Extract using DeepSeek VL
        logger.info(f"Extracting business card: {file.filename}")
        result = await deepseek_router.extract_business_card(image_data_url)

        if not result.get("success"):
            return BusinessCardResponse(
                success=False,
                error=result.get("error", "Failed to extract business card")
            )

        contact = result.get("contact", {})

        # Create lead if requested
        lead_id = None
        if create_lead_from_card and contact.get("email"):
            try:
                lead = await create_lead({
                    "name": contact.get("name", "Business Card Lead"),
                    "email": contact.get("email"),
                    "phone": contact.get("phone"),
                    "company": contact.get("company"),
                    "job_title": contact.get("title"),
                    "source": source,
                    "message": f"Imported from business card: {file.filename}",
                    "tags": ["business_card", "vision_import"],
                })
                lead_id = lead.id
                logger.info(f"Created lead from business card: {lead_id}")
            except Exception as e:
                logger.error(f"Failed to create lead from card: {e}")

        return BusinessCardResponse(
            success=True,
            contact=contact,
            lead_created=lead_id,
            confidence=result.get("confidence", "medium"),
        )

    except Exception as e:
        logger.error(f"Business card extraction error: {e}")
        return BusinessCardResponse(
            success=False,
            error=str(e)
        )


@router.post("/business-card/base64", response_model=BusinessCardResponse)
async def scan_business_card_base64(
    image_base64: str = Form(...),
    create_lead_from_card: bool = Form(default=False),
    source: str = Form(default="business_card"),
):
    """
    Extract business card from base64 encoded image.

    For mobile apps or when image is already in base64 format.
    """
    try:
        # Handle data URL or raw base64
        if image_base64.startswith("data:"):
            image_data_url = image_base64
        else:
            image_data_url = f"data:image/jpeg;base64,{image_base64}"

        result = await deepseek_router.extract_business_card(image_data_url)

        if not result.get("success"):
            return BusinessCardResponse(
                success=False,
                error=result.get("error", "Failed to extract business card")
            )

        contact = result.get("contact", {})

        # Create lead if requested
        lead_id = None
        if create_lead_from_card and contact.get("email"):
            try:
                lead = await create_lead({
                    "name": contact.get("name", "Business Card Lead"),
                    "email": contact.get("email"),
                    "phone": contact.get("phone"),
                    "company": contact.get("company"),
                    "source": source,
                    "tags": ["business_card", "vision_import"],
                })
                lead_id = lead.id
            except Exception as e:
                logger.error(f"Failed to create lead: {e}")

        return BusinessCardResponse(
            success=True,
            contact=contact,
            lead_created=lead_id,
            confidence=result.get("confidence", "medium"),
        )

    except Exception as e:
        logger.error(f"Business card base64 error: {e}")
        return BusinessCardResponse(
            success=False,
            error=str(e)
        )


# =============================================================================
# DOCUMENT OCR
# =============================================================================

@router.post("/document", response_model=DocumentOCRResponse)
async def extract_document_text(
    file: UploadFile = File(...),
    summarize: bool = Form(default=True),
    extract_key_info: bool = Form(default=True),
):
    """
    Extract text and key information from a document image.

    Upload a photo of a document (contract, invoice, letter, etc.)
    and DeepSeek VL will:
    - Extract all visible text
    - Identify document type
    - Summarize key information
    - Extract structured data (dates, amounts, names)

    Accepts: JPEG, PNG, WebP, PDF (first page)
    """
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Unknown file type")

    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")

        mime_type = file.content_type
        if "pdf" in mime_type:
            # For PDF, we'd need to convert first page to image
            # For now, treat as image
            mime_type = "image/jpeg"

        image_data_url = f"data:{mime_type};base64,{image_base64}"

        logger.info(f"Processing document: {file.filename}")

        # Build task description
        task_parts = ["Extract all text from this document."]
        if summarize:
            task_parts.append("Provide a brief summary.")
        if extract_key_info:
            task_parts.append("Identify key information (dates, names, amounts, etc.).")

        task = " ".join(task_parts)

        result = await deepseek_router.analyze_image(image_data_url, task)

        if not result.get("success"):
            return DocumentOCRResponse(
                success=False,
                error=result.get("error", "Failed to process document")
            )

        analysis = result.get("analysis", "")

        # Try to parse structured response
        response = DocumentOCRResponse(
            success=True,
            text=analysis,
            document_type=result.get("document_type"),
        )

        # Extract summary if present
        if "summary:" in analysis.lower():
            parts = analysis.lower().split("summary:")
            if len(parts) > 1:
                response.summary = parts[1].strip()[:500]

        return response

    except Exception as e:
        logger.error(f"Document OCR error: {e}")
        return DocumentOCRResponse(
            success=False,
            error=str(e)
        )


# =============================================================================
# GENERAL IMAGE ANALYSIS
# =============================================================================

@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    task: str = Form(default="describe"),
    context: Optional[str] = Form(None),
):
    """
    Analyze an image using DeepSeek VL.

    Tasks:
    - describe: General description of the image
    - extract_text: Extract any visible text
    - analyze: Detailed analysis with context

    Use context to guide the analysis (e.g., "This is a construction site photo")
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")
        mime_type = file.content_type or "image/jpeg"
        image_data_url = f"data:{mime_type};base64,{image_base64}"

        # Build task prompt
        if task == "describe":
            task_prompt = "Describe this image in detail."
        elif task == "extract_text":
            task_prompt = "Extract all visible text from this image."
        elif task == "analyze":
            task_prompt = "Analyze this image thoroughly. What do you see? What is happening?"
        else:
            task_prompt = task

        if context:
            task_prompt = f"{task_prompt}\n\nContext: {context}"

        result = await deepseek_router.analyze_image(image_data_url, task_prompt)

        if not result.get("success"):
            return ImageAnalysisResponse(
                success=False,
                error=result.get("error", "Failed to analyze image")
            )

        return ImageAnalysisResponse(
            success=True,
            description=result.get("analysis"),
            analysis=result.get("analysis"),
        )

    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return ImageAnalysisResponse(
            success=False,
            error=str(e)
        )


@router.post("/analyze/base64", response_model=ImageAnalysisResponse)
async def analyze_image_base64(request: AnalyzeImageRequest):
    """
    Analyze an image from base64 string.

    For API integrations where image is already base64 encoded.
    """
    try:
        if request.image_base64.startswith("data:"):
            image_data_url = request.image_base64
        else:
            image_data_url = f"data:image/jpeg;base64,{request.image_base64}"

        task_prompt = request.task
        if request.context:
            task_prompt = f"{task_prompt}\n\nContext: {request.context}"

        result = await deepseek_router.analyze_image(image_data_url, task_prompt)

        if not result.get("success"):
            return ImageAnalysisResponse(
                success=False,
                error=result.get("error", "Failed to analyze image")
            )

        return ImageAnalysisResponse(
            success=True,
            description=result.get("analysis"),
            analysis=result.get("analysis"),
        )

    except Exception as e:
        logger.error(f"Image analysis base64 error: {e}")
        return ImageAnalysisResponse(
            success=False,
            error=str(e)
        )


# =============================================================================
# BATCH PROCESSING
# =============================================================================

@router.post("/batch/business-cards")
async def batch_scan_business_cards(
    files: List[UploadFile] = File(...),
    create_leads: bool = Form(default=False),
    source: str = Form(default="batch_scan"),
):
    """
    Batch process multiple business card images.

    Upload multiple business card photos and get all contacts extracted.
    Optionally creates leads for all valid contacts.

    Maximum 10 images per batch.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images per batch"
        )

    results = []

    for file in files:
        try:
            if not file.content_type or not file.content_type.startswith("image/"):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "Not an image file"
                })
                continue

            contents = await file.read()
            image_base64 = base64.b64encode(contents).decode("utf-8")
            mime_type = file.content_type or "image/jpeg"
            image_data_url = f"data:{mime_type};base64,{image_base64}"

            result = await deepseek_router.extract_business_card(image_data_url)

            if result.get("success"):
                contact = result.get("contact", {})
                lead_id = None

                if create_leads and contact.get("email"):
                    try:
                        lead = await create_lead({
                            "name": contact.get("name", "Business Card Lead"),
                            "email": contact.get("email"),
                            "phone": contact.get("phone"),
                            "company": contact.get("company"),
                            "source": source,
                            "tags": ["business_card", "batch_import"],
                        })
                        lead_id = lead.id
                    except Exception as e:
                        logger.error(f"Failed to create lead: {e}")

                results.append({
                    "filename": file.filename,
                    "success": True,
                    "contact": contact,
                    "lead_created": lead_id,
                })
            else:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": result.get("error", "Extraction failed")
                })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })

    successful = sum(1 for r in results if r.get("success"))

    return {
        "total": len(files),
        "successful": successful,
        "failed": len(files) - successful,
        "results": results,
    }


# =============================================================================
# SEARCH (R1 Web Search)
# =============================================================================

@router.post("/search")
async def web_search(
    query: str = Form(...),
    context: Optional[str] = Form(None),
):
    """
    Perform web search using DeepSeek R1.

    R1's multi-step RAG pipeline:
    1. Query rewriting → optimized search terms
    2. Web index lookup → select relevant URLs
    3. Live crawling → fetch fresh content
    4. Synthesis → reasoned answer with citations

    Great for:
    - Company research
    - DFI opportunity discovery
    - Market intelligence
    - News and developments
    """
    try:
        result = await deepseek_router.search_web(query, context)

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Search failed")
            )

        return {
            "success": True,
            "query": query,
            "answer": result.get("answer"),
            "sources": result.get("sources", []),
            "reasoning": result.get("reasoning"),
            "model": result.get("model"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Web search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/company")
async def research_company(
    company_name: str = Form(...),
    sector: Optional[str] = Form(None),
):
    """
    Research a company using DeepSeek R1 web search.

    Returns:
    - Company overview
    - Key people
    - Recent news
    - Funding history
    - DFI relevance assessment
    """
    try:
        result = await deepseek_router.research_company(
            company_name=company_name,
            additional_context=f"Sector: {sector}" if sector else None
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Research failed")
            )

        return {
            "success": True,
            "company_name": company_name,
            "research": result.get("company"),
            "reasoning": result.get("reasoning"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Company research error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research/dfi")
async def discover_dfi_opportunities(
    sector: Optional[str] = Form(None),
    region: str = Form(default="South Africa"),
    funding_range: Optional[str] = Form(None),
):
    """
    Discover DFI funding opportunities using DeepSeek R1.

    Searches for:
    - Active DFI funding programs
    - Eligibility criteria
    - Application deadlines
    - Funding amounts
    - Success factors

    Returns ranked opportunities with relevance scores.
    """
    try:
        result = await deepseek_router.discover_dfi_opportunities(
            sector=sector,
            region=region,
            funding_range=funding_range
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "DFI discovery failed")
            )

        return {
            "success": True,
            "sector": sector,
            "region": region,
            "opportunities": result.get("opportunities", []),
            "total_found": len(result.get("opportunities", [])),
            "reasoning": result.get("reasoning"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DFI discovery error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
