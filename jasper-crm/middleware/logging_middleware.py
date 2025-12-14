"""
JASPER CRM - Logging Middleware

FastAPI middleware for automatic request logging and correlation tracking.
"""

import time
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from services.logging_service import (
    set_correlation_id,
    get_correlation_id,
    RequestLogger,
    logging_service,
)

logger = logging.getLogger(__name__)
request_logger = RequestLogger(logging.getLogger("jasper.requests"))


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for request logging and correlation ID tracking.

    Features:
    - Assigns correlation ID to each request
    - Logs request details (method, path, duration)
    - Adds correlation ID to response headers
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or create correlation ID
        correlation_id = request.headers.get("X-Correlation-ID")
        correlation_id = set_correlation_id(correlation_id)

        # Record start time
        start_time = time.perf_counter()

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log exception
            logger.exception(
                f"Request failed: {request.method} {request.url.path}",
                extra={"correlation_id": correlation_id}
            )
            raise

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id

        # Log request (skip health checks to reduce noise)
        if request.url.path not in ["/health", "/favicon.ico"]:
            request_logger.log_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                extra={
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent", "")[:100],
                }
            )

        return response


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware for tracking slow requests.

    Logs warnings for requests exceeding threshold.
    """

    def __init__(self, app, slow_threshold_ms: float = 1000):
        super().__init__(app)
        self.slow_threshold_ms = slow_threshold_ms

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        if duration_ms > self.slow_threshold_ms:
            logger.warning(
                f"Slow request detected: {request.method} {request.url.path} "
                f"took {duration_ms:.2f}ms (threshold: {self.slow_threshold_ms}ms)"
            )

        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        return response
