"""
JASPER Client Portal - Admin Authentication API
Email/password auth + JWT sessions for admin users
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import uuid
import jwt

from app.schemas.admin_auth import (
    AdminLoginRequest, AdminLoginResponse, AdminUserResponse,
    AdminUserCreate, AdminUserUpdate, AdminPasswordChange,
    AdminRole, GoogleAuthRequest
)
import httpx
from app.models.admin_user import AdminUser, AdminRole as ModelAdminRole
from app.core.config import get_settings
from app.models.base import get_db

router = APIRouter()
settings = get_settings()


# ============================================
# HELPER FUNCTIONS (must be defined before routes that use them)
# ============================================

def create_admin_token(admin: AdminUser) -> tuple[str, int]:
    """Create JWT access token for admin"""
    # Longer session for admins (8 hours)
    expires_delta = timedelta(hours=8)
    expires_at = datetime.utcnow() + expires_delta

    payload = {
        "sub": str(admin.id),
        "admin_id": admin.id,
        "email": admin.email,
        "role": admin.role.value,
        "type": "admin",  # Distinguish from client tokens
        "exp": expires_at,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, int(expires_delta.total_seconds())


def verify_admin_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> AdminUser:
    """Dependency to get current authenticated admin"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = parts[1]
    payload = verify_admin_token(token)
    admin = db.query(AdminUser).filter(
        AdminUser.id == payload["admin_id"]
    ).first()

    if not admin:
        raise HTTPException(status_code=401, detail="User not found")

    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")

    return admin


# Role-based access control dependencies
async def require_admin(admin: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
    """Require admin or super_admin role"""
    if not admin.can_manage_clients():
        raise HTTPException(status_code=403, detail="Admin access required")
    return admin


async def require_super_admin(admin: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
    """Require super_admin role"""
    if not admin.can_manage_admins():
        raise HTTPException(status_code=403, detail="Super admin access required")
    return admin


# ============================================
# API ROUTES
# ============================================

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    data: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Admin login with email and password.
    Returns JWT access token.
    """
    # Find admin user
    admin = db.query(AdminUser).filter(
        AdminUser.email == data.email.lower()
    ).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not admin.verify_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check if active
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")

    # Update last login
    admin.last_login = datetime.utcnow()
    admin.last_login_ip = request.client.host if request.client else None
    db.commit()

    # Generate JWT
    access_token, expires_in = create_admin_token(admin)

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=AdminUserResponse(
            id=admin.id,
            email=admin.email,
            first_name=admin.first_name,
            last_name=admin.last_name,
            role=AdminRole(admin.role.value),
            is_active=admin.is_active,
            email_verified=admin.email_verified,
            last_login=admin.last_login,
            created_at=admin.created_at
        )
    )


@router.get("/me", response_model=AdminUserResponse)
async def get_current_admin(
    admin: AdminUser = Depends(get_current_admin_user)
):
    """Get current authenticated admin user"""
    return AdminUserResponse(
        id=admin.id,
        email=admin.email,
        first_name=admin.first_name,
        last_name=admin.last_name,
        role=AdminRole(admin.role.value),
        is_active=admin.is_active,
        email_verified=admin.email_verified,
        last_login=admin.last_login,
        created_at=admin.created_at
    )


@router.post("/users", response_model=AdminUserResponse)
async def create_admin_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Create new admin user (super admin only)"""
    if not current_admin.can_manage_admins():
        raise HTTPException(status_code=403, detail="Not authorized to create admins")

    # Check if email exists
    existing = db.query(AdminUser).filter(
        AdminUser.email == data.email.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create admin
    admin = AdminUser(
        email=data.email.lower(),
        first_name=data.first_name,
        last_name=data.last_name,
        role=ModelAdminRole(data.role.value),
        is_active=True,
        email_verified=False
    )
    admin.set_password(data.password)

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return AdminUserResponse(
        id=admin.id,
        email=admin.email,
        first_name=admin.first_name,
        last_name=admin.last_name,
        role=AdminRole(admin.role.value),
        is_active=admin.is_active,
        email_verified=admin.email_verified,
        last_login=admin.last_login,
        created_at=admin.created_at
    )


@router.post("/change-password")
async def change_password(
    data: AdminPasswordChange,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Change own password"""
    if not current_admin.verify_password(data.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_admin.set_password(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/logout")
async def admin_logout():
    """Logout admin (client-side token removal)"""
    return {"message": "Logged out successfully"}


@router.post("/google", response_model=AdminLoginResponse)
async def google_login(
    data: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Login with Google OAuth.
    Receives Google ID token from frontend, verifies it with Google,
    and creates/returns admin user if email is allowed.
    """
    # Verify Google ID token with Google's tokeninfo endpoint
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = response.json()

    # Verify the token is for our app
    if google_data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token not intended for this application")

    # Extract user info from Google response
    email = google_data.get("email", "").lower()
    email_verified = google_data.get("email_verified", "false") == "true"
    given_name = google_data.get("given_name", "")
    family_name = google_data.get("family_name", "")

    if not email or not email_verified:
        raise HTTPException(status_code=401, detail="Email not verified with Google")

    # Find or create admin user
    admin = db.query(AdminUser).filter(AdminUser.email == email).first()

    if not admin:
        # Auto-create admin for first-time Google login
        # By default they get 'viewer' role, super_admin can upgrade later
        admin = AdminUser(
            email=email,
            first_name=given_name or "Google",
            last_name=family_name or "User",
            role=ModelAdminRole.ADMIN,  # Default role for Google users
            is_active=True,
            email_verified=True,  # Google verified their email
            google_id=google_data.get("sub")
        )
        # No password for Google-only users
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Check if active
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")

    # Update last login
    admin.last_login = datetime.utcnow()
    admin.last_login_ip = request.client.host if request.client else None
    db.commit()

    # Generate JWT
    access_token, expires_in = create_admin_token(admin)

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=AdminUserResponse(
            id=admin.id,
            email=admin.email,
            first_name=admin.first_name,
            last_name=admin.last_name,
            role=AdminRole(admin.role.value),
            is_active=admin.is_active,
            email_verified=admin.email_verified,
            last_login=admin.last_login,
            created_at=admin.created_at
        )
    )


@router.get("/google/client-id")
async def get_google_client_id():
    """Return Google Client ID for frontend Sign In with Google button"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    return {"client_id": settings.GOOGLE_CLIENT_ID}
