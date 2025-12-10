"""
JASPER Client Portal - Authentication Schemas
JWT tokens, magic links, and session management
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class UserRole(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


# ============================================
# USER SCHEMAS
# ============================================

class UserBase(BaseModel):
    """Base user fields"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.CLIENT


class UserCreate(UserBase):
    """Create user - no password needed (magic link auth)"""
    client_id: Optional[uuid.UUID] = None  # Link to client record


class UserResponse(UserBase):
    """User response"""
    id: uuid.UUID
    client_id: Optional[uuid.UUID]
    is_active: bool
    email_verified: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Update user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notification_preferences: Optional[dict] = None


# ============================================
# AUTHENTICATION SCHEMAS
# ============================================

class MagicLinkRequest(BaseModel):
    """Request magic link for passwordless login"""
    email: EmailStr


class MagicLinkResponse(BaseModel):
    """Magic link sent response"""
    message: str = "If an account exists, a login link has been sent."
    expires_in_minutes: int = 15


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user_id
    email: str
    role: UserRole
    exp: datetime
    iat: datetime
    jti: str  # JWT ID for revocation


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class VerifyTokenRequest(BaseModel):
    """Verify magic link token"""
    token: str


class LogoutRequest(BaseModel):
    """Logout - invalidate session"""
    all_devices: bool = False


# ============================================
# SESSION SCHEMAS
# ============================================

class SessionInfo(BaseModel):
    """Active session info"""
    session_id: uuid.UUID
    user_agent: str
    ip_address: str
    location: Optional[str]
    created_at: datetime
    last_activity: datetime
    is_current: bool = False


class ActiveSessionsResponse(BaseModel):
    """List of active sessions"""
    sessions: list[SessionInfo]
    total: int


# ============================================
# PASSWORD RESET (Optional - for admin users)
# ============================================

class PasswordResetRequest(BaseModel):
    """Request password reset"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset"""
    token: str
    new_password: str = Field(..., min_length=8)


# ============================================
# API KEY SCHEMAS (for integrations)
# ============================================

class APIKeyCreate(BaseModel):
    """Create API key"""
    name: str = Field(..., max_length=100)
    permissions: list[str] = ["read"]  # read, write, admin


class APIKeyResponse(BaseModel):
    """API key response"""
    id: uuid.UUID
    name: str
    key_prefix: str  # First 8 chars for identification
    permissions: list[str]
    last_used: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class APIKeyCreatedResponse(APIKeyResponse):
    """Response when API key is first created (only time full key is shown)"""
    key: str  # Full API key - only shown once
