"""
JASPER Client Portal - Admin API
Dashboard, analytics, and management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.models.base import get_db
from app.models.company import Company, CompanyStatus
from app.models.contact import Contact
from app.models.project import Project, ProjectStage, Package
from app.models.invoice import Invoice, InvoiceStatus

router = APIRouter()


# ============================================
# RESPONSE SCHEMAS
# ============================================

class PipelineSummary(BaseModel):
    inquiry: int = 0
    qualify: int = 0
    intake: int = 0
    proposal: int = 0
    deposit: int = 0
    production: int = 0
    draft: int = 0
    final: int = 0


class RecentCompany(BaseModel):
    id: int
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardResponse(BaseModel):
    total_clients: int
    active_projects: int
    pipeline_summary: PipelineSummary
    revenue_this_month: int
    pending_payments: int
    recent_inquiries: List[RecentCompany]


# ============================================
# ENDPOINTS
# ============================================

@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(db: Session = Depends(get_db)):
    """
    Get admin dashboard with key metrics.
    Overview of clients, projects, revenue, and pipeline.
    """
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total clients
    total_clients = db.query(func.count(Company.id)).scalar() or 0

    # Active projects (in production stages)
    active_stages = [ProjectStage.DEPOSIT, ProjectStage.PRODUCTION, ProjectStage.DRAFT]
    active_projects = db.query(func.count(Project.id)).filter(
        Project.stage.in_(active_stages)
    ).scalar() or 0

    # Pipeline summary by project stage
    pipeline_summary = PipelineSummary()
    for stage in ProjectStage:
        count = db.query(func.count(Project.id)).filter(
            Project.stage == stage
        ).scalar() or 0
        setattr(pipeline_summary, stage.value, count)

    # Revenue this month (paid invoices)
    revenue_this_month = db.query(func.coalesce(func.sum(Invoice.final_amount), 0)).filter(
        Invoice.status == InvoiceStatus.PAID,
        Invoice.paid_at >= month_start
    ).scalar() or 0

    # Pending payments (unpaid invoices: draft, sent, viewed, overdue)
    pending_payments = db.query(func.coalesce(func.sum(Invoice.amount), 0)).filter(
        Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE])
    ).scalar() or 0

    # Recent inquiries (last 7 days)
    week_ago = now - timedelta(days=7)
    recent = db.query(Company).filter(
        Company.created_at >= week_ago
    ).order_by(Company.created_at.desc()).limit(5).all()

    return AdminDashboardResponse(
        total_clients=total_clients,
        active_projects=active_projects,
        pipeline_summary=pipeline_summary,
        revenue_this_month=revenue_this_month,
        pending_payments=pending_payments,
        recent_inquiries=[
            RecentCompany(
                id=c.id,
                name=c.name,
                status=c.status.value,
                created_at=c.created_at
            ) for c in recent
        ]
    )


@router.get("/analytics")
async def get_analytics(
    period: str = "month",
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for the specified period.
    Revenue trends, conversion rates, package breakdown.
    """
    # Package breakdown
    package_breakdown = {}
    for pkg in Package:
        projects = db.query(Project).filter(Project.package == pkg).all()
        package_breakdown[pkg.value] = {
            "count": len(projects),
            "revenue": sum(p.value for p in projects if p.value)
        }

    # Conversion funnel based on project stages
    total_inquiries = db.query(func.count(Project.id)).scalar() or 0
    qualified = db.query(func.count(Project.id)).filter(
        Project.stage != ProjectStage.INQUIRY
    ).scalar() or 0
    proposals_sent = db.query(func.count(Project.id)).filter(
        Project.stage.in_([ProjectStage.PROPOSAL, ProjectStage.DEPOSIT,
                          ProjectStage.PRODUCTION, ProjectStage.DRAFT, ProjectStage.FINAL])
    ).scalar() or 0
    deposits_paid = db.query(func.count(Project.id)).filter(
        Project.stage.in_([ProjectStage.PRODUCTION, ProjectStage.DRAFT, ProjectStage.FINAL])
    ).scalar() or 0
    completed = db.query(func.count(Project.id)).filter(
        Project.stage == ProjectStage.FINAL
    ).scalar() or 0

    return {
        "period": period,
        "package_breakdown": package_breakdown,
        "conversion_funnel": {
            "inquiries": total_inquiries,
            "qualified": qualified,
            "proposals_sent": proposals_sent,
            "deposits_paid": deposits_paid,
            "completed": completed
        },
        "conversion_rates": {
            "inquiry_to_qualified": f"{(qualified/total_inquiries*100) if total_inquiries else 0:.1f}%",
            "proposal_to_deposit": f"{(deposits_paid/proposals_sent*100) if proposals_sent else 0:.1f}%",
            "overall": f"{(completed/total_inquiries*100) if total_inquiries else 0:.1f}%"
        }
    }


@router.get("/clients/export")
async def export_clients(
    format: str = "csv",
    db: Session = Depends(get_db)
):
    """
    Export client list for external use.
    Supports CSV and JSON formats.
    """
    companies = db.query(Company).all()

    if format == "json":
        return {"clients": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status.value,
                "industry": c.industry.value,
                "country": c.country,
                "email": c.email,
                "created_at": c.created_at.isoformat()
            } for c in companies
        ]}

    # CSV format
    if not companies:
        return {"data": "No clients to export"}

    headers = ["id", "name", "status", "industry", "country", "email", "created_at"]
    rows = [",".join(headers)]

    for c in companies:
        row = [
            str(c.id),
            c.name,
            c.status.value,
            c.industry.value,
            c.country or "",
            c.email or "",
            c.created_at.isoformat()
        ]
        rows.append(",".join(row))

    return {
        "format": "csv",
        "data": "\n".join(rows),
        "filename": f"jasper_clients_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    }


@router.post("/notifications/send")
async def send_bulk_notification(
    client_ids: List[int],
    subject: str,
    message: str,
    notification_type: str = "email",
    db: Session = Depends(get_db)
):
    """
    Send bulk notifications to selected clients.
    Supports email and in-app notifications.
    """
    sent_count = 0

    for company_id in client_ids:
        company = db.query(Company).filter(Company.id == company_id).first()
        if company and company.email:
            # In production: queue emails via existing iMail system
            print(f"[NOTIFICATION] {notification_type} to {company.email}: {subject}")
            sent_count += 1

    return {
        "message": f"Notifications queued for {sent_count} clients",
        "sent_count": sent_count,
        "failed_count": len(client_ids) - sent_count
    }


@router.get("/settings")
async def get_admin_settings():
    """Get admin-configurable settings"""
    return {
        "packages": {
            "growth": {"price": 12000, "timeline_weeks": "4-6"},
            "institutional": {"price": 25000, "timeline_weeks": "6-8"},
            "infrastructure": {"price": 45000, "timeline_weeks": "10-12"}
        },
        "payment_methods": ["crypto", "paypal", "bank_transfer"],
        "crypto_discount": "3%",
        "invoice_due_days": 7,
        "email_templates": [
            "welcome",
            "intake_reminder",
            "proposal_sent",
            "invoice_created",
            "payment_received",
            "project_update",
            "draft_ready",
            "final_delivery"
        ]
    }
