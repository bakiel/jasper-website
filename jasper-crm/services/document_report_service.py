"""
JASPER CRM - Document Report Service

AI-powered document analysis that generates admin reports:
1. Client uploads document via portal
2. DeepSeek VL analyzes document
3. AI extracts key information
4. Generates structured report
5. Creates admin notification with summary
6. Stores report for admin review

Flow: Portal Upload → AI Analysis → Report → Admin Notification
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from agents.document_processor import document_processor, DocumentType
from services.deepseek_router import deepseek_router, TaskType

logger = logging.getLogger(__name__)


class ReportPriority(str, Enum):
    """Report priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ReportStatus(str, Enum):
    """Report status"""
    PENDING = "pending"       # Awaiting admin review
    REVIEWED = "reviewed"     # Admin has viewed
    ACTIONED = "actioned"     # Action taken
    ARCHIVED = "archived"     # Archived


class DocumentReportService:
    """
    AI Document Analysis → Admin Report Service

    Handles the complete flow:
    1. Receive uploaded document
    2. Process with DeepSeek VL
    3. Generate analysis report
    4. Create admin notification
    5. Store for admin dashboard
    """

    def __init__(self):
        self.processor = document_processor
        self.router = deepseek_router
        logger.info("DocumentReportService initialized")

    # =========================================================================
    # MAIN: ANALYZE AND REPORT
    # =========================================================================

    async def analyze_and_report(
        self,
        image_data: str,
        filename: str,
        client_id: Optional[int] = None,
        client_name: Optional[str] = None,
        project_id: Optional[int] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Complete document analysis and admin report generation.

        Args:
            image_data: Base64 encoded document
            filename: Original filename
            client_id: Client who uploaded
            client_name: Client name for report
            project_id: Associated project if any
            context: Additional context

        Returns:
            Dict with analysis, report, and notification info
        """
        logger.info(f"Starting analysis and report for: {filename}")

        # Step 1: Classify document
        classification = await self.processor.classify_document(
            image_data=image_data,
            filename=filename,
        )

        doc_type = classification.get("document_type", "other")
        confidence = classification.get("confidence", "medium")

        # Step 2: Extract based on document type
        extraction = await self._extract_by_type(
            image_data=image_data,
            doc_type=doc_type,
            filename=filename,
        )

        # Step 3: Generate AI summary and recommendations
        ai_summary = await self._generate_ai_summary(
            classification=classification,
            extraction=extraction,
            client_name=client_name,
            context=context,
        )

        # Step 4: Determine priority
        priority = self._determine_priority(
            doc_type=doc_type,
            confidence=confidence,
            extraction=extraction,
        )

        # Step 5: Build admin report
        report = self._build_admin_report(
            filename=filename,
            classification=classification,
            extraction=extraction,
            ai_summary=ai_summary,
            priority=priority,
            client_id=client_id,
            client_name=client_name,
            project_id=project_id,
        )

        # Step 6: Create notification data
        notification = self._create_notification(
            report=report,
            client_name=client_name,
        )

        return {
            "success": True,
            "filename": filename,
            "document_type": doc_type,
            "confidence": confidence,
            "extraction": extraction,
            "report": report,
            "notification": notification,
            "processed_at": datetime.utcnow().isoformat(),
        }

    # =========================================================================
    # EXTRACTION BY TYPE
    # =========================================================================

    async def _extract_by_type(
        self,
        image_data: str,
        doc_type: str,
        filename: str,
    ) -> Dict[str, Any]:
        """Extract data based on document type."""

        if doc_type == "id_document":
            result = await self.processor.extract_id_document(
                image_data=image_data,
                filename=filename,
            )
            return result.get("id_data", {})

        elif doc_type in ["financial", "invoice", "receipt"]:
            result = await self.processor.extract_financial_document(
                image_data=image_data,
                filename=filename,
            )
            return result.get("financial_data", {})

        elif doc_type == "contract":
            result = await self.processor.extract_contract(
                image_data=image_data,
                filename=filename,
            )
            return result.get("contract_data", {})

        else:
            # General OCR for other types
            result = await self.processor.extract_text(
                image_data=image_data,
                filename=filename,
            )
            return {
                "text": result.get("extracted_text", ""),
                "structured": result.get("structured_data", {}),
            }

    # =========================================================================
    # AI SUMMARY GENERATION
    # =========================================================================

    async def _generate_ai_summary(
        self,
        classification: Dict[str, Any],
        extraction: Dict[str, Any],
        client_name: Optional[str],
        context: Optional[str],
    ) -> Dict[str, Any]:
        """
        Generate AI summary and recommendations using DeepSeek R1.
        """
        prompt = f"""Analyze this document extraction and provide an admin summary:

DOCUMENT TYPE: {classification.get('document_type')}
CONFIDENCE: {classification.get('confidence')}
{f"CLIENT: {client_name}" if client_name else ""}
{f"CONTEXT: {context}" if context else ""}

EXTRACTED DATA:
{extraction}

Provide JSON:
{{
    "summary": "<2-3 sentence summary for admin>",
    "key_findings": ["<finding 1>", "<finding 2>"],
    "action_required": true|false,
    "suggested_actions": ["<action 1>", "<action 2>"],
    "concerns": ["<any red flags or concerns>"],
    "onboarding_relevance": "high|medium|low",
    "admin_notes": "<any additional notes>"
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=800,
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

                return json.loads(content.strip())
            except:
                return {
                    "summary": result["content"][:500],
                    "key_findings": [],
                    "action_required": False,
                    "suggested_actions": [],
                    "concerns": [],
                    "onboarding_relevance": "medium",
                    "admin_notes": "",
                }

        return {
            "summary": "Analysis could not be completed",
            "key_findings": [],
            "action_required": True,
            "suggested_actions": ["Manual review required"],
            "concerns": ["AI analysis failed"],
            "onboarding_relevance": "medium",
            "admin_notes": "",
        }

    # =========================================================================
    # PRIORITY DETERMINATION
    # =========================================================================

    def _determine_priority(
        self,
        doc_type: str,
        confidence: str,
        extraction: Dict[str, Any],
    ) -> ReportPriority:
        """Determine report priority based on document analysis."""

        # High priority document types
        high_priority_types = ["id_document", "contract", "registration"]
        if doc_type in high_priority_types:
            return ReportPriority.HIGH

        # Financial documents with significant amounts
        if doc_type in ["financial", "invoice"]:
            amounts = extraction.get("amounts", {})
            total = amounts.get("total", 0)
            if total and total > 100000:  # Over R100k
                return ReportPriority.HIGH
            return ReportPriority.MEDIUM

        # Low confidence = needs manual review
        if confidence == "low":
            return ReportPriority.HIGH

        return ReportPriority.MEDIUM

    # =========================================================================
    # BUILD ADMIN REPORT
    # =========================================================================

    def _build_admin_report(
        self,
        filename: str,
        classification: Dict[str, Any],
        extraction: Dict[str, Any],
        ai_summary: Dict[str, Any],
        priority: ReportPriority,
        client_id: Optional[int],
        client_name: Optional[str],
        project_id: Optional[int],
    ) -> Dict[str, Any]:
        """Build structured admin report."""

        return {
            "id": f"DOC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "filename": filename,
            "document_type": classification.get("document_type"),
            "classification_confidence": classification.get("confidence"),
            "classification_reason": classification.get("reason"),

            "client_id": client_id,
            "client_name": client_name,
            "project_id": project_id,

            "extracted_data": extraction,

            "ai_summary": ai_summary.get("summary"),
            "key_findings": ai_summary.get("key_findings", []),
            "action_required": ai_summary.get("action_required", False),
            "suggested_actions": ai_summary.get("suggested_actions", []),
            "concerns": ai_summary.get("concerns", []),
            "onboarding_relevance": ai_summary.get("onboarding_relevance"),
            "admin_notes": ai_summary.get("admin_notes"),

            "priority": priority.value,
            "status": ReportStatus.PENDING.value,

            "created_at": datetime.utcnow().isoformat(),
            "reviewed_at": None,
            "reviewed_by": None,
        }

    # =========================================================================
    # CREATE NOTIFICATION
    # =========================================================================

    def _create_notification(
        self,
        report: Dict[str, Any],
        client_name: Optional[str],
    ) -> Dict[str, Any]:
        """Create admin notification from report."""

        doc_type_label = report.get("document_type", "document").replace("_", " ").title()
        priority = report.get("priority", "medium")

        # Build notification title
        if client_name:
            title = f"New {doc_type_label} from {client_name}"
        else:
            title = f"New {doc_type_label} Uploaded"

        # Build notification message
        summary = report.get("ai_summary", "Document requires review")
        action_required = report.get("action_required", False)

        if action_required:
            message = f"{summary} — Action Required"
        else:
            message = summary

        return {
            "type": "document",
            "title": title,
            "message": message,
            "link": f"/admin/documents/{report.get('id')}",
            "priority": priority,
            "user_id": "admin",  # Will be sent to admin users
            "is_read": False,
            "report_id": report.get("id"),
            "created_at": datetime.utcnow().isoformat(),
        }

    # =========================================================================
    # BATCH ANALYSIS (Multiple Documents)
    # =========================================================================

    async def analyze_batch(
        self,
        documents: List[Dict[str, Any]],
        client_id: Optional[int] = None,
        client_name: Optional[str] = None,
        project_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Analyze multiple documents and generate combined report.

        Args:
            documents: List of {image_data, filename} dicts
            client_id: Client who uploaded
            client_name: Client name
            project_id: Associated project

        Returns:
            Combined analysis and report
        """
        results = []
        reports = []

        for doc in documents:
            result = await self.analyze_and_report(
                image_data=doc.get("image_data"),
                filename=doc.get("filename"),
                client_id=client_id,
                client_name=client_name,
                project_id=project_id,
            )
            results.append(result)
            if result.get("report"):
                reports.append(result["report"])

        # Generate combined summary
        combined_summary = await self._generate_batch_summary(
            reports=reports,
            client_name=client_name,
        )

        return {
            "success": True,
            "total_documents": len(documents),
            "results": results,
            "combined_summary": combined_summary,
            "combined_notification": self._create_batch_notification(
                reports=reports,
                combined_summary=combined_summary,
                client_name=client_name,
            ),
        }

    async def _generate_batch_summary(
        self,
        reports: List[Dict[str, Any]],
        client_name: Optional[str],
    ) -> Dict[str, Any]:
        """Generate summary for batch of documents."""

        # Collect document info
        doc_types = [r.get("document_type") for r in reports]
        all_findings = []
        all_concerns = []
        all_actions = []

        for r in reports:
            all_findings.extend(r.get("key_findings", []))
            all_concerns.extend(r.get("concerns", []))
            all_actions.extend(r.get("suggested_actions", []))

        prompt = f"""Summarize this batch of documents for admin review:

CLIENT: {client_name or 'Unknown'}
DOCUMENTS: {len(reports)} documents
TYPES: {', '.join(set(doc_types))}

KEY FINDINGS:
{all_findings}

CONCERNS:
{all_concerns}

SUGGESTED ACTIONS:
{all_actions}

Provide JSON:
{{
    "batch_summary": "<executive summary>",
    "completeness": "complete|partial|incomplete",
    "missing_documents": ["<any missing required docs>"],
    "overall_assessment": "<assessment>",
    "priority_actions": ["<top priority actions>"],
    "onboarding_status": "ready|needs_attention|blocked"
}}"""

        result = await self.router.route(
            task=TaskType.REASONING,
            prompt=prompt,
            max_tokens=600,
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
                return json.loads(content.strip())
            except:
                pass

        return {
            "batch_summary": f"Processed {len(reports)} documents",
            "completeness": "partial",
            "missing_documents": [],
            "overall_assessment": "Manual review required",
            "priority_actions": ["Review uploaded documents"],
            "onboarding_status": "needs_attention",
        }

    def _create_batch_notification(
        self,
        reports: List[Dict[str, Any]],
        combined_summary: Dict[str, Any],
        client_name: Optional[str],
    ) -> Dict[str, Any]:
        """Create notification for batch upload."""

        title = f"{len(reports)} Documents from {client_name or 'Client'}"
        status = combined_summary.get("onboarding_status", "needs_attention")

        if status == "ready":
            message = "All onboarding documents received and verified"
            priority = "medium"
        elif status == "blocked":
            message = "Critical issues found - immediate attention required"
            priority = "urgent"
        else:
            message = combined_summary.get("batch_summary", "Documents require review")
            priority = "high"

        return {
            "type": "document_batch",
            "title": title,
            "message": message,
            "priority": priority,
            "user_id": "admin",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
        }


# Singleton instance
document_report_service = DocumentReportService()
