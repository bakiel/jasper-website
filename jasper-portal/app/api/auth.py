"""
JASPER Client Portal - Authentication API
Magic link passwordless auth + JWT sessions
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import jwt

from app.schemas.auth import (
    MagicLinkRequest, MagicLinkResponse, TokenResponse,
    VerifyTokenRequest, UserResponse, UserRole, LogoutRequest,
    ActiveSessionsResponse, SessionInfo
)
from app.core.config import get_settings
from app.models.base import get_db
from app.services.crm import CRMService
from app.services.email import email_service

router = APIRouter()
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# In-memory session store (use Redis in production)
sessions = {}


def get_crm(db: Session = Depends(get_db)) -> CRMService:
    """Dependency to get CRM service"""
    return CRMService(db)


@router.post("/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(
    data: MagicLinkRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    crm: CRMService = Depends(get_crm)
):
    """
    Request a magic link for passwordless login.
    Sends an email with a one-time login link.
    """
    # Get client IP and user agent
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Create magic link (returns None if contact not found)
    magic_link = crm.create_magic_link(
        email=data.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    # Always return success (don't reveal if email exists)
    if magic_link:
        contact = crm.get_contact_by_email(data.email)
        # Queue email send
        background_tasks.add_task(
            email_service.send_magic_link,
            email=data.email,
            first_name=contact.first_name if contact else "User",
            magic_link=magic_link.login_url
        )

    return MagicLinkResponse(
        message="If an account exists, a login link has been sent.",
        expires_in_minutes=settings.MAGIC_LINK_EXPIRE_MINUTES
    )


@router.post("/verify", response_model=TokenResponse)
async def verify_magic_link(
    data: VerifyTokenRequest,
    request: Request,
    crm: CRMService = Depends(get_crm)
):
    """
    Verify magic link token and issue JWT access token.
    """
    # Verify token and get contact
    contact = crm.verify_magic_link(data.token)

    if not contact:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Generate JWT
    access_token, expires_in = create_access_token(contact)

    # Create session record
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "contact_id": contact.id,
        "company_id": contact.company_id,
        "user_agent": request.headers.get("user-agent", "unknown"),
        "ip_address": request.client.host if request.client else "unknown",
        "created_at": datetime.utcnow(),
        "last_activity": datetime.utcnow()
    }

    # Build user response
    user_data = {
        "id": uuid.UUID(int=contact.id),  # Convert int to UUID for schema
        "email": contact.email,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "role": UserRole.CLIENT,
        "client_id": contact.company_id,
        "is_active": True,
        "email_verified": contact.email_verified,
        "last_login": contact.last_login,
        "created_at": contact.created_at
    }

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserResponse(**user_data)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    crm: CRMService = Depends(get_crm)
):
    """Get current authenticated user"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token_payload(token)
    contact = crm.get_contact(payload["contact_id"])

    if not contact:
        raise HTTPException(status_code=401, detail="User not found")

    return UserResponse(
        id=uuid.UUID(int=contact.id),
        email=contact.email,
        first_name=contact.first_name,
        last_name=contact.last_name,
        role=UserRole.CLIENT,
        client_id=contact.company_id,
        is_active=True,
        email_verified=contact.email_verified,
        last_login=contact.last_login,
        created_at=contact.created_at
    )


@router.post("/logout")
async def logout(
    data: LogoutRequest,
    token: str = Depends(oauth2_scheme)
):
    """Logout user - invalidate current or all sessions."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token_payload(token)
    contact_id = payload["contact_id"]

    if data.all_devices:
        # Invalidate all sessions for user
        user_sessions = [
            sid for sid, s in sessions.items()
            if s["contact_id"] == contact_id
        ]
        for sid in user_sessions:
            del sessions[sid]
        return {"message": "Logged out from all devices"}
    else:
        return {"message": "Logged out successfully"}


@router.get("/sessions", response_model=ActiveSessionsResponse)
async def get_active_sessions(token: str = Depends(oauth2_scheme)):
    """Get all active sessions for current user"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token_payload(token)
    contact_id = payload["contact_id"]

    user_sessions = [
        SessionInfo(
            session_id=uuid.UUID(sid) if len(sid) == 36 else uuid.uuid4(),
            user_agent=s["user_agent"],
            ip_address=s["ip_address"],
            location=None,
            created_at=s["created_at"],
            last_activity=s["last_activity"],
            is_current=False
        )
        for sid, s in sessions.items()
        if s["contact_id"] == contact_id
    ]

    return ActiveSessionsResponse(
        sessions=user_sessions,
        total=len(user_sessions)
    )


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_access_token(contact) -> tuple[str, int]:
    """Create JWT access token for contact"""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expires_at = datetime.utcnow() + expires_delta

    payload = {
        "sub": str(contact.id),
        "contact_id": contact.id,
        "company_id": contact.company_id,
        "email": contact.email,
        "exp": expires_at,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, int(expires_delta.total_seconds())


def verify_token_payload(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_contact(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Dependency to get current authenticated contact"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_token_payload(token)
    crm = CRMService(db)
    contact = crm.get_contact(payload["contact_id"])

    if not contact:
        raise HTTPException(status_code=401, detail="User not found")

    return contact
