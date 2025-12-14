"""
JASPER CRM - Metrics and Health Endpoints

Provides:
- /metrics - Prometheus metrics endpoint
- /health/detailed - Detailed health check
- /health/aggregated - All services health
"""

import os
import logging
import asyncio
from typing import Dict, Any

import httpx
from fastapi import APIRouter, Response
from pydantic import BaseModel

from services.metrics_service import metrics_service
from services.cache_service import cache_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Monitoring"])


class ServiceHealth(BaseModel):
    """Health status for a service."""
    name: str
    status: str  # healthy, unhealthy, unknown
    latency_ms: float = 0
    details: Dict[str, Any] = {}


class AggregatedHealth(BaseModel):
    """Aggregated health for all services."""
    status: str
    services: Dict[str, ServiceHealth]
    timestamp: str


# ============================================
# Prometheus Metrics Endpoint
# ============================================

@router.get("/metrics", include_in_schema=False)
async def prometheus_metrics():
    """
    Prometheus metrics endpoint.

    Returns metrics in Prometheus text exposition format.
    Typically scraped by Prometheus server.
    """
    metrics_text = metrics_service.get_metrics()
    return Response(
        content=metrics_text,
        media_type="text/plain; version=0.0.4; charset=utf-8"
    )


# ============================================
# Detailed Health Check
# ============================================

@router.get("/health/detailed")
async def detailed_health():
    """
    Detailed health check for CRM service.

    Checks:
    - Database connectivity
    - Redis cache status
    - External service connectivity
    """
    from datetime import datetime

    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "jasper-crm",
        "version": "1.1.0",
        "checks": {}
    }

    # Check database
    try:
        from db import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health["checks"]["database"] = {"status": "healthy"}
    except Exception as e:
        health["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
        health["status"] = "degraded"

    # Check Redis cache
    cache_stats = cache_service.get_stats()
    health["checks"]["cache"] = cache_stats

    # Check OpenRouter API (with cached result)
    if os.getenv("OPENROUTER_API_KEY"):
        health["checks"]["openrouter"] = {"status": "configured"}
    else:
        health["checks"]["openrouter"] = {"status": "not_configured"}

    return health


# ============================================
# Aggregated Health Check (All Services)
# ============================================

SERVICE_ENDPOINTS = {
    "crm": {"url": "http://localhost:8001/health", "port": 8001},
    "api": {"url": "http://localhost:3003/health", "port": 3003},
    "main-site": {"url": "http://localhost:3001/", "port": 3001},
    "admin-portal": {"url": "http://localhost:3002/", "port": 3002},
    "client-portal": {"url": "http://localhost:3004/", "port": 3004},
}


async def check_service_health(name: str, config: Dict[str, Any]) -> ServiceHealth:
    """Check health of a single service."""
    import time

    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(config["url"], timeout=5.0)
            latency = (time.time() - start) * 1000

            if response.status_code == 200:
                return ServiceHealth(
                    name=name,
                    status="healthy",
                    latency_ms=round(latency, 2),
                    details={"status_code": response.status_code}
                )
            else:
                return ServiceHealth(
                    name=name,
                    status="unhealthy",
                    latency_ms=round(latency, 2),
                    details={"status_code": response.status_code}
                )
    except httpx.ConnectError:
        return ServiceHealth(
            name=name,
            status="down",
            latency_ms=0,
            details={"error": "Connection refused"}
        )
    except httpx.TimeoutException:
        return ServiceHealth(
            name=name,
            status="timeout",
            latency_ms=5000,
            details={"error": "Request timeout"}
        )
    except Exception as e:
        return ServiceHealth(
            name=name,
            status="unknown",
            latency_ms=0,
            details={"error": str(e)}
        )


@router.get("/health/aggregated", response_model=AggregatedHealth)
async def aggregated_health():
    """
    Aggregated health check for all JASPER services.

    Checks all services concurrently and returns combined status.
    """
    from datetime import datetime

    # Check all services concurrently
    tasks = [
        check_service_health(name, config)
        for name, config in SERVICE_ENDPOINTS.items()
    ]
    results = await asyncio.gather(*tasks)

    # Build response
    services = {r.name: r for r in results}

    # Determine overall status
    statuses = [r.status for r in results]
    if all(s == "healthy" for s in statuses):
        overall_status = "healthy"
    elif any(s == "down" for s in statuses):
        overall_status = "degraded"
    else:
        overall_status = "partial"

    return AggregatedHealth(
        status=overall_status,
        services=services,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )


# ============================================
# Liveness and Readiness Probes (Kubernetes)
# ============================================

@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes liveness probe.

    Returns 200 if the service is running.
    """
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_probe():
    """
    Kubernetes readiness probe.

    Returns 200 if the service is ready to accept traffic.
    """
    # Check critical dependencies
    try:
        from db import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready"}
    except Exception as e:
        return Response(
            content='{"status": "not_ready", "error": "database"}',
            status_code=503,
            media_type="application/json"
        )
