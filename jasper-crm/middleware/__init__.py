"""JASPER CRM Middleware Package"""

from .auth_middleware import (
    get_current_user,
    get_optional_user,
    require_role,
    require_admin,
    require_agent,
    require_any_auth,
    check_rate_limit,
    AuthenticatedUser,
)

from .logging_middleware import (
    LoggingMiddleware,
    PerformanceMiddleware,
)

__all__ = [
    # Auth
    "get_current_user",
    "get_optional_user",
    "require_role",
    "require_admin",
    "require_agent",
    "require_any_auth",
    "check_rate_limit",
    "AuthenticatedUser",
    # Logging
    "LoggingMiddleware",
    "PerformanceMiddleware",
]
