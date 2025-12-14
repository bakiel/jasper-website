"""
JASPER CRM - Authentication Routes

Provides JWT token generation, refresh, and management endpoints.
"""

import os
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from services.auth_service import auth_service, UserRole
from middleware.auth_middleware import (
    get_current_user,
    require_admin,
    AuthenticatedUser,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ============================================
# Request/Response Models
# ============================================

class TokenRequest(BaseModel):
    """Request for generating a token."""
    client_id: str = Field(..., description="Service or user identifier")
    client_secret: str = Field(..., description="Secret key for authentication")


class ServiceTokenRequest(BaseModel):
    """Request for generating a service token."""
    service_name: str = Field(..., description="Name of the service")


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    refresh_token: Optional[str] = None
    role: str


class RefreshTokenRequest(BaseModel):
    """Request for refreshing a token."""
    refresh_token: str


class TokenInfoResponse(BaseModel):
    """Information about the current token."""
    subject: str
    role: str
    auth_method: str
    valid: bool


# ============================================
# Configuration
# ============================================

# Authorized clients (in production, store in database)
AUTHORIZED_CLIENTS = {
    "jasper-blog-service": {
        "secret": os.getenv("BLOG_CLIENT_SECRET", "blog-secret-key"),
        "role": UserRole.AGENT,
    },
    "jasper-admin": {
        "secret": os.getenv("ADMIN_CLIENT_SECRET", "admin-secret-key"),
        "role": UserRole.ADMIN,
    },
    "jasper-seo-agent": {
        "secret": os.getenv("SEO_CLIENT_SECRET", "seo-secret-key"),
        "role": UserRole.AGENT,
    },
}


# ============================================
# Routes
# ============================================

@router.post("/token", response_model=TokenResponse)
async def create_token(request: TokenRequest):
    """
    Generate a JWT access token.

    Authenticate using client credentials and receive JWT tokens.

    **Request:**
    - client_id: Your service identifier
    - client_secret: Your secret key

    **Response:**
    - access_token: JWT for API authentication
    - refresh_token: Token for obtaining new access tokens
    - expires_in: Token validity in seconds
    """
    # Verify client credentials
    client = AUTHORIZED_CLIENTS.get(request.client_id)
    if not client or client["secret"] != request.client_secret:
        logger.warning(f"Failed auth attempt for client: {request.client_id}")
        raise HTTPException(
            status_code=401,
            detail="Invalid client credentials"
        )

    # Generate tokens
    access_token = auth_service.create_access_token(
        subject=request.client_id,
        role=client["role"]
    )
    refresh_token = auth_service.create_refresh_token(
        subject=request.client_id,
        role=client["role"]
    )

    logger.info(f"Generated tokens for client: {request.client_id}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=auth_service.config.access_token_expire_minutes * 60,
        role=client["role"].value
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh an access token using a refresh token.

    Use this endpoint to get a new access token without re-authenticating.
    """
    # Verify refresh token
    payload = auth_service.verify_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=400,
            detail="Invalid token type. Refresh token required."
        )

    # Generate new access token
    role = UserRole(payload["role"])
    access_token = auth_service.create_access_token(
        subject=payload["sub"],
        role=role
    )

    logger.info(f"Refreshed token for: {payload['sub']}")

    return TokenResponse(
        access_token=access_token,
        expires_in=auth_service.config.access_token_expire_minutes * 60,
        role=role.value
    )


@router.get("/me", response_model=TokenInfoResponse)
async def get_token_info(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Get information about the current authentication.

    Returns details about who you're authenticated as.
    """
    return TokenInfoResponse(
        subject=user.subject,
        role=user.role.value,
        auth_method=user.auth_method,
        valid=True
    )


@router.post("/service-token", response_model=TokenResponse)
async def create_service_token(
    request: ServiceTokenRequest,
    admin: AuthenticatedUser = Depends(require_admin)
):
    """
    Generate a long-lived service token (Admin only).

    Creates a token valid for 1 year for service-to-service authentication.

    **Requires Admin role.**
    """
    token = auth_service.create_service_token(request.service_name)

    logger.info(f"Admin {admin.subject} created service token for: {request.service_name}")

    return TokenResponse(
        access_token=token,
        expires_in=365 * 24 * 60 * 60,  # 1 year in seconds
        role=UserRole.AGENT.value
    )


@router.post("/verify")
async def verify_token_endpoint(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Verify that a token is valid.

    Returns 200 if token is valid, 401 if not.
    """
    return {
        "valid": True,
        "subject": user.subject,
        "role": user.role.value
    }


# ============================================
# Development/Debug Endpoints
# ============================================

if os.getenv("DEBUG", "false").lower() == "true":

    @router.post("/dev/quick-token")
    async def dev_quick_token(role: str = "agent"):
        """
        [DEBUG ONLY] Generate a quick token for development.

        Only available when DEBUG=true.
        """
        user_role = UserRole(role) if role in [r.value for r in UserRole] else UserRole.AGENT

        token = auth_service.create_access_token(
            subject="dev-user",
            role=user_role
        )

        return {
            "access_token": token,
            "expires_in": 3600,
            "role": user_role.value,
            "warning": "Development token - not for production use"
        }
