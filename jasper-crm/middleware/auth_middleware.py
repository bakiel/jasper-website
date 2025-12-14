"""
JASPER CRM - Authentication Middleware

FastAPI dependency for JWT authentication with role-based access control.
Supports both JWT Bearer tokens and legacy API keys during migration.
"""

import logging
from typing import Optional, List
from functools import wraps

from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader

from services.auth_service import auth_service, UserRole, TokenData

logger = logging.getLogger(__name__)

# Security schemes
bearer_scheme = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
ai_api_key_header = APIKeyHeader(name="X-AI-API-Key", auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated user/service."""

    def __init__(
        self,
        subject: str,
        role: UserRole,
        auth_method: str = "jwt"
    ):
        self.subject = subject
        self.role = role
        self.auth_method = auth_method

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_agent(self) -> bool:
        return self.role in [UserRole.ADMIN, UserRole.AGENT]

    def __repr__(self):
        return f"AuthenticatedUser(subject={self.subject}, role={self.role})"


async def get_current_user(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    api_key: Optional[str] = Security(api_key_header),
    ai_api_key: Optional[str] = Security(ai_api_key_header),
) -> AuthenticatedUser:
    """
    Authenticate request and return current user.

    Supports multiple authentication methods:
    1. JWT Bearer token (preferred)
    2. X-API-Key header (legacy)
    3. X-AI-API-Key header (legacy, for AI services)

    Raises:
        HTTPException: If authentication fails
    """

    # Try JWT Bearer token first (preferred method)
    if bearer and bearer.credentials:
        token_data = auth_service.get_token_data(bearer.credentials)
        if token_data:
            logger.debug(f"JWT auth successful for {token_data.sub}")
            return AuthenticatedUser(
                subject=token_data.sub,
                role=token_data.role,
                auth_method="jwt"
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )

    # Try legacy API keys (for backward compatibility)
    legacy_key = api_key or ai_api_key
    if legacy_key:
        role = auth_service.verify_legacy_api_key(legacy_key)
        if role:
            logger.debug(f"Legacy API key auth successful (role: {role})")
            return AuthenticatedUser(
                subject="legacy-api-key",
                role=role,
                auth_method="api_key"
            )

    # No valid authentication provided
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Provide Bearer token or API key.",
        headers={"WWW-Authenticate": "Bearer"}
    )


async def get_optional_user(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    api_key: Optional[str] = Security(api_key_header),
    ai_api_key: Optional[str] = Security(ai_api_key_header),
) -> Optional[AuthenticatedUser]:
    """
    Get current user if authenticated, None otherwise.

    Use this for endpoints that work with or without authentication.
    """
    try:
        return await get_current_user(bearer, api_key, ai_api_key)
    except HTTPException:
        return None


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency factory to require specific roles.

    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user: AuthenticatedUser = Depends(require_role([UserRole.ADMIN]))):
            return {"message": "Admin access granted"}
    """
    async def role_checker(
        user: AuthenticatedUser = Depends(get_current_user)
    ) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return user

    return role_checker


# Convenience dependencies
require_admin = require_role([UserRole.ADMIN])
require_agent = require_role([UserRole.ADMIN, UserRole.AGENT])
require_any_auth = get_current_user


class RateLimiter:
    """
    Simple in-memory rate limiter.

    For production, use Redis-based rate limiting.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # {ip: [(timestamp, count)]}

    async def check_rate_limit(self, request: Request) -> bool:
        """Check if request is within rate limit."""
        from datetime import datetime, timedelta

        client_ip = request.client.host
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)

        # Clean old entries
        if client_ip in self.requests:
            self.requests[client_ip] = [
                (ts, count) for ts, count in self.requests[client_ip]
                if ts > minute_ago
            ]

        # Count recent requests
        recent_count = sum(
            count for _, count in self.requests.get(client_ip, [])
        )

        if recent_count >= self.requests_per_minute:
            return False

        # Record this request
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append((now, 1))

        return True


rate_limiter = RateLimiter(requests_per_minute=100)


async def check_rate_limit(request: Request):
    """Dependency to check rate limits."""
    if not await rate_limiter.check_rate_limit(request):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
