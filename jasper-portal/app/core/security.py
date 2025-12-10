"""
JASPER Client Portal - Security Middleware & Utilities
Implements security headers, CSRF protection, and rate limiting
"""

import secrets
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from functools import wraps

from fastapi import Request, Response, HTTPException, Depends
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


# ============================================
# SECURITY HEADERS MIDDLEWARE
# ============================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds comprehensive security headers to all responses.
    Based on OWASP recommendations and security best practices.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS (enable in production)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser features
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"

        # Content Security Policy (adjust as needed for your frontend)
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.jasperfinance.org https://jasperfinance.org",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Remove server identification headers
        if "server" in response.headers:
            del response.headers["server"]
        response.headers["X-Powered-By"] = "JASPER"

        return response


# ============================================
# CSRF PROTECTION
# ============================================

class CSRFProtection:
    """
    CSRF Protection using Double Submit Cookie pattern.
    Generates tokens and validates them on state-changing requests.
    """

    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.token_expiry = timedelta(hours=24)

    def generate_token(self) -> str:
        """Generate a cryptographically secure CSRF token"""
        timestamp = str(int(datetime.utcnow().timestamp()))
        random_bytes = secrets.token_bytes(32)
        payload = f"{timestamp}:{random_bytes.hex()}"
        signature = hmac.new(
            self.secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{payload}:{signature}"

    def validate_token(self, token: str) -> bool:
        """Validate a CSRF token"""
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False

            timestamp, random_part, signature = parts
            payload = f"{timestamp}:{random_part}"

            # Verify signature
            expected_signature = hmac.new(
                self.secret_key.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                return False

            # Check expiry
            token_time = datetime.fromtimestamp(int(timestamp))
            if datetime.utcnow() - token_time > self.token_expiry:
                return False

            return True
        except Exception as e:
            logger.warning(f"CSRF validation error: {e}")
            return False


# ============================================
# RATE LIMITING (In-Memory with cleanup)
# ============================================

class RateLimiter:
    """
    In-memory rate limiter with automatic cleanup.
    For production, use Redis-based rate limiting.
    """

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
        self.last_cleanup = datetime.utcnow()

    def _cleanup(self):
        """Remove expired entries"""
        now = datetime.utcnow()
        if (now - self.last_cleanup).seconds < 60:
            return

        cutoff = now - timedelta(seconds=self.window_seconds)
        keys_to_delete = []

        for key, timestamps in self.requests.items():
            self.requests[key] = [ts for ts in timestamps if ts > cutoff]
            if not self.requests[key]:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            del self.requests[key]

        self.last_cleanup = now

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for given identifier"""
        self._cleanup()

        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)

        if identifier not in self.requests:
            self.requests[identifier] = []

        # Filter old requests
        self.requests[identifier] = [
            ts for ts in self.requests[identifier] if ts > cutoff
        ]

        # Check limit
        if len(self.requests[identifier]) >= self.max_requests:
            return False

        # Record this request
        self.requests[identifier].append(now)
        return True

    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        if identifier not in self.requests:
            return self.max_requests

        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)
        valid_requests = [ts for ts in self.requests[identifier] if ts > cutoff]

        return max(0, self.max_requests - len(valid_requests))


# Global rate limiter instances
auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=300)  # 10 per 5 min
api_rate_limiter = RateLimiter(max_requests=100, window_seconds=60)   # 100 per min


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware based on IP address.
    """

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/api/docs", "/api/redoc"]:
            return await call_next(request)

        # Apply stricter limits to auth endpoints
        if "/auth/" in request.url.path:
            limiter = auth_rate_limiter
        else:
            limiter = api_rate_limiter

        if not limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": "Rate limit exceeded. Please try again later.",
                    "retry_after": limiter.window_seconds
                },
                headers={
                    "Retry-After": str(limiter.window_seconds),
                    "X-RateLimit-Limit": str(limiter.max_requests),
                    "X-RateLimit-Remaining": "0",
                }
            )

        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(limiter.get_remaining(client_ip))

        return response


# ============================================
# SECURITY LOGGING
# ============================================

class SecurityLogger:
    """
    Structured security event logging.
    """

    def __init__(self):
        self.logger = logging.getLogger("security")

    def log_auth_attempt(
        self,
        email: str,
        success: bool,
        ip_address: str,
        user_agent: str = None,
        reason: str = None
    ):
        """Log authentication attempts"""
        event = {
            "event_type": "auth_attempt",
            "email": email,
            "success": success,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }

        if success:
            self.logger.info(f"Auth success: {event}")
        else:
            self.logger.warning(f"Auth failure: {event}")

    def log_suspicious_activity(
        self,
        activity_type: str,
        ip_address: str,
        details: Dict[str, Any]
    ):
        """Log suspicious activity"""
        event = {
            "event_type": "suspicious_activity",
            "activity_type": activity_type,
            "ip_address": ip_address,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.logger.warning(f"Suspicious activity: {event}")

    def log_rate_limit(self, ip_address: str, endpoint: str):
        """Log rate limit events"""
        self.logger.warning(
            f"Rate limit exceeded - IP: {ip_address}, Endpoint: {endpoint}"
        )


security_logger = SecurityLogger()


# ============================================
# INPUT VALIDATION HELPERS
# ============================================

def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input"""
    if not value:
        return ""

    # Truncate to max length
    value = value[:max_length]

    # Remove null bytes
    value = value.replace("\x00", "")

    # Strip whitespace
    value = value.strip()

    return value


def sanitize_email(email: str) -> str:
    """Sanitize email address"""
    if not email:
        return ""

    # Basic sanitization
    email = email.lower().strip()

    # Remove potentially dangerous characters
    email = "".join(c for c in email if c.isalnum() or c in "@._+-")

    return email


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, message)
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters"

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*(),.?\":{}|<>" for c in password)

    if not (has_upper and has_lower and has_digit and has_special):
        return False, "Password must contain uppercase, lowercase, numbers, and special characters"

    return True, "Password meets requirements"


# ============================================
# SECURE TOKEN GENERATION
# ============================================

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """Generate a secure API key with prefix"""
    return f"jsp_{secrets.token_hex(32)}"
