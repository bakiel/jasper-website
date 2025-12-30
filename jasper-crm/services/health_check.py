"""
JASPER CRM - Comprehensive Health Check Service
Tests all services, endpoints, and integrations.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List
import httpx

logger = logging.getLogger(__name__)


class HealthCheckService:
    """
    Comprehensive health checker for JASPER CRM.
    Tests all services and returns detailed status.
    """

    def __init__(self):
        self.checks_run = 0
        self.last_check = None

    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive status."""
        start_time = datetime.now()
        results = {
            "status": "healthy",
            "timestamp": start_time.isoformat(),
            "checks": {},
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "warnings": 0
            }
        }

        # Run all checks
        checks = [
            ("database", self._check_database),
            ("redis", self._check_redis),
            ("orchestrator", self._check_orchestrator),
            ("lead_service", self._check_lead_service),
            ("blog_service", self._check_blog_service),
            ("news_monitor", self._check_news_monitor),
            ("call_coach", self._check_call_coach),
            ("disk_space", self._check_disk_space),
            ("memory", self._check_memory),
        ]

        for name, check_func in checks:
            try:
                check_result = await check_func()
                results["checks"][name] = check_result
                results["summary"]["total"] += 1

                if check_result["status"] == "healthy":
                    results["summary"]["passed"] += 1
                elif check_result["status"] == "warning":
                    results["summary"]["warnings"] += 1
                else:
                    results["summary"]["failed"] += 1
                    results["status"] = "unhealthy"
            except Exception as e:
                logger.error(f"Health check {name} failed: {e}")
                results["checks"][name] = {
                    "status": "error",
                    "error": str(e)
                }
                results["summary"]["failed"] += 1
                results["status"] = "unhealthy"

        # Calculate duration
        results["duration_ms"] = (datetime.now() - start_time).total_seconds() * 1000
        self.checks_run += 1
        self.last_check = start_time

        return results

    async def _check_database(self) -> Dict[str, Any]:
        """Check PostgreSQL connection."""
        try:
            from db.database import SessionLocal
            from db.tables import LeadTable

            db = SessionLocal()
            try:
                count = db.query(LeadTable).count()
                return {
                    "status": "healthy",
                    "message": f"Connected, {count} leads in database",
                    "lead_count": count
                }
            finally:
                db.close()
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connection."""
        try:
            import redis
            r = redis.Redis(host="localhost", port=6379, db=0)
            r.ping()
            return {"status": "healthy", "message": "Redis responding"}
        except Exception as e:
            return {"status": "warning", "error": str(e), "message": "Redis optional"}

    async def _check_orchestrator(self) -> Dict[str, Any]:
        """Check AgenticBrain orchestrator via API."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:8001/api/v1/orchestrator/status", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    tools = data.get("tool_count", 0)
                    return {
                        "status": "healthy",
                        "tools_available": tools,
                        "model": data.get("model", "unknown")
                    }
                return {"status": "warning", "error": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "warning", "error": str(e)}

    async def _check_lead_service(self) -> Dict[str, Any]:
        """Check LeadService functionality."""
        try:
            from services.lead_service import lead_service
            has_get = hasattr(lead_service, "get")
            has_update = hasattr(lead_service, "update")
            if has_get and has_update:
                return {
                    "status": "healthy",
                    "methods": ["get", "update", "update_status", "get_context"]
                }
            return {"status": "unhealthy", "error": "Missing required methods"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def _check_blog_service(self) -> Dict[str, Any]:
        """Check BlogService and auto-post endpoint."""
        try:
            from routes.blog import load_blog_posts, AI_BLOG_API_KEY
            posts = load_blog_posts()
            return {
                "status": "healthy",
                "posts_count": len(posts),
                "auto_post_configured": bool(AI_BLOG_API_KEY)
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def _check_news_monitor(self) -> Dict[str, Any]:
        """Check news monitor service."""
        try:
            from services.news_monitor import news_monitor, NEWS_SOURCES
            status = news_monitor.get_status()
            return {
                "status": "healthy",
                "sources_configured": len(NEWS_SOURCES),
                "monitor_status": status
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def _check_call_coach(self) -> Dict[str, Any]:
        """Check CallCoach service."""
        try:
            from services.call_coach import call_coach
            if call_coach:
                return {
                    "status": "healthy",
                    "message": "CallCoach service available"
                }
            return {"status": "warning", "message": "CallCoach not initialized"}
        except Exception as e:
            return {"status": "warning", "error": str(e), "message": "CallCoach optional"}

    async def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space."""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            free_gb = free // (1024 ** 3)
            used_percent = (used / total) * 100
            if free_gb > 10:
                status = "healthy"
            elif free_gb > 5:
                status = "warning"
            else:
                status = "unhealthy"
            return {
                "status": status,
                "free_gb": free_gb,
                "used_percent": round(used_percent, 1)
            }
        except Exception as e:
            return {"status": "warning", "error": str(e)}

    async def _check_memory(self) -> Dict[str, Any]:
        """Check memory usage."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            if memory.percent < 80:
                status = "healthy"
            elif memory.percent < 90:
                status = "warning"
            else:
                status = "unhealthy"
            return {
                "status": status,
                "used_percent": memory.percent,
                "available_mb": memory.available // (1024 ** 2)
            }
        except ImportError:
            return {"status": "warning", "message": "psutil not installed"}
        except Exception as e:
            return {"status": "warning", "error": str(e)}


# Singleton instance
health_check_service = HealthCheckService()
