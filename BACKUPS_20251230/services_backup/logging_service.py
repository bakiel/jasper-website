"""
JASPER CRM - Centralized Logging Service

Provides structured JSON logging with:
- Consistent format across all services
- Request tracing with correlation IDs
- Log rotation and persistence
- Performance metrics logging
"""

import os
import sys
import json
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from contextvars import ContextVar

# Context variable for request correlation
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging.

    Outputs logs in JSON format for easy parsing and analysis.
    """

    def __init__(self, service_name: str = "jasper-crm"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": self.service_name,
            "correlation_id": correlation_id_var.get(""),
        }

        # Add source location
        if record.pathname:
            log_entry["source"] = {
                "file": record.pathname,
                "line": record.lineno,
                "function": record.funcName,
            }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info),
            }

        # Add extra fields
        if hasattr(record, "extra_fields"):
            log_entry["extra"] = record.extra_fields

        return json.dumps(log_entry)


class ConsoleFormatter(logging.Formatter):
    """
    Colored console formatter for development.
    """

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        correlation = correlation_id_var.get("")
        correlation_str = f"[{correlation[:8]}] " if correlation else ""

        timestamp = datetime.utcnow().strftime("%H:%M:%S")

        return (
            f"{color}{timestamp} {record.levelname:8}{self.RESET} "
            f"{correlation_str}{record.name}: {record.getMessage()}"
        )


class LoggingConfig:
    """Logging configuration."""

    def __init__(self):
        self.log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.log_dir = Path(os.getenv("LOG_DIR", "/var/log/jasper"))
        self.service_name = os.getenv("SERVICE_NAME", "jasper-crm")
        self.json_logs = os.getenv("JSON_LOGS", "true").lower() == "true"
        self.max_bytes = int(os.getenv("LOG_MAX_BYTES", "10485760"))  # 10MB
        self.backup_count = int(os.getenv("LOG_BACKUP_COUNT", "5"))


class LoggingService:
    """
    Centralized logging service.

    Provides structured logging with JSON output, rotation, and correlation tracking.
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

        self.config = LoggingConfig()
        self._setup_logging()
        self._initialized = True

    def _setup_logging(self):
        """Configure logging handlers."""

        # Get root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, self.config.log_level))

        # Clear existing handlers
        root_logger.handlers = []

        # Console handler (always enabled)
        console_handler = logging.StreamHandler(sys.stdout)
        if self.config.json_logs and os.getenv("DEBUG", "false").lower() != "true":
            console_handler.setFormatter(JSONFormatter(self.config.service_name))
        else:
            console_handler.setFormatter(ConsoleFormatter())
        root_logger.addHandler(console_handler)

        # File handler (production)
        if self.config.log_dir.exists() or self._create_log_dir():
            # Main log file with rotation
            file_handler = RotatingFileHandler(
                self.config.log_dir / f"{self.config.service_name}.log",
                maxBytes=self.config.max_bytes,
                backupCount=self.config.backup_count,
            )
            file_handler.setFormatter(JSONFormatter(self.config.service_name))
            root_logger.addHandler(file_handler)

            # Error log file (errors only)
            error_handler = RotatingFileHandler(
                self.config.log_dir / f"{self.config.service_name}.error.log",
                maxBytes=self.config.max_bytes,
                backupCount=self.config.backup_count,
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(JSONFormatter(self.config.service_name))
            root_logger.addHandler(error_handler)

        # Suppress noisy loggers
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    def _create_log_dir(self) -> bool:
        """Create log directory if possible."""
        try:
            self.config.log_dir.mkdir(parents=True, exist_ok=True)
            return True
        except PermissionError:
            # Fallback to /tmp for development
            self.config.log_dir = Path("/tmp/jasper-logs")
            self.config.log_dir.mkdir(parents=True, exist_ok=True)
            return True
        except Exception:
            return False

    @staticmethod
    def get_correlation_id() -> str:
        """Get current correlation ID."""
        return correlation_id_var.get("")

    @staticmethod
    def set_correlation_id(correlation_id: Optional[str] = None) -> str:
        """Set correlation ID for request tracing."""
        cid = correlation_id or str(uuid4())
        correlation_id_var.set(cid)
        return cid

    @staticmethod
    def clear_correlation_id():
        """Clear correlation ID."""
        correlation_id_var.set("")

    def get_logger(self, name: str) -> logging.Logger:
        """Get a logger instance."""
        return logging.getLogger(name)


class RequestLogger:
    """
    Middleware-style request logger for FastAPI.
    """

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        extra: Optional[Dict[str, Any]] = None
    ):
        """Log an HTTP request."""
        log_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration_ms, 2),
            **(extra or {})
        }

        # Create a LogRecord with extra fields
        record = self.logger.makeRecord(
            self.logger.name,
            logging.INFO if status_code < 400 else logging.WARNING,
            "",
            0,
            f"{method} {path} {status_code} ({duration_ms:.2f}ms)",
            (),
            None
        )
        record.extra_fields = log_data
        self.logger.handle(record)


# Initialize logging service
logging_service = LoggingService()


def get_logger(name: str) -> logging.Logger:
    """Convenience function to get a logger."""
    return logging_service.get_logger(name)


def set_correlation_id(correlation_id: Optional[str] = None) -> str:
    """Convenience function to set correlation ID."""
    return logging_service.set_correlation_id(correlation_id)


def get_correlation_id() -> str:
    """Convenience function to get correlation ID."""
    return logging_service.get_correlation_id()
