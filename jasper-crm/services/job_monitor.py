"""
JASPER CRM - Job Monitoring Service
Tracks background job success/failure rates and provides metrics.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum
from collections import defaultdict
import json
import os

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class JobMonitor:
    """
    Monitors background jobs and tracks metrics.
    Provides alerting when failure rates exceed thresholds.
    """

    def __init__(self, data_dir: str = "/opt/jasper-crm/data"):
        self.data_dir = data_dir
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.metrics: Dict[str, List[Dict]] = defaultdict(list)
        self.alert_threshold = 0.3  # 30% failure rate triggers alert
        self._load_state()

    def _load_state(self):
        """Load persisted job state."""
        state_file = os.path.join(self.data_dir, "job_monitor_state.json")
        try:
            if os.path.exists(state_file):
                with open(state_file, 'r') as f:
                    data = json.load(f)
                    self.jobs = data.get("jobs", {})
                    self.metrics = defaultdict(list, data.get("metrics", {}))
        except Exception as e:
            logger.error(f"Failed to load job monitor state: {e}")

    def _save_state(self):
        """Persist job state to disk."""
        state_file = os.path.join(self.data_dir, "job_monitor_state.json")
        try:
            os.makedirs(self.data_dir, exist_ok=True)
            with open(state_file, 'w') as f:
                json.dump({
                    "jobs": self.jobs,
                    "metrics": dict(self.metrics)
                }, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save job monitor state: {e}")

    def start_job(self, job_id: str, job_type: str, metadata: Dict = None) -> Dict[str, Any]:
        """Record job start."""
        job = {
            "id": job_id,
            "type": job_type,
            "status": JobStatus.RUNNING.value,
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "duration_ms": None,
            "error": None,
            "metadata": metadata or {}
        }
        self.jobs[job_id] = job
        logger.info(f"Job started: {job_id} ({job_type})")
        return job

    def complete_job(self, job_id: str, result: Dict = None) -> Dict[str, Any]:
        """Record job completion."""
        if job_id not in self.jobs:
            logger.warning(f"Unknown job completed: {job_id}")
            return None

        job = self.jobs[job_id]
        job["status"] = JobStatus.COMPLETED.value
        job["completed_at"] = datetime.now().isoformat()
        job["result"] = result

        # Calculate duration
        started = datetime.fromisoformat(job["started_at"])
        job["duration_ms"] = (datetime.now() - started).total_seconds() * 1000

        # Record metric
        self._record_metric(job)
        self._save_state()

        logger.info(f"Job completed: {job_id} ({job['duration_ms']:.0f}ms)")
        return job

    def fail_job(self, job_id: str, error: str) -> Dict[str, Any]:
        """Record job failure."""
        if job_id not in self.jobs:
            logger.warning(f"Unknown job failed: {job_id}")
            return None

        job = self.jobs[job_id]
        job["status"] = JobStatus.FAILED.value
        job["completed_at"] = datetime.now().isoformat()
        job["error"] = error

        # Calculate duration
        started = datetime.fromisoformat(job["started_at"])
        job["duration_ms"] = (datetime.now() - started).total_seconds() * 1000

        # Record metric
        self._record_metric(job)
        self._save_state()

        logger.error(f"Job failed: {job_id} - {error}")

        # Check if alert needed
        self._check_alert(job["type"])

        return job

    def _record_metric(self, job: Dict):
        """Record job metric for analytics."""
        metric = {
            "timestamp": datetime.now().isoformat(),
            "status": job["status"],
            "duration_ms": job["duration_ms"],
            "error": job.get("error")
        }
        self.metrics[job["type"]].append(metric)

        # Keep only last 1000 metrics per type
        if len(self.metrics[job["type"]]) > 1000:
            self.metrics[job["type"]] = self.metrics[job["type"]][-1000:]

    def _check_alert(self, job_type: str):
        """Check if failure rate exceeds threshold."""
        recent = self.metrics[job_type][-100:]  # Last 100 jobs
        if len(recent) < 10:
            return  # Not enough data

        failures = sum(1 for m in recent if m["status"] == JobStatus.FAILED.value)
        failure_rate = failures / len(recent)

        if failure_rate >= self.alert_threshold:
            self._trigger_alert(job_type, failure_rate)

    def _trigger_alert(self, job_type: str, failure_rate: float):
        """Trigger alert for high failure rate."""
        from services.alerting import alerting_service
        alerting_service.send_alert(
            level="warning",
            title=f"High Job Failure Rate: {job_type}",
            message=f"Failure rate: {failure_rate*100:.1f}% (threshold: {self.alert_threshold*100:.0f}%)",
            metadata={"job_type": job_type, "failure_rate": failure_rate}
        )

    def get_metrics(self, job_type: str = None, hours: int = 24) -> Dict[str, Any]:
        """Get job metrics for dashboard."""
        cutoff = datetime.now() - timedelta(hours=hours)

        if job_type:
            types_to_check = [job_type]
        else:
            types_to_check = list(self.metrics.keys())

        results = {}
        for jtype in types_to_check:
            recent = [
                m for m in self.metrics[jtype]
                if datetime.fromisoformat(m["timestamp"]) > cutoff
            ]

            if not recent:
                continue

            completed = [m for m in recent if m["status"] == JobStatus.COMPLETED.value]
            failed = [m for m in recent if m["status"] == JobStatus.FAILED.value]

            avg_duration = sum(m["duration_ms"] for m in completed) / len(completed) if completed else 0

            results[jtype] = {
                "total": len(recent),
                "completed": len(completed),
                "failed": len(failed),
                "success_rate": len(completed) / len(recent) if recent else 0,
                "avg_duration_ms": round(avg_duration, 2),
                "last_failure": failed[-1] if failed else None
            }

        return {
            "period_hours": hours,
            "job_types": results,
            "generated_at": datetime.now().isoformat()
        }

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job details by ID."""
        return self.jobs.get(job_id)

    def get_recent_jobs(self, limit: int = 20, job_type: str = None) -> List[Dict[str, Any]]:
        """Get recent jobs."""
        jobs = list(self.jobs.values())

        if job_type:
            jobs = [j for j in jobs if j["type"] == job_type]

        # Sort by started_at descending
        jobs.sort(key=lambda x: x["started_at"], reverse=True)

        return jobs[:limit]

    def cleanup_old_jobs(self, days: int = 7):
        """Remove jobs older than specified days."""
        cutoff = datetime.now() - timedelta(days=days)

        to_remove = []
        for job_id, job in self.jobs.items():
            started = datetime.fromisoformat(job["started_at"])
            if started < cutoff:
                to_remove.append(job_id)

        for job_id in to_remove:
            del self.jobs[job_id]

        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old jobs")
            self._save_state()


# Singleton instance
job_monitor = JobMonitor()
