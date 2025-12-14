"""
JASPER CRM - Document Processor Agent (DeepSeek VL Powered)

Processes onboarding portal documents using DeepSeek VL for:
- PDF text extraction and analysis
- Image OCR (scanned documents, receipts)
- Document classification (ID, financial, contract, etc.)
- Key information extraction
- Document summarization

Uses DeepSeek VL for vision tasks, R1 for analysis/reasoning.
"""

import logging
import base64
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from services.deepseek_router import deepseek_router, TaskType

logger = logging.getLogger(__name__)


class DocumentType(str, Enum):
    """Document classification types"""
    ID_DOCUMENT = "id_document"           # Passport, ID card, driver's license
    FINANCIAL_STATEMENT = "financial"     # Bank statements, P&L, balance sheet
    CONTRACT = "contract"                 # Legal agreements, NDAs
    COMPANY_REGISTRATION = "registration" # CIPC, registration certificates
    TAX_DOCUMENT = "tax"                  # Tax clearance, returns
    PROOF_OF_ADDRESS = "proof_of_address" # Utility bills, bank statements
    BUSINESS_PLAN = "business_plan"       # Business plans, pitches
    INVOICE = "invoice"                   # Invoices, quotes
    RECEIPT = "receipt"                   # Payment receipts
    OTHER = "other"                       # Unclassified


class ExtractionConfidence(str, Enum):
    """Confidence levels for extraction"""
    HIGH = "high"       # >90% confidence
    MEDIUM = "medium"   # 70-90% confidence
    LOW = "low"         # <70% confidence


class DocumentProcessor:
    """
    AI Document Processor using DeepSeek VL.

    Capabilities:
    - OCR: Extract text from images/scans
    - Classification: Identify document type
    - Extraction: Pull key fields (names, dates, amounts)
    - Validation: Check document completeness
    - Summary: Generate document summaries
    """

    def __init__(self):
        self.router = deepseek_router
        logger.info("DocumentProcessor initialized with DeepSeek VL")

    # =========================================================================
    # CORE: DOCUMENT ANALYSIS
    # =========================================================================

    async def analyze_document(
        self,
        image_data: str,
        filename: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive document analysis using DeepSeek VL.

        Args:
            image_data: Base64 encoded image or URL
            filename: Optional filename for context
            context: Additional context about the document

        Returns:
            Dict with classification, extracted data, and summary
        """
        logger.info(f"Analyzing document: {filename or 'unknown'}")

        # Build analysis prompt
        prompt = """Analyze this document image and provide:

1. DOCUMENT TYPE - Classify as one of:
   - id_document (passport, ID card, driver's license)
   - financial (bank statement, P&L, balance sheet)
   - contract (legal agreement, NDA)
   - registration (company registration, CIPC)
   - tax (tax clearance, tax return)
   - proof_of_address (utility bill, bank statement with address)
   - business_plan (business plan, pitch deck)
   - invoice (invoice, quote)
   - receipt (payment receipt)
   - other

2. EXTRACTED INFORMATION:
   - All visible text (OCR)
   - Key fields: names, dates, amounts, reference numbers
   - Any signatures or stamps present

3. DOCUMENT QUALITY:
   - Legibility (clear/partial/poor)
   - Completeness (complete/partial/incomplete)
   - Authenticity indicators

4. SUMMARY:
   - Brief description of the document
   - Key takeaways for onboarding"""

        if context:
            prompt += f"\n\nAdditional context: {context}"

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=2000,
        )

        if result.get("success") and result.get("analysis"):
            analysis = result["analysis"]

            # Parse structured response
            return {
                "success": True,
                "filename": filename,
                "analysis": analysis,
                "model": result.get("model"),
                "processed_at": datetime.utcnow().isoformat(),
            }

        return {
            "success": False,
            "error": result.get("error", "Analysis failed"),
            "filename": filename,
        }

    # =========================================================================
    # CLASSIFICATION
    # =========================================================================

    async def classify_document(
        self,
        image_data: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Quick document classification using DeepSeek VL.

        Args:
            image_data: Base64 encoded image
            filename: Optional filename

        Returns:
            Dict with document_type and confidence
        """
        logger.info(f"Classifying document: {filename or 'unknown'}")

        prompt = """Classify this document image. Return ONLY a JSON object:
{
    "document_type": "<type>",
    "confidence": "high|medium|low",
    "reason": "<brief explanation>"
}

Valid types: id_document, financial, contract, registration, tax, proof_of_address, business_plan, invoice, receipt, other"""

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=300,
        )

        if result.get("success") and result.get("analysis"):
            try:
                import json
                analysis = result["analysis"]

                # Parse JSON from response
                if "```json" in analysis:
                    analysis = analysis.split("```json")[1].split("```")[0]
                elif "```" in analysis:
                    analysis = analysis.split("```")[1].split("```")[0]

                classification = json.loads(analysis.strip())

                return {
                    "success": True,
                    "document_type": classification.get("document_type", "other"),
                    "confidence": classification.get("confidence", "medium"),
                    "reason": classification.get("reason", ""),
                    "filename": filename,
                }
            except json.JSONDecodeError:
                # Return raw analysis if JSON parsing fails
                return {
                    "success": True,
                    "document_type": "other",
                    "confidence": "low",
                    "reason": result["analysis"],
                    "filename": filename,
                }

        return {
            "success": False,
            "error": result.get("error", "Classification failed"),
            "filename": filename,
        }

    # =========================================================================
    # OCR EXTRACTION
    # =========================================================================

    async def extract_text(
        self,
        image_data: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract all text from document using DeepSeek VL OCR.

        Args:
            image_data: Base64 encoded image
            filename: Optional filename

        Returns:
            Dict with extracted_text and structure
        """
        logger.info(f"Extracting text from: {filename or 'unknown'}")

        prompt = """Extract ALL visible text from this document image.

Return a JSON object:
{
    "extracted_text": "<all text in reading order>",
    "structured_data": {
        "headers": ["<any headers/titles>"],
        "body": "<main body text>",
        "footer": "<footer text if any>",
        "tables": ["<table content if any>"]
    },
    "language": "<detected language>",
    "legibility": "clear|partial|poor"
}

Be thorough - extract every visible character."""

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=3000,
        )

        if result.get("success") and result.get("analysis"):
            try:
                import json
                analysis = result["analysis"]

                if "```json" in analysis:
                    analysis = analysis.split("```json")[1].split("```")[0]
                elif "```" in analysis:
                    analysis = analysis.split("```")[1].split("```")[0]

                extraction = json.loads(analysis.strip())

                return {
                    "success": True,
                    "extracted_text": extraction.get("extracted_text", ""),
                    "structured_data": extraction.get("structured_data", {}),
                    "language": extraction.get("language", "unknown"),
                    "legibility": extraction.get("legibility", "unknown"),
                    "filename": filename,
                }
            except json.JSONDecodeError:
                # Return raw text if JSON fails
                return {
                    "success": True,
                    "extracted_text": result["analysis"],
                    "structured_data": {},
                    "language": "unknown",
                    "legibility": "unknown",
                    "filename": filename,
                }

        return {
            "success": False,
            "error": result.get("error", "Text extraction failed"),
            "filename": filename,
        }

    # =========================================================================
    # ID DOCUMENT EXTRACTION
    # =========================================================================

    async def extract_id_document(
        self,
        image_data: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract information from ID documents (passport, ID card, license).

        Args:
            image_data: Base64 encoded image
            filename: Optional filename

        Returns:
            Dict with extracted ID information
        """
        logger.info(f"Extracting ID document: {filename or 'unknown'}")

        prompt = """Extract information from this ID document (passport, ID card, or driver's license).

Return JSON:
{
    "document_type": "passport|id_card|drivers_license|other",
    "full_name": "",
    "first_name": "",
    "surname": "",
    "id_number": "",
    "date_of_birth": "",
    "gender": "",
    "nationality": "",
    "issue_date": "",
    "expiry_date": "",
    "issuing_authority": "",
    "address": "",
    "photo_present": true|false,
    "signature_present": true|false,
    "is_valid": true|false,
    "validation_notes": ""
}

Extract all visible fields. Use null for fields not present."""

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=800,
        )

        if result.get("success") and result.get("analysis"):
            try:
                import json
                analysis = result["analysis"]

                if "```json" in analysis:
                    analysis = analysis.split("```json")[1].split("```")[0]
                elif "```" in analysis:
                    analysis = analysis.split("```")[1].split("```")[0]

                id_data = json.loads(analysis.strip())

                return {
                    "success": True,
                    "id_data": id_data,
                    "filename": filename,
                    "extracted_at": datetime.utcnow().isoformat(),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse ID extraction",
                    "raw_response": result["analysis"],
                    "filename": filename,
                }

        return {
            "success": False,
            "error": result.get("error", "ID extraction failed"),
            "filename": filename,
        }

    # =========================================================================
    # FINANCIAL DOCUMENT EXTRACTION
    # =========================================================================

    async def extract_financial_document(
        self,
        image_data: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract information from financial documents.

        Args:
            image_data: Base64 encoded image
            filename: Optional filename

        Returns:
            Dict with extracted financial information
        """
        logger.info(f"Extracting financial document: {filename or 'unknown'}")

        prompt = """Extract information from this financial document (bank statement, invoice, receipt, financial statement).

Return JSON:
{
    "document_type": "bank_statement|invoice|receipt|p_and_l|balance_sheet|other",
    "issuer": "",
    "recipient": "",
    "date": "",
    "period_start": "",
    "period_end": "",
    "account_number": "",
    "reference_number": "",
    "currency": "",
    "amounts": {
        "total": 0,
        "subtotal": 0,
        "tax": 0,
        "items": [{"description": "", "amount": 0}]
    },
    "balance": {
        "opening": 0,
        "closing": 0
    },
    "key_figures": {},
    "notes": ""
}

Extract all monetary values and relevant details."""

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=1500,
        )

        if result.get("success") and result.get("analysis"):
            try:
                import json
                analysis = result["analysis"]

                if "```json" in analysis:
                    analysis = analysis.split("```json")[1].split("```")[0]
                elif "```" in analysis:
                    analysis = analysis.split("```")[1].split("```")[0]

                financial_data = json.loads(analysis.strip())

                return {
                    "success": True,
                    "financial_data": financial_data,
                    "filename": filename,
                    "extracted_at": datetime.utcnow().isoformat(),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse financial extraction",
                    "raw_response": result["analysis"],
                    "filename": filename,
                }

        return {
            "success": False,
            "error": result.get("error", "Financial extraction failed"),
            "filename": filename,
        }

    # =========================================================================
    # CONTRACT EXTRACTION
    # =========================================================================

    async def extract_contract(
        self,
        image_data: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract key information from contracts and legal documents.

        Args:
            image_data: Base64 encoded image
            filename: Optional filename

        Returns:
            Dict with contract details
        """
        logger.info(f"Extracting contract: {filename or 'unknown'}")

        prompt = """Extract information from this contract or legal document.

Return JSON:
{
    "document_type": "contract|nda|agreement|terms|other",
    "title": "",
    "parties": [{"name": "", "role": ""}],
    "effective_date": "",
    "expiry_date": "",
    "key_terms": [""],
    "obligations": [""],
    "value": "",
    "signatures": [{"name": "", "signed": true|false}],
    "witnesses": [""],
    "jurisdiction": "",
    "summary": ""
}

Focus on legally significant details."""

        result = await self.router.analyze_image(
            image_data=image_data,
            prompt=prompt,
            max_tokens=1500,
        )

        if result.get("success") and result.get("analysis"):
            try:
                import json
                analysis = result["analysis"]

                if "```json" in analysis:
                    analysis = analysis.split("```json")[1].split("```")[0]
                elif "```" in analysis:
                    analysis = analysis.split("```")[1].split("```")[0]

                contract_data = json.loads(analysis.strip())

                return {
                    "success": True,
                    "contract_data": contract_data,
                    "filename": filename,
                    "extracted_at": datetime.utcnow().isoformat(),
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse contract extraction",
                    "raw_response": result["analysis"],
                    "filename": filename,
                }

        return {
            "success": False,
            "error": result.get("error", "Contract extraction failed"),
            "filename": filename,
        }

    # =========================================================================
    # ONBOARDING DOCUMENT VALIDATION
    # =========================================================================

    async def validate_onboarding_documents(
        self,
        documents: List[Dict[str, Any]],
        required_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Validate a set of onboarding documents.

        Args:
            documents: List of document info dicts with classification
            required_types: List of required document types

        Returns:
            Validation result with completeness status
        """
        if required_types is None:
            # Default JASPER onboarding requirements
            required_types = [
                "id_document",
                "proof_of_address",
                "registration",  # Company registration
            ]

        # Check what's present
        present_types = set()
        for doc in documents:
            if doc.get("document_type"):
                present_types.add(doc["document_type"])

        # Calculate completeness
        missing = [t for t in required_types if t not in present_types]
        extra = [t for t in present_types if t not in required_types]

        completeness = len(set(required_types) & present_types) / len(required_types) * 100

        return {
            "success": True,
            "is_complete": len(missing) == 0,
            "completeness_percentage": round(completeness, 1),
            "required_types": required_types,
            "present_types": list(present_types),
            "missing_types": missing,
            "extra_types": extra,
            "total_documents": len(documents),
            "validation_notes": self._generate_validation_notes(missing, extra),
        }

    def _generate_validation_notes(
        self,
        missing: List[str],
        extra: List[str],
    ) -> str:
        """Generate human-readable validation notes."""
        notes = []

        if missing:
            notes.append(f"Missing required documents: {', '.join(missing)}")
        else:
            notes.append("All required documents present")

        if extra:
            notes.append(f"Additional documents provided: {', '.join(extra)}")

        return "; ".join(notes)

    # =========================================================================
    # DOCUMENT SUMMARY (Using R1 for reasoning)
    # =========================================================================

    async def summarize_documents(
        self,
        documents: List[Dict[str, Any]],
        lead_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an executive summary of all onboarding documents.

        Uses DeepSeek R1 for reasoning and synthesis.

        Args:
            documents: List of extracted document data
            lead_context: Optional lead/client context

        Returns:
            Executive summary and recommendations
        """
        logger.info(f"Summarizing {len(documents)} documents")

        # Build context string
        doc_summaries = []
        for i, doc in enumerate(documents, 1):
            doc_type = doc.get("document_type", "unknown")
            summary = doc.get("analysis", doc.get("extracted_text", "No content"))[:500]
            doc_summaries.append(f"{i}. {doc_type}: {summary}")

        prompt = f"""Analyze these onboarding documents and provide an executive summary:

DOCUMENTS:
{chr(10).join(doc_summaries)}

{f"LEAD CONTEXT: {lead_context}" if lead_context else ""}

Provide:
1. OVERALL ASSESSMENT - Is the documentation complete and valid?
2. KEY INFORMATION - Summarize the most important details
3. CONCERNS - Any red flags or missing information
4. RECOMMENDATIONS - Next steps for the onboarding process

Respond in JSON:
{{
    "assessment": "complete|incomplete|concerns",
    "summary": "<executive summary>",
    "key_info": {{}},
    "concerns": [""],
    "recommendations": [""],
    "onboarding_ready": true|false
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=1500,
            temperature=0.5,
        )

        if result.get("content"):
            try:
                import json
                content = result["content"]

                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                summary = json.loads(content.strip())

                return {
                    "success": True,
                    "summary": summary,
                    "reasoning": result.get("reasoning"),
                    "model": result.get("model"),
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "summary": {"raw_summary": result["content"]},
                    "model": result.get("model"),
                }

        return {
            "success": False,
            "error": result.get("error", "Summary generation failed"),
        }


# Singleton instance
document_processor = DocumentProcessor()
