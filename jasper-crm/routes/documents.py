"""
JASPER CRM - Document Processing Routes (DeepSeek VL Powered)

API endpoints for onboarding document processing:
- Upload and analyze documents
- Classify document types
- Extract text (OCR)
- Extract structured data (ID, financial, contracts)
- Validate onboarding document completeness
"""

import os
import base64
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db import get_db
from agents.document_processor import document_processor, DocumentType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Document Processing"])


# --- Request/Response Models ---

class DocumentAnalysisRequest(BaseModel):
    """Request for document analysis"""
    image_data: str = Field(..., description="Base64 encoded image or URL")
    filename: Optional[str] = Field(None, description="Original filename")
    context: Optional[str] = Field(None, description="Additional context")


class DocumentClassifyRequest(BaseModel):
    """Request for quick document classification"""
    image_data: str = Field(..., description="Base64 encoded image")
    filename: Optional[str] = None


class DocumentOCRRequest(BaseModel):
    """Request for text extraction"""
    image_data: str = Field(..., description="Base64 encoded image")
    filename: Optional[str] = None


class IDExtractionRequest(BaseModel):
    """Request for ID document extraction"""
    image_data: str = Field(..., description="Base64 encoded ID document image")
    filename: Optional[str] = None


class FinancialExtractionRequest(BaseModel):
    """Request for financial document extraction"""
    image_data: str = Field(..., description="Base64 encoded financial document")
    filename: Optional[str] = None


class ContractExtractionRequest(BaseModel):
    """Request for contract extraction"""
    image_data: str = Field(..., description="Base64 encoded contract image")
    filename: Optional[str] = None


class DocumentInfo(BaseModel):
    """Document info for validation"""
    document_type: str
    filename: Optional[str] = None
    analysis: Optional[str] = None


class ValidationRequest(BaseModel):
    """Request for onboarding validation"""
    documents: List[DocumentInfo]
    required_types: Optional[List[str]] = None


class SummaryRequest(BaseModel):
    """Request for document summary"""
    documents: List[dict]
    lead_context: Optional[dict] = None


# --- ENDPOINTS ---

@router.post("/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """
    Comprehensive document analysis using DeepSeek VL.

    Analyzes the document and returns:
    - Document type classification
    - Extracted text (OCR)
    - Key information
    - Quality assessment
    - Summary
    """
    try:
        result = await document_processor.analyze_document(
            image_data=request.image_data,
            filename=request.filename,
            context=request.context,
        )

        if result.get("success"):
            return {
                "success": True,
                "analysis": result.get("analysis"),
                "filename": result.get("filename"),
                "model": result.get("model"),
                "processed_at": result.get("processed_at"),
            }

        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Document analysis failed")
        )

    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify")
async def classify_document(request: DocumentClassifyRequest):
    """
    Quick document classification.

    Returns the document type and confidence level.
    Faster than full analysis - use for initial sorting.
    """
    try:
        result = await document_processor.classify_document(
            image_data=request.image_data,
            filename=request.filename,
        )

        return {
            "success": result.get("success", False),
            "document_type": result.get("document_type"),
            "confidence": result.get("confidence"),
            "reason": result.get("reason"),
            "filename": result.get("filename"),
        }

    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ocr")
async def extract_text(request: DocumentOCRRequest):
    """
    Extract all text from a document image (OCR).

    Returns:
    - Full extracted text
    - Structured data (headers, body, tables)
    - Detected language
    - Legibility assessment
    """
    try:
        result = await document_processor.extract_text(
            image_data=request.image_data,
            filename=request.filename,
        )

        return {
            "success": result.get("success", False),
            "extracted_text": result.get("extracted_text"),
            "structured_data": result.get("structured_data"),
            "language": result.get("language"),
            "legibility": result.get("legibility"),
            "filename": result.get("filename"),
        }

    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract/id")
async def extract_id_document(request: IDExtractionRequest):
    """
    Extract information from ID documents.

    Supports:
    - Passports
    - ID cards (South African, international)
    - Driver's licenses

    Returns structured data including names, ID numbers, dates, etc.
    """
    try:
        result = await document_processor.extract_id_document(
            image_data=request.image_data,
            filename=request.filename,
        )

        if result.get("success"):
            return {
                "success": True,
                "id_data": result.get("id_data"),
                "filename": result.get("filename"),
                "extracted_at": result.get("extracted_at"),
            }

        raise HTTPException(
            status_code=500,
            detail=result.get("error", "ID extraction failed")
        )

    except Exception as e:
        logger.error(f"ID extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract/financial")
async def extract_financial_document(request: FinancialExtractionRequest):
    """
    Extract information from financial documents.

    Supports:
    - Bank statements
    - Invoices
    - Receipts
    - P&L statements
    - Balance sheets

    Returns structured financial data.
    """
    try:
        result = await document_processor.extract_financial_document(
            image_data=request.image_data,
            filename=request.filename,
        )

        if result.get("success"):
            return {
                "success": True,
                "financial_data": result.get("financial_data"),
                "filename": result.get("filename"),
                "extracted_at": result.get("extracted_at"),
            }

        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Financial extraction failed")
        )

    except Exception as e:
        logger.error(f"Financial extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract/contract")
async def extract_contract(request: ContractExtractionRequest):
    """
    Extract information from contracts and legal documents.

    Supports:
    - Contracts
    - NDAs
    - Agreements
    - Terms and conditions

    Returns key terms, parties, dates, obligations.
    """
    try:
        result = await document_processor.extract_contract(
            image_data=request.image_data,
            filename=request.filename,
        )

        if result.get("success"):
            return {
                "success": True,
                "contract_data": result.get("contract_data"),
                "filename": result.get("filename"),
                "extracted_at": result.get("extracted_at"),
            }

        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Contract extraction failed")
        )

    except Exception as e:
        logger.error(f"Contract extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate/onboarding")
async def validate_onboarding(request: ValidationRequest):
    """
    Validate onboarding document completeness.

    Checks if all required documents are present:
    - ID document
    - Proof of address
    - Company registration (for business clients)

    Returns completeness status and missing documents.
    """
    try:
        # Convert to dicts
        documents = [doc.model_dump() for doc in request.documents]

        result = await document_processor.validate_onboarding_documents(
            documents=documents,
            required_types=request.required_types,
        )

        return result

    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_documents(request: SummaryRequest):
    """
    Generate executive summary of all onboarding documents.

    Uses DeepSeek R1 reasoning to analyze documents and provide:
    - Overall assessment
    - Key information extracted
    - Concerns or red flags
    - Recommendations for next steps
    """
    try:
        result = await document_processor.summarize_documents(
            documents=request.documents,
            lead_context=request.lead_context,
        )

        if result.get("success"):
            return {
                "success": True,
                "summary": result.get("summary"),
                "reasoning": result.get("reasoning"),
                "model": result.get("model"),
            }

        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Summary generation failed")
        )

    except Exception as e:
        logger.error(f"Summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    context: Optional[str] = Form(None),
):
    """
    Upload a document file and analyze it.

    Accepts image files (PNG, JPG, JPEG, WEBP) and PDFs.
    Automatically converts to base64 and processes with DeepSeek VL.
    """
    try:
        # Validate file type
        allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_types}"
            )

        # Read file content
        content = await file.read()

        # Convert to base64
        base64_data = base64.b64encode(content).decode("utf-8")

        # Determine MIME type
        mime_type = file.content_type
        image_data = f"data:{mime_type};base64,{base64_data}"

        # Analyze
        result = await document_processor.analyze_document(
            image_data=image_data,
            filename=file.filename,
            context=context,
        )

        return {
            "success": result.get("success", False),
            "filename": file.filename,
            "file_size": len(content),
            "content_type": file.content_type,
            "analysis": result.get("analysis"),
            "model": result.get("model"),
            "processed_at": result.get("processed_at"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def list_document_types():
    """
    List all supported document types.

    Returns the document classification categories used by the system.
    """
    return {
        "success": True,
        "document_types": [
            {
                "value": dtype.value,
                "label": dtype.value.replace("_", " ").title(),
                "description": _get_type_description(dtype),
            }
            for dtype in DocumentType
        ],
    }


def _get_type_description(dtype: DocumentType) -> str:
    """Get description for document type."""
    descriptions = {
        DocumentType.ID_DOCUMENT: "Passport, ID card, driver's license",
        DocumentType.FINANCIAL_STATEMENT: "Bank statements, P&L, balance sheets",
        DocumentType.CONTRACT: "Legal agreements, NDAs, contracts",
        DocumentType.COMPANY_REGISTRATION: "CIPC, registration certificates",
        DocumentType.TAX_DOCUMENT: "Tax clearance, tax returns",
        DocumentType.PROOF_OF_ADDRESS: "Utility bills, bank statements showing address",
        DocumentType.BUSINESS_PLAN: "Business plans, pitch decks",
        DocumentType.INVOICE: "Invoices, quotes, estimates",
        DocumentType.RECEIPT: "Payment receipts, transaction records",
        DocumentType.OTHER: "Other document types",
    }
    return descriptions.get(dtype, "")
