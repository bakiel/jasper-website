"""
Supervisor Agent (The Watchman)
================================
Autonomous daily monitoring that understands goals and keeps company aligned.

Runs: 1-2x daily via APScheduler (morning + evening)
Model: Gemini 2.0 Flash (cost: ~$0.003/day)

Monitors:
- Content Pipeline: Articles in queue, enhancements needed
- Enhancement Status: Citation/link/A/B test coverage
- Lead Generation: Newsletter signups, contact submissions
- System Health: API response times, error rates

Notifications via:
- WhatsApp (primary) - existing gateway at localhost:3001
- Email (secondary) - existing iMail system
"""

import json
import os
import asyncio
import httpx
import logging
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

from services.task_tracker_service import task_tracker
from services.ai_router import AIRouter, AITask

logger = logging.getLogger(__name__)

# Configuration
DATA_DIR = Path("/opt/jasper-crm/data")
GOALS_FILE = DATA_DIR / "company_goals.json"
REPORTS_FILE = DATA_DIR / "supervisor_reports.json"

WHATSAPP_API = os.getenv("WHATSAPP_API", "http://localhost:3001")
OWNER_WHATSAPP = os.getenv("OWNER_WHATSAPP", "+27659387000")


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class ContentStatus:
    """Content pipeline status snapshot."""
    published_articles: int = 0
    draft_articles: int = 0
    articles_needing_enhancement: int = 0
    articles_fully_enhanced: int = 0
    enhancement_coverage: float = 0.0


@dataclass
class EnhancementStatus:
    """Enhancement system status."""
    tasks_today: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    tasks_pending: int = 0
    success_rate: float = 0.0
    citation_coverage: float = 0.0
    link_coverage: float = 0.0
    ab_test_coverage: float = 0.0


@dataclass
class LeadStatus:
    """Lead generation status."""
    newsletter_signups_24h: int = 0
    contact_submissions_24h: int = 0
    intake_forms_24h: int = 0
    total_leads_week: int = 0


@dataclass
class SystemHealth:
    """System health metrics."""
    api_healthy: bool = True
    enhancement_service_healthy: bool = True
    last_error: Optional[str] = None
    error_count_24h: int = 0


@dataclass
class DailyReport:
    """Daily supervisor report."""
    report_id: str = ""
    generated_at: str = ""
    report_type: str = "daily"  # daily, alert, weekly
    content: ContentStatus = None
    enhancement: EnhancementStatus = None
    leads: LeadStatus = None
    health: SystemHealth = None
    goal_alignment: Dict[str, Any] = None
    action_items: List[str] = None
    summary: str = ""

    def to_dict(self) -> dict:
        return {
            "report_id": self.report_id,
            "generated_at": self.generated_at,
            "report_type": self.report_type,
            "content": asdict(self.content) if self.content else {},
            "enhancement": asdict(self.enhancement) if self.enhancement else {},
            "leads": asdict(self.leads) if self.leads else {},
            "health": asdict(self.health) if self.health else {},
            "goal_alignment": self.goal_alignment or {},
            "action_items": self.action_items or [],
            "summary": self.summary
        }


# ============================================================================
# SUPERVISOR AGENT
# ============================================================================

class SupervisorAgent:
    """
    The Watchman - Autonomous daily monitoring agent.

    Gathers system status, checks goal alignment, generates reports,
    and notifies the owner via WhatsApp/Email.
    """

    def __init__(self):
        self.ai_router = AIRouter()
        self._ensure_data_files()

    def _ensure_data_files(self):
        """Create data files if they don't exist."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        if not GOALS_FILE.exists():
            self._save_goals(self._default_goals())

        if not REPORTS_FILE.exists():
            self._save_reports([])

    def _default_goals(self) -> dict:
        """Default company goals if none set."""
        return {
            "content": {
                "weekly_articles": 5,
                "enhancement_coverage_target": 0.8,
                "citation_coverage_target": 0.7
            },
            "leads": {
                "weekly_newsletter_target": 20,
                "weekly_contact_target": 5
            },
            "quality": {
                "enhancement_success_rate_target": 0.9,
                "max_failed_tasks_per_day": 3
            },
            "updated_at": datetime.now().isoformat()
        }

    def _load_goals(self) -> dict:
        """Load company goals."""
        try:
            with open(GOALS_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return self._default_goals()

    def _save_goals(self, goals: dict):
        """Save company goals."""
        with open(GOALS_FILE, "w") as f:
            json.dump(goals, f, indent=2, default=str)

    def _load_reports(self) -> list:
        """Load historical reports."""
        try:
            with open(REPORTS_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_reports(self, reports: list):
        """Save reports (keep last 30)."""
        reports = reports[-30:]  # Keep only last 30
        with open(REPORTS_FILE, "w") as f:
            json.dump(reports, f, indent=2, default=str)

    # -------------------------------------------------------------------------
    # STATUS GATHERING
    # -------------------------------------------------------------------------

    async def gather_content_status(self) -> ContentStatus:
        """Gather content pipeline status."""
        try:
            from services.link_builder_service import LinkBuilderService
            link_builder = LinkBuilderService()
            articles = link_builder._load_articles()

            published = [a for a in articles if a.get("status") == "published"]
            drafts = [a for a in articles if a.get("status") == "draft"]

            # Check enhancement status for each published article
            enhanced = 0
            for article in published:
                status = task_tracker.get_article_enhancement_status(article["slug"])
                if status.get("is_fully_enhanced"):
                    enhanced += 1

            coverage = enhanced / len(published) if published else 0

            return ContentStatus(
                published_articles=len(published),
                draft_articles=len(drafts),
                articles_needing_enhancement=len(published) - enhanced,
                articles_fully_enhanced=enhanced,
                enhancement_coverage=round(coverage * 100, 1)
            )

        except Exception as e:
            logger.error(f"Error gathering content status: {e}")
            return ContentStatus()

    async def gather_enhancement_status(self) -> EnhancementStatus:
        """Gather enhancement system status."""
        try:
            daily = task_tracker.get_daily_stats()
            overall = task_tracker.get_overall_stats()
            pending = task_tracker.get_pending_tasks()

            return EnhancementStatus(
                tasks_today=daily.get("total", 0),
                tasks_completed=daily.get("completed", 0),
                tasks_failed=daily.get("failed", 0),
                tasks_pending=len(pending),
                success_rate=overall.get("success_rate", 0),
                citation_coverage=0,  # Would need to calculate
                link_coverage=0,
                ab_test_coverage=0
            )

        except Exception as e:
            logger.error(f"Error gathering enhancement status: {e}")
            return EnhancementStatus()

    async def gather_lead_status(self) -> LeadStatus:
        """Gather lead generation status."""
        try:
            # Check lead database for recent signups
            from db import get_db_session
            from models.lead import Lead
            from sqlalchemy import func

            yesterday = datetime.now() - timedelta(days=1)
            week_ago = datetime.now() - timedelta(days=7)

            with get_db_session() as session:
                # Newsletter signups in last 24h
                newsletters_24h = session.query(func.count(Lead.id)).filter(
                    Lead.created_at >= yesterday,
                    Lead.source == "newsletter"
                ).scalar() or 0

                # Contact submissions in last 24h
                contacts_24h = session.query(func.count(Lead.id)).filter(
                    Lead.created_at >= yesterday,
                    Lead.source == "contact"
                ).scalar() or 0

                # Intake forms in last 24h
                intakes_24h = session.query(func.count(Lead.id)).filter(
                    Lead.created_at >= yesterday,
                    Lead.source == "intake"
                ).scalar() or 0

                # Total leads this week
                total_week = session.query(func.count(Lead.id)).filter(
                    Lead.created_at >= week_ago
                ).scalar() or 0

            return LeadStatus(
                newsletter_signups_24h=newsletters_24h,
                contact_submissions_24h=contacts_24h,
                intake_forms_24h=intakes_24h,
                total_leads_week=total_week
            )

        except Exception as e:
            logger.error(f"Error gathering lead status: {e}")
            return LeadStatus()

    async def gather_system_health(self) -> SystemHealth:
        """Check system health."""
        try:
            from services.enhancement_orchestrator import enhancement_orchestrator

            status = enhancement_orchestrator.get_status()

            return SystemHealth(
                api_healthy=True,
                enhancement_service_healthy=not status["orchestrator"]["is_running"],
                last_error=status["orchestrator"].get("last_error"),
                error_count_24h=status["orchestrator"].get("errors_today", 0)
            )

        except Exception as e:
            logger.error(f"Error checking system health: {e}")
            return SystemHealth(api_healthy=False, last_error=str(e))

    # -------------------------------------------------------------------------
    # GOAL ALIGNMENT
    # -------------------------------------------------------------------------

    async def check_goal_alignment(
        self,
        content: ContentStatus,
        enhancement: EnhancementStatus,
        leads: LeadStatus
    ) -> Dict[str, Any]:
        """Check current status against goals."""
        goals = self._load_goals()
        alignment = {"on_track": True, "gaps": [], "wins": []}

        # Check enhancement coverage
        target = goals["content"]["enhancement_coverage_target"] * 100
        actual = content.enhancement_coverage
        if actual < target:
            alignment["gaps"].append(
                f"Enhancement coverage at {actual}% (target: {target}%)"
            )
            alignment["on_track"] = False
        else:
            alignment["wins"].append(f"Enhancement coverage at {actual}%")

        # Check success rate
        target_rate = goals["quality"]["enhancement_success_rate_target"] * 100
        actual_rate = enhancement.success_rate
        if actual_rate < target_rate and enhancement.tasks_today > 0:
            alignment["gaps"].append(
                f"Success rate at {actual_rate}% (target: {target_rate}%)"
            )
            alignment["on_track"] = False

        # Check failed tasks
        max_failed = goals["quality"]["max_failed_tasks_per_day"]
        if enhancement.tasks_failed > max_failed:
            alignment["gaps"].append(
                f"{enhancement.tasks_failed} failed tasks today (max: {max_failed})"
            )
            alignment["on_track"] = False

        # Check lead generation (weekly perspective)
        if leads.total_leads_week > 0:
            alignment["wins"].append(f"{leads.total_leads_week} leads this week")

        return alignment

    # -------------------------------------------------------------------------
    # REPORT GENERATION
    # -------------------------------------------------------------------------

    async def generate_daily_report(self) -> DailyReport:
        """Generate comprehensive daily report."""
        logger.info("Generating daily supervisor report...")

        # Gather all status
        content = await self.gather_content_status()
        enhancement = await self.gather_enhancement_status()
        leads = await self.gather_lead_status()
        health = await self.gather_system_health()

        # Check goal alignment
        goal_alignment = await self.check_goal_alignment(content, enhancement, leads)

        # Generate action items
        action_items = []
        if content.articles_needing_enhancement > 0:
            action_items.append(
                f"Queue enhancement for {content.articles_needing_enhancement} articles"
            )
        if enhancement.tasks_pending > 5:
            action_items.append(f"Clear pending task backlog ({enhancement.tasks_pending} tasks)")
        if enhancement.tasks_failed > 0:
            action_items.append(f"Review {enhancement.tasks_failed} failed tasks")
        if health.last_error:
            action_items.append(f"Investigate error: {health.last_error[:50]}...")

        # Generate summary using AI
        summary = await self._generate_summary(content, enhancement, leads, goal_alignment)

        report = DailyReport(
            report_id=f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            generated_at=datetime.now().isoformat(),
            report_type="daily",
            content=content,
            enhancement=enhancement,
            leads=leads,
            health=health,
            goal_alignment=goal_alignment,
            action_items=action_items,
            summary=summary
        )

        # Save report
        reports = self._load_reports()
        reports.append(report.to_dict())
        self._save_reports(reports)

        return report

    async def _generate_summary(
        self,
        content: ContentStatus,
        enhancement: EnhancementStatus,
        leads: LeadStatus,
        goal_alignment: Dict[str, Any]
    ) -> str:
        """Generate AI summary of status."""
        try:
            prompt = f"""Generate a 2-3 sentence executive summary of this JASPER system status:

Content: {content.published_articles} published, {content.articles_needing_enhancement} need enhancement
Enhancement: {enhancement.tasks_today} tasks today, {enhancement.success_rate}% success rate
Leads: {leads.newsletter_signups_24h} newsletter signups, {leads.contact_submissions_24h} contacts in 24h
Goal Status: {'On track' if goal_alignment['on_track'] else 'Needs attention'}
Gaps: {', '.join(goal_alignment['gaps']) if goal_alignment['gaps'] else 'None'}

Be concise and highlight what needs attention."""

            response = await self.ai_router.route(
                task=AITask.SUMMARY,
                prompt=prompt,
                max_tokens=200
            )

            return response.get("content", "Status check complete.")

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"System status: {content.published_articles} articles, {enhancement.tasks_pending} pending tasks."

    # -------------------------------------------------------------------------
    # NOTIFICATIONS
    # -------------------------------------------------------------------------

    async def send_whatsapp_brief(self, report: DailyReport) -> bool:
        """Send daily brief via WhatsApp."""
        try:
            # Format message
            status_emoji = "✅" if report.goal_alignment.get("on_track") else "⚠️"
            message = f"""📊 *JASPER Daily Brief*
{status_emoji} {datetime.now().strftime('%d %b %Y')}

*Content*
• {report.content.published_articles} articles live
• {report.content.articles_needing_enhancement} need enhancement

*Tasks Today*
• {report.enhancement.tasks_completed} completed
• {report.enhancement.tasks_failed} failed
• {report.enhancement.tasks_pending} pending

*Leads (24h)*
• {report.leads.newsletter_signups_24h} newsletter signups
• {report.leads.contact_submissions_24h} contact forms

{report.summary}"""

            if report.action_items:
                message += "\n\n*Action Items*"
                for item in report.action_items[:3]:
                    message += f"\n• {item}"

            # Send via WhatsApp gateway
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{WHATSAPP_API}/send",
                    json={
                        "phone": OWNER_WHATSAPP,
                        "message": message
                    }
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            return False

    async def send_alert(self, alert_type: str, message: str) -> bool:
        """Send immediate alert via WhatsApp."""
        try:
            alert_msg = f"🚨 *JASPER Alert*\n\n{alert_type}\n\n{message}"

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{WHATSAPP_API}/send",
                    json={
                        "phone": OWNER_WHATSAPP,
                        "message": alert_msg
                    }
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"Alert send failed: {e}")
            return False

    # -------------------------------------------------------------------------
    # SCHEDULED RUNS
    # -------------------------------------------------------------------------

    async def run_morning_check(self) -> DailyReport:
        """Morning status check (runs via scheduler)."""
        logger.info("Running morning supervisor check...")
        report = await self.generate_daily_report()

        # Send WhatsApp brief
        await self.send_whatsapp_brief(report)

        # Check for critical issues
        if report.enhancement.tasks_failed > 5:
            await self.send_alert(
                "High Failure Rate",
                f"{report.enhancement.tasks_failed} tasks failed today. Check logs."
            )

        return report

    async def run_evening_check(self) -> DailyReport:
        """Evening status check (runs via scheduler)."""
        logger.info("Running evening supervisor check...")
        report = await self.generate_daily_report()

        # Only send brief if there are action items or issues
        if report.action_items or not report.goal_alignment.get("on_track"):
            await self.send_whatsapp_brief(report)

        return report

    # -------------------------------------------------------------------------
    # API METHODS
    # -------------------------------------------------------------------------

    def get_latest_report(self) -> Optional[dict]:
        """Get the most recent report."""
        reports = self._load_reports()
        return reports[-1] if reports else None

    def get_reports(self, limit: int = 10) -> List[dict]:
        """Get recent reports."""
        reports = self._load_reports()
        return reports[-limit:]

    def get_goals(self) -> dict:
        """Get current goals."""
        return self._load_goals()

    def update_goals(self, new_goals: dict) -> dict:
        """Update company goals."""
        goals = self._load_goals()
        goals.update(new_goals)
        goals["updated_at"] = datetime.now().isoformat()
        self._save_goals(goals)
        return goals


# Singleton instance
supervisor_agent = SupervisorAgent()
