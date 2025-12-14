"""
JASPER CRM - Admin Document Reports Routes

API endpoints for admin to review AI-generated document reports:
- List all document reports
- View individual report details
- Update report status
- Get report notifications
"""

import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db import get_db
from services.document_report_service import (
    document_report_service,
    ReportStatus,
    ReportPriority,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/reports", tags=["Admin Reports"])


# In-memory store for demo (replace with DB in production)
_reports_store: dict = {}
_notifications_store: list = []


# --- Request/Response Models ---

class AnalyzeDocumentRequest(BaseModel):
    """Request to analyze a document and generate report"""
    image_data: str = Field(..., description="Base64 encoded document")
    filename: str = Field(..., description="Original filename")
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    project_id: Optional[int] = None
    context: Optional[str] = None


class AnalyzeBatchRequest(BaseModel):
    """Request to analyze multiple documents"""
    documents: List[dict] = Field(..., description="List of {image_data, filename}")
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    project_id: Optional[int] = None


class UpdateReportRequest(BaseModel):
    """Request to update report status"""
    status: str = Field(..., description="New status: reviewed, actioned, archived")
    admin_notes: Optional[str] = None


# --- ENDPOINTS ---

@router.post("/analyze")
async def analyze_document_and_report(request: AnalyzeDocumentRequest):
    """
    Analyze a document and generate admin report.

    Full AI analysis flow:
    1. Classify document type
    2. Extract relevant information
    3. Generate AI summary
    4. Create admin report
    5. Generate notification

    Returns complete report and notification data.
    """
    try:
        result = await document_report_service.analyze_and_report(
            image_data=request.image_data,
            filename=request.filename,
            client_id=request.client_id,
            client_name=request.client_name,
            project_id=request.project_id,
            context=request.context,
        )

        if result.get("success"):
            # Store report
            report = result.get("report", {})
            report_id = report.get("id")
            if report_id:
                _reports_store[report_id] = report

            # Store notification
            notification = result.get("notification", {})
            if notification:
                _notifications_store.append(notification)

            return result

        raise HTTPException(status_code=500, detail="Analysis failed")

    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/batch")
async def analyze_batch_and_report(request: AnalyzeBatchRequest):
    """
    Analyze multiple documents and generate combined report.

    Processes all documents and provides:
    - Individual analysis for each document
    - Combined summary
    - Onboarding completeness check
    - Single notification for batch
    """
    try:
        result = await document_report_service.analyze_batch(
            documents=request.documents,
            client_id=request.client_id,
            client_name=request.client_name,
            project_id=request.project_id,
        )

        if result.get("success"):
            # Store individual reports
            for res in result.get("results", []):
                report = res.get("report", {})
                report_id = report.get("id")
                if report_id:
                    _reports_store[report_id] = report

            # Store combined notification
            notification = result.get("combined_notification", {})
            if notification:
                _notifications_store.append(notification)

            return result

        raise HTTPException(status_code=500, detail="Batch analysis failed")

    except Exception as e:
        logger.error(f"Batch analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_reports(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    limit: int = Query(50, description="Max results"),
    offset: int = Query(0, description="Offset for pagination"),
):
    """
    List all document reports for admin review.

    Supports filtering by:
    - status: pending, reviewed, actioned, archived
    - priority: low, medium, high, urgent
    - client_id: specific client
    """
    reports = list(_reports_store.values())

    # Apply filters
    if status:
        reports = [r for r in reports if r.get("status") == status]
    if priority:
        reports = [r for r in reports if r.get("priority") == priority]
    if client_id:
        reports = [r for r in reports if r.get("client_id") == client_id]

    # Sort by created_at desc
    reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Paginate
    total = len(reports)
    reports = reports[offset:offset + limit]

    return {
        "success": True,
        "reports": reports,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/pending")
async def get_pending_reports():
    """
    Get all pending reports requiring admin attention.

    Returns reports with status='pending', sorted by priority.
    """
    reports = [
        r for r in _reports_store.values()
        if r.get("status") == "pending"
    ]

    # Sort by priority (urgent > high > medium > low)
    priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
    reports.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))

    return {
        "success": True,
        "reports": reports,
        "total": len(reports),
    }


@router.get("/{report_id}")
async def get_report(report_id: str):
    """
    Get a specific report by ID.

    Returns full report details including:
    - Document classification
    - Extracted data
    - AI summary and recommendations
    - Status history
    """
    report = _reports_store.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "success": True,
        "report": report,
    }


@router.patch("/{report_id}")
async def update_report(report_id: str, request: UpdateReportRequest):
    """
    Update report status and add admin notes.

    Status transitions:
    - pending → reviewed (admin viewed)
    - reviewed → actioned (action taken)
    - any → archived (no longer relevant)
    """
    report = _reports_store.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Validate status
    valid_statuses = [s.value for s in ReportStatus]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    # Update report
    report["status"] = request.status
    report["reviewed_at"] = datetime.utcnow().isoformat()

    if request.admin_notes:
        existing_notes = report.get("admin_notes", "")
        if existing_notes:
            report["admin_notes"] = f"{existing_notes}\n\n{request.admin_notes}"
        else:
            report["admin_notes"] = request.admin_notes

    _reports_store[report_id] = report

    return {
        "success": True,
        "report": report,
    }


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    """
    Delete a report (archive it permanently).
    """
    if report_id not in _reports_store:
        raise HTTPException(status_code=404, detail="Report not found")

    del _reports_store[report_id]

    return {
        "success": True,
        "message": f"Report {report_id} deleted",
    }


# --- NOTIFICATION ENDPOINTS ---

@router.get("/notifications/list")
async def list_notifications(
    unread_only: bool = Query(False, description="Only unread"),
    limit: int = Query(20, description="Max results"),
):
    """
    Get document report notifications for admin.
    """
    notifications = _notifications_store.copy()

    if unread_only:
        notifications = [n for n in notifications if not n.get("is_read")]

    # Sort by created_at desc
    notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Limit
    notifications = notifications[:limit]

    unread_count = len([n for n in _notifications_store if not n.get("is_read")])

    return {
        "success": True,
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(_notifications_store),
    }


@router.patch("/notifications/{index}/read")
async def mark_notification_read(index: int):
    """
    Mark a notification as read.
    """
    if index < 0 or index >= len(_notifications_store):
        raise HTTPException(status_code=404, detail="Notification not found")

    _notifications_store[index]["is_read"] = True

    return {
        "success": True,
        "message": "Notification marked as read",
    }


@router.patch("/notifications/read-all")
async def mark_all_notifications_read():
    """
    Mark all notifications as read.
    """
    for notification in _notifications_store:
        notification["is_read"] = True

    return {
        "success": True,
        "message": "All notifications marked as read",
    }


# --- STATS ENDPOINT ---

@router.get("/stats")
async def get_report_stats():
    """
    Get report statistics for admin dashboard.
    """
    reports = list(_reports_store.values())

    # Count by status
    status_counts = {}
    for status in ReportStatus:
        status_counts[status.value] = len([
            r for r in reports if r.get("status") == status.value
        ])

    # Count by priority
    priority_counts = {}
    for priority in ReportPriority:
        priority_counts[priority.value] = len([
            r for r in reports if r.get("priority") == priority.value
        ])

    # Count by document type
    type_counts = {}
    for report in reports:
        doc_type = report.get("document_type", "unknown")
        type_counts[doc_type] = type_counts.get(doc_type, 0) + 1

    # Action required count
    action_required = len([r for r in reports if r.get("action_required")])

    return {
        "success": True,
        "total_reports": len(reports),
        "pending_review": status_counts.get("pending", 0),
        "action_required": action_required,
        "by_status": status_counts,
        "by_priority": priority_counts,
        "by_document_type": type_counts,
        "unread_notifications": len([
            n for n in _notifications_store if not n.get("is_read")
        ]),
    }
