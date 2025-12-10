"""
JASPER Client Portal - Admin Authentication Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class AdminRole(str, Enum):
    """Admin role levels"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class AdminLoginRequest(BaseModel):
    """Admin login request"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class AdminLoginResponse(BaseModel):
    """Admin login response with JWT"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "AdminUserResponse"


class AdminUserResponse(BaseModel):
    """Admin user information"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: AdminRole
    is_active: bool
    email_verified: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    """Create new admin user"""
    email: EmailStr
    password: str = Field(..., min_length=12)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: AdminRole = AdminRole.VIEWER


class AdminUserUpdate(BaseModel):
    """Update admin user"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None


class AdminPasswordChange(BaseModel):
    """Change admin password"""
    current_password: str
    new_password: str = Field(..., min_length=12)


class AdminPasswordReset(BaseModel):
    """Reset admin password (super admin only)"""
    new_password: str = Field(..., min_length=12)


class GoogleAuthRequest(BaseModel):
    """Google OAuth login request - receives ID token from frontend"""
    credential: str = Field(..., description="Google ID token from Sign In with Google")


# Update forward reference
AdminLoginResponse.model_rebuild()
