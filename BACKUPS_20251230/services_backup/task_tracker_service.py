"""
Task Tracker Service
====================
Tracks enhancement tasks with status, timing, and anti-waste logic.

Task States: pending -> running -> verifying -> completed / failed

Features:
- Prevents duplicate work (anti-waste)
- Tracks task history per article
- Quality verification tracking
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Literal
from enum import Enum

# Data storage
DATA_DIR = Path("/opt/jasper-crm/data")
TASKS_FILE = DATA_DIR / "enhancement_tasks.json"


class TaskType(str, Enum):
    CITATIONS = "citations"
    INTERNAL_LINKS = "internal_links"
    AB_TITLES = "ab_titles"
    FULL_ENHANCEMENT = "full_enhancement"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    VERIFYING = "verifying"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskTrackerService:
    """Tracks enhancement tasks with anti-waste logic."""

    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        """Create data file if it doesn't exist."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not TASKS_FILE.exists():
            self._save_data({"tasks": [], "stats": {"total": 0, "completed": 0, "failed": 0}})

    def _load_data(self) -> dict:
        """Load tasks from file."""
        try:
            with open(TASKS_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {"tasks": [], "stats": {"total": 0, "completed": 0, "failed": 0}}

    def _save_data(self, data: dict):
        """Save tasks to file."""
        with open(TASKS_FILE, "w") as f:
            json.dump(data, f, indent=2, default=str)

    # -------------------------------------------------------------------------
    # TASK CREATION
    # -------------------------------------------------------------------------

    def create_task(
        self,
        article_slug: str,
        task_type: TaskType,
        triggered_by: str = "auto"
    ) -> Optional[str]:
        """
        Create a new enhancement task.
        Returns task_id if created, None if duplicate/unnecessary.

        Anti-waste: Skips if same task completed in last 7 days.
        """
        data = self._load_data()

        # Anti-waste check: Has this task been completed recently?
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        for task in data["tasks"]:
            if (task["article_slug"] == article_slug and
                task["task_type"] == task_type and
                task["status"] == "completed" and
                task.get("completed_at", "") > seven_days_ago):
                return None  # Skip - already done recently

        # Check if task is already pending/running
        for task in data["tasks"]:
            if (task["article_slug"] == article_slug and
                task["task_type"] == task_type and
                task["status"] in ["pending", "running", "verifying"]):
                return None  # Skip - already in progress

        # Create new task
        task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{article_slug[:20]}_{task_type}"

        new_task = {
            "task_id": task_id,
            "article_slug": article_slug,
            "task_type": task_type,
            "status": "pending",
            "triggered_by": triggered_by,
            "created_at": datetime.now().isoformat(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "verification": None,
            "error": None
        }

        data["tasks"].append(new_task)
        data["stats"]["total"] += 1
        self._save_data(data)

        return task_id

    # -------------------------------------------------------------------------
    # STATUS UPDATES
    # -------------------------------------------------------------------------

    def update_status(
        self,
        task_id: str,
        status: TaskStatus,
        result: Optional[dict] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update task status."""
        data = self._load_data()

        for task in data["tasks"]:
            if task["task_id"] == task_id:
                task["status"] = status

                if status == "running":
                    task["started_at"] = datetime.now().isoformat()
                elif status in ["completed", "failed"]:
                    task["completed_at"] = datetime.now().isoformat()
                    if status == "completed":
                        data["stats"]["completed"] += 1
                    else:
                        data["stats"]["failed"] += 1

                if result:
                    task["result"] = result
                if error:
                    task["error"] = error

                self._save_data(data)
                return True

        return False

    def set_verification(self, task_id: str, verification: dict) -> bool:
        """Set verification results for a task."""
        data = self._load_data()

        for task in data["tasks"]:
            if task["task_id"] == task_id:
                task["verification"] = verification
                self._save_data(data)
                return True

        return False

    # -------------------------------------------------------------------------
    # QUERIES
    # -------------------------------------------------------------------------

    def get_task(self, task_id: str) -> Optional[dict]:
        """Get a single task by ID."""
        data = self._load_data()
        for task in data["tasks"]:
            if task["task_id"] == task_id:
                return task
        return None

    def get_tasks_for_article(self, article_slug: str) -> List[dict]:
        """Get all tasks for an article."""
        data = self._load_data()
        return [t for t in data["tasks"] if t["article_slug"] == article_slug]

    def get_pending_tasks(self) -> List[dict]:
        """Get all pending tasks (queue)."""
        data = self._load_data()
        return [t for t in data["tasks"] if t["status"] == "pending"]

    def get_recent_tasks(self, limit: int = 50) -> List[dict]:
        """Get most recent tasks."""
        data = self._load_data()
        sorted_tasks = sorted(
            data["tasks"],
            key=lambda x: x.get("created_at", ""),
            reverse=True
        )
        return sorted_tasks[:limit]

    def get_failed_tasks(self, limit: int = 20) -> List[dict]:
        """Get recent failed tasks for retry."""
        data = self._load_data()
        failed = [t for t in data["tasks"] if t["status"] == "failed"]
        return sorted(failed, key=lambda x: x.get("completed_at", ""), reverse=True)[:limit]

    # -------------------------------------------------------------------------
    # ARTICLE STATUS
    # -------------------------------------------------------------------------

    def get_article_enhancement_status(self, article_slug: str) -> dict:
        """
        Get enhancement status for an article.
        Returns what enhancements are complete/pending.
        """
        tasks = self.get_tasks_for_article(article_slug)

        status = {
            "article_slug": article_slug,
            "has_citations": False,
            "has_internal_links": False,
            "has_ab_titles": False,
            "is_fully_enhanced": False,
            "pending_tasks": 0,
            "failed_tasks": 0
        }

        for task in tasks:
            if task["status"] == "completed":
                if task["task_type"] == "citations":
                    status["has_citations"] = True
                elif task["task_type"] == "internal_links":
                    status["has_internal_links"] = True
                elif task["task_type"] == "ab_titles":
                    status["has_ab_titles"] = True
            elif task["status"] == "pending":
                status["pending_tasks"] += 1
            elif task["status"] == "failed":
                status["failed_tasks"] += 1

        # Fully enhanced if all three are done
        status["is_fully_enhanced"] = (
            status["has_citations"] and
            status["has_internal_links"] and
            status["has_ab_titles"]
        )

        return status

    # -------------------------------------------------------------------------
    # STATS & REPORTING
    # -------------------------------------------------------------------------

    def get_daily_stats(self) -> dict:
        """Get stats for today."""
        data = self._load_data()
        today = datetime.now().date().isoformat()

        today_tasks = [
            t for t in data["tasks"]
            if t.get("created_at", "")[:10] == today
        ]

        return {
            "date": today,
            "total": len(today_tasks),
            "completed": len([t for t in today_tasks if t["status"] == "completed"]),
            "failed": len([t for t in today_tasks if t["status"] == "failed"]),
            "pending": len([t for t in today_tasks if t["status"] == "pending"]),
            "running": len([t for t in today_tasks if t["status"] == "running"])
        }

    def get_overall_stats(self) -> dict:
        """Get overall task statistics."""
        data = self._load_data()
        return {
            "total_tasks": data["stats"]["total"],
            "completed": data["stats"]["completed"],
            "failed": data["stats"]["failed"],
            "pending_queue": len([t for t in data["tasks"] if t["status"] == "pending"]),
            "success_rate": (
                round(data["stats"]["completed"] / data["stats"]["total"] * 100, 1)
                if data["stats"]["total"] > 0 else 0
            )
        }

    # -------------------------------------------------------------------------
    # CLEANUP
    # -------------------------------------------------------------------------

    def cleanup_old_tasks(self, days: int = 30):
        """Remove completed tasks older than X days."""
        data = self._load_data()
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()

        data["tasks"] = [
            t for t in data["tasks"]
            if t["status"] not in ["completed", "failed"] or
               t.get("completed_at", datetime.now().isoformat()) > cutoff
        ]

        self._save_data(data)


# Singleton instance
task_tracker = TaskTrackerService()
