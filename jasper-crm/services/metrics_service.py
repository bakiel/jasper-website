"""
JASPER CRM - Prometheus Metrics Service

Exposes application metrics for monitoring:
- Request counts and latencies
- Database connection pool stats
- Cache hit/miss ratios
- Business metrics (leads, content, etc.)
"""

import os
import time
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps
from dataclasses import dataclass, field
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class MetricValue:
    """A metric value with labels."""
    name: str
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    metric_type: str = "gauge"  # gauge, counter, histogram
    help_text: str = ""


class MetricsCollector:
    """
    In-memory metrics collector.

    For production, integrate with prometheus_client.
    """

    def __init__(self):
        self.counters: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self.gauges: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self.histograms: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
        self._start_time = time.time()

    def _make_label_key(self, labels: Dict[str, str]) -> str:
        """Create a string key from labels."""
        if not labels:
            return ""
        return ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))

    def inc_counter(self, name: str, value: float = 1, labels: Optional[Dict[str, str]] = None):
        """Increment a counter."""
        key = self._make_label_key(labels or {})
        self.counters[name][key] += value

    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge value."""
        key = self._make_label_key(labels or {})
        self.gauges[name][key] = value

    def observe_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Observe a histogram value."""
        key = self._make_label_key(labels or {})
        self.histograms[name][key].append(value)
        # Keep only last 1000 observations
        if len(self.histograms[name][key]) > 1000:
            self.histograms[name][key] = self.histograms[name][key][-1000:]

    def get_metrics_text(self) -> str:
        """Export metrics in Prometheus text format."""
        lines = []

        # Process info
        lines.append("# HELP jasper_info JASPER CRM process info")
        lines.append("# TYPE jasper_info gauge")
        lines.append(f'jasper_info{{version="1.1.0",service="jasper-crm"}} 1')

        # Uptime
        lines.append("# HELP jasper_uptime_seconds Time since service start")
        lines.append("# TYPE jasper_uptime_seconds gauge")
        lines.append(f"jasper_uptime_seconds {time.time() - self._start_time:.2f}")

        # Counters
        for name, label_values in self.counters.items():
            lines.append(f"# HELP {name} Counter metric")
            lines.append(f"# TYPE {name} counter")
            for label_key, value in label_values.items():
                if label_key:
                    lines.append(f"{name}{{{label_key}}} {value}")
                else:
                    lines.append(f"{name} {value}")

        # Gauges
        for name, label_values in self.gauges.items():
            lines.append(f"# HELP {name} Gauge metric")
            lines.append(f"# TYPE {name} gauge")
            for label_key, value in label_values.items():
                if label_key:
                    lines.append(f"{name}{{{label_key}}} {value}")
                else:
                    lines.append(f"{name} {value}")

        # Histograms (simplified - just count, sum, and buckets)
        for name, label_values in self.histograms.items():
            lines.append(f"# HELP {name} Histogram metric")
            lines.append(f"# TYPE {name} histogram")
            for label_key, values in label_values.items():
                if values:
                    count = len(values)
                    total = sum(values)
                    prefix = f"{name}{{{label_key}}}" if label_key else name
                    lines.append(f"{prefix}_count {count}")
                    lines.append(f"{prefix}_sum {total:.4f}")

                    # Buckets
                    buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
                    for bucket in buckets:
                        bucket_count = sum(1 for v in values if v <= bucket)
                        lines.append(f'{prefix}_bucket{{le="{bucket}"}} {bucket_count}')
                    lines.append(f'{prefix}_bucket{{le="+Inf"}} {count}')

        return "\n".join(lines)


class MetricsService:
    """
    Metrics service for JASPER CRM.

    Provides:
    - Request metrics (count, latency)
    - Business metrics (leads, content)
    - Infrastructure metrics (cache, db)
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.enabled = os.getenv("METRICS_ENABLED", "true").lower() == "true"
        self.collector = MetricsCollector()
        self._initialized = True

        logger.info("MetricsService initialized")

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_seconds: float
    ):
        """Record an HTTP request."""
        if not self.enabled:
            return

        # Normalize path (remove IDs)
        normalized_path = self._normalize_path(path)

        labels = {
            "method": method,
            "path": normalized_path,
            "status": str(status_code),
        }

        self.collector.inc_counter("jasper_http_requests_total", labels=labels)
        self.collector.observe_histogram(
            "jasper_http_request_duration_seconds",
            duration_seconds,
            labels={"method": method, "path": normalized_path}
        )

    def _normalize_path(self, path: str) -> str:
        """Normalize path by replacing IDs with placeholders."""
        import re
        # Replace UUIDs
        path = re.sub(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '{id}', path)
        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        return path

    def record_lead_created(self, source: str = "unknown"):
        """Record a lead creation."""
        self.collector.inc_counter(
            "jasper_leads_created_total",
            labels={"source": source}
        )

    def record_content_generated(self, category: str):
        """Record content generation."""
        self.collector.inc_counter(
            "jasper_content_generated_total",
            labels={"category": category}
        )

    def record_ai_request(self, model: str, success: bool, duration_seconds: float):
        """Record an AI API request."""
        self.collector.inc_counter(
            "jasper_ai_requests_total",
            labels={"model": model, "success": str(success).lower()}
        )
        self.collector.observe_histogram(
            "jasper_ai_request_duration_seconds",
            duration_seconds,
            labels={"model": model}
        )

    def record_cache_operation(self, operation: str, hit: bool):
        """Record a cache operation."""
        self.collector.inc_counter(
            "jasper_cache_operations_total",
            labels={"operation": operation, "hit": str(hit).lower()}
        )

    def set_active_leads(self, count: int):
        """Set gauge for active leads."""
        self.collector.set_gauge("jasper_active_leads", count)

    def set_db_connections(self, active: int, idle: int):
        """Set database connection pool stats."""
        self.collector.set_gauge("jasper_db_connections_active", active)
        self.collector.set_gauge("jasper_db_connections_idle", idle)

    def get_metrics(self) -> str:
        """Get metrics in Prometheus format."""
        return self.collector.get_metrics_text()


# Singleton instance
metrics_service = MetricsService()


def track_request_metrics(func):
    """
    Decorator to track request metrics.

    Usage on FastAPI route:
        @app.get("/items")
        @track_request_metrics
        async def get_items():
            pass
    """
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start
            # Note: Would need request context to get method/path
            metrics_service.collector.observe_histogram(
                "jasper_function_duration_seconds",
                duration,
                labels={"function": func.__name__}
            )

    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start = time.time()
        try:
            return func(*args, **kwargs)
        finally:
            duration = time.time() - start
            metrics_service.collector.observe_histogram(
                "jasper_function_duration_seconds",
                duration,
                labels={"function": func.__name__}
            )

    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper
