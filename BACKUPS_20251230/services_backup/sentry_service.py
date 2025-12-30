"""
JASPER CRM - Sentry Error Tracking Service

Provides production error monitoring with:
- Automatic error capture
- Performance tracing
- User context
- Release tracking
"""

import os
import logging
from typing import Optional, Dict, Any
from functools import wraps

logger = logging.getLogger(__name__)


class SentryConfig:
    """Sentry configuration."""

    def __init__(self):
        self.dsn = os.getenv("SENTRY_DSN", "")
        self.environment = os.getenv("SENTRY_ENVIRONMENT", os.getenv("ENV", "development"))
        self.release = os.getenv("SENTRY_RELEASE", os.getenv("APP_VERSION", "1.0.0"))
        self.traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
        self.profiles_sample_rate = float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1"))
        self.enabled = bool(self.dsn) and os.getenv("SENTRY_ENABLED", "true").lower() == "true"


class SentryService:
    """
    Sentry error tracking service.

    Integrates with Sentry for:
    - Error monitoring
    - Performance tracing
    - User feedback
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if SentryService._initialized:
            return

        self.config = SentryConfig()
        self._sentry_sdk = None
        self._setup()
        SentryService._initialized = True

    def _setup(self):
        """Initialize Sentry SDK."""
        if not self.config.enabled:
            logger.info("Sentry disabled (no DSN configured)")
            return

        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            from sentry_sdk.integrations.httpx import HttpxIntegration
            from sentry_sdk.integrations.logging import LoggingIntegration

            sentry_sdk.init(
                dsn=self.config.dsn,
                environment=self.config.environment,
                release=f"jasper-crm@{self.config.release}",
                traces_sample_rate=self.config.traces_sample_rate,
                profiles_sample_rate=self.config.profiles_sample_rate,
                integrations=[
                    FastApiIntegration(transaction_style="endpoint"),
                    SqlalchemyIntegration(),
                    HttpxIntegration(),
                    LoggingIntegration(
                        level=logging.INFO,
                        event_level=logging.ERROR
                    ),
                ],
                # Performance
                enable_tracing=True,
                # Privacy
                send_default_pii=False,
                # Before send hook
                before_send=self._before_send,
            )

            self._sentry_sdk = sentry_sdk
            logger.info(f"Sentry initialized for {self.config.environment}")

        except ImportError:
            logger.warning("sentry-sdk not installed. Error tracking disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")

    def _before_send(self, event: dict, hint: dict) -> Optional[dict]:
        """
        Filter events before sending to Sentry.

        - Remove sensitive data
        - Filter out noise
        """
        # Don't send 404 errors
        if event.get("exception"):
            values = event["exception"].get("values", [])
            for value in values:
                if "404" in str(value.get("value", "")):
                    return None

        # Remove sensitive headers
        if "request" in event:
            headers = event["request"].get("headers", {})
            sensitive_headers = ["authorization", "x-api-key", "x-ai-api-key", "cookie"]
            for header in sensitive_headers:
                headers.pop(header, None)

        return event

    @property
    def is_enabled(self) -> bool:
        """Check if Sentry is enabled."""
        return self._sentry_sdk is not None

    def capture_exception(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Capture an exception.

        Args:
            error: The exception to capture
            context: Additional context data
        """
        if not self.is_enabled:
            logger.error(f"Error (Sentry disabled): {error}")
            return

        with self._sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            self._sentry_sdk.capture_exception(error)

    def capture_message(
        self,
        message: str,
        level: str = "info",
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Capture a message.

        Args:
            message: The message to capture
            level: Log level (info, warning, error)
            context: Additional context data
        """
        if not self.is_enabled:
            logger.log(
                getattr(logging, level.upper(), logging.INFO),
                f"Message (Sentry disabled): {message}"
            )
            return

        with self._sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            self._sentry_sdk.capture_message(message, level=level)

    def set_user(
        self,
        user_id: Optional[str] = None,
        email: Optional[str] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """
        Set user context for error tracking.

        Args:
            user_id: User identifier
            email: User email
            username: Username
            ip_address: IP address
        """
        if not self.is_enabled:
            return

        self._sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "username": username,
            "ip_address": ip_address,
        })

    def clear_user(self):
        """Clear user context."""
        if self.is_enabled:
            self._sentry_sdk.set_user(None)

    def set_tag(self, key: str, value: str):
        """Set a tag for the current scope."""
        if self.is_enabled:
            self._sentry_sdk.set_tag(key, value)

    def set_context(self, name: str, data: Dict[str, Any]):
        """Set additional context."""
        if self.is_enabled:
            self._sentry_sdk.set_context(name, data)

    def start_transaction(
        self,
        name: str,
        op: str = "task"
    ):
        """
        Start a performance transaction.

        Usage:
            with sentry_service.start_transaction("process_leads", "task"):
                process_leads()
        """
        if not self.is_enabled:
            from contextlib import nullcontext
            return nullcontext()

        return self._sentry_sdk.start_transaction(name=name, op=op)

    def add_breadcrumb(
        self,
        message: str,
        category: str = "default",
        level: str = "info",
        data: Optional[Dict[str, Any]] = None
    ):
        """Add a breadcrumb for debugging."""
        if self.is_enabled:
            self._sentry_sdk.add_breadcrumb(
                message=message,
                category=category,
                level=level,
                data=data or {}
            )


# Singleton instance
sentry_service = SentryService()


def track_errors(func):
    """
    Decorator to automatically capture errors.

    Usage:
        @track_errors
        async def risky_operation():
            # errors are automatically captured
            pass
    """
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            sentry_service.capture_exception(e, {
                "function": func.__name__,
                "args": str(args)[:200],
            })
            raise

    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            sentry_service.capture_exception(e, {
                "function": func.__name__,
                "args": str(args)[:200],
            })
            raise

    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper


def track_performance(name: Optional[str] = None, op: str = "function"):
    """
    Decorator to track function performance.

    Usage:
        @track_performance("process_lead")
        async def process_lead(lead_id: int):
            pass
    """
    def decorator(func):
        transaction_name = name or func.__name__

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            with sentry_service.start_transaction(transaction_name, op):
                return await func(*args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with sentry_service.start_transaction(transaction_name, op):
                return func(*args, **kwargs)

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
