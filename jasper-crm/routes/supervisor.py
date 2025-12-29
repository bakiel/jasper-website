"""
Supervisor Agent Routes
=======================
API endpoints for The Watchman - autonomous monitoring system.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel

from services.supervisor_agent import supervisor_agent

router = APIRouter(prefix="/api/v1/supervisor", tags=["supervisor"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class GoalsUpdate(BaseModel):
    content: Optional[dict] = None
    leads: Optional[dict] = None
    quality: Optional[dict] = None


class ReportResponse(BaseModel):
    report_id: str
    generated_at: str
    report_type: str
    summary: str
    content: dict
    enhancement: dict
    leads: dict
    health: dict
    goal_alignment: dict
    action_items: List[str]


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check for supervisor agent."""
    latest = supervisor_agent.get_latest_report()
    return {
        "service": "supervisor-agent",
        "status": "healthy",
        "last_report": latest.get("generated_at") if latest else None,
        "alias": "The Watchman"
    }


# ============================================================================
# REPORTS
# ============================================================================

@router.get("/report/latest")
async def get_latest_report():
    """Get the most recent supervisor report."""
    report = supervisor_agent.get_latest_report()
    if not report:
        raise HTTPException(status_code=404, detail="No reports generated yet")
    return report


@router.get("/reports")
async def get_reports(limit: int = 10):
    """Get recent supervisor reports."""
    reports = supervisor_agent.get_reports(limit=limit)
    return {
        "total": len(reports),
        "reports": reports
    }


@router.post("/report/generate")
async def generate_report(
    background_tasks: BackgroundTasks,
    sync: bool = False
):
    """
    Generate a new supervisor report.

    By default runs in background. Set sync=true to wait for completion.
    """
    if sync:
        report = await supervisor_agent.generate_daily_report()
        return report.to_dict()
    else:
        background_tasks.add_task(supervisor_agent.generate_daily_report)
        return {
            "status": "generating",
            "message": "Report generation started in background"
        }


# ============================================================================
# SCHEDULED CHECKS
# ============================================================================

@router.post("/check/morning")
async def run_morning_check(background_tasks: BackgroundTasks):
    """
    Run morning supervisor check with WhatsApp notification.
    Normally triggered by scheduler, can be run manually.
    """
    background_tasks.add_task(supervisor_agent.run_morning_check)
    return {
        "status": "running",
        "message": "Morning check started with WhatsApp notification"
    }


@router.post("/check/evening")
async def run_evening_check(background_tasks: BackgroundTasks):
    """
    Run evening supervisor check.
    Only notifies if there are issues or action items.
    """
    background_tasks.add_task(supervisor_agent.run_evening_check)
    return {
        "status": "running",
        "message": "Evening check started"
    }


# ============================================================================
# GOALS
# ============================================================================

@router.get("/goals")
async def get_goals():
    """Get current company goals."""
    return supervisor_agent.get_goals()


@router.put("/goals")
async def update_goals(goals: GoalsUpdate):
    """Update company goals."""
    update_data = {}
    if goals.content:
        update_data["content"] = goals.content
    if goals.leads:
        update_data["leads"] = goals.leads
    if goals.quality:
        update_data["quality"] = goals.quality

    updated = supervisor_agent.update_goals(update_data)
    return {
        "success": True,
        "message": "Goals updated",
        "goals": updated
    }


# ============================================================================
# ALERTS
# ============================================================================

@router.post("/alert")
async def send_alert(alert_type: str, message: str):
    """
    Send an immediate alert via WhatsApp.
    Use sparingly - for critical issues only.
    """
    success = await supervisor_agent.send_alert(alert_type, message)
    return {
        "success": success,
        "message": "Alert sent" if success else "Alert failed"
    }


# ============================================================================
# STATUS GATHERING (for debugging)
# ============================================================================

@router.get("/status/content")
async def get_content_status():
    """Get current content pipeline status."""
    status = await supervisor_agent.gather_content_status()
    return {
        "published_articles": status.published_articles,
        "draft_articles": status.draft_articles,
        "articles_needing_enhancement": status.articles_needing_enhancement,
        "articles_fully_enhanced": status.articles_fully_enhanced,
        "enhancement_coverage": status.enhancement_coverage
    }


@router.get("/status/enhancement")
async def get_enhancement_status():
    """Get current enhancement system status."""
    status = await supervisor_agent.gather_enhancement_status()
    return {
        "tasks_today": status.tasks_today,
        "tasks_completed": status.tasks_completed,
        "tasks_failed": status.tasks_failed,
        "tasks_pending": status.tasks_pending,
        "success_rate": status.success_rate
    }


@router.get("/status/leads")
async def get_lead_status():
    """Get current lead generation status."""
    status = await supervisor_agent.gather_lead_status()
    return {
        "newsletter_signups_24h": status.newsletter_signups_24h,
        "contact_submissions_24h": status.contact_submissions_24h,
        "intake_forms_24h": status.intake_forms_24h,
        "total_leads_week": status.total_leads_week
    }


@router.get("/status/health")
async def get_system_health():
    """Get system health status."""
    status = await supervisor_agent.gather_system_health()
    return {
        "api_healthy": status.api_healthy,
        "enhancement_service_healthy": status.enhancement_service_healthy,
        "last_error": status.last_error,
        "error_count_24h": status.error_count_24h
    }
