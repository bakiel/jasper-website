"""
JASPER CRM - JWT Authentication Service

Provides secure JWT-based authentication to replace simple API keys.
Supports role-based access control (admin, agent, readonly).
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from enum import Enum

import jwt
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class UserRole(str, Enum):
    """User roles for access control."""
    ADMIN = "admin"
    AGENT = "agent"
    READONLY = "readonly"


class TokenData(BaseModel):
    """JWT token payload data."""
    sub: str  # Subject (user ID or service name)
    role: UserRole
    exp: datetime
    iat: datetime
    jti: Optional[str] = None  # JWT ID for token tracking


class AuthConfig:
    """Authentication configuration."""

    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET", self._generate_default_secret())
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
        self.refresh_token_expire_days = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7"))

        # Service API keys (for backward compatibility during migration)
        self.legacy_api_keys = {
            os.getenv("AI_BLOG_API_KEY", "jasper-ai-blog-key"): UserRole.AGENT,
            os.getenv("ADMIN_API_KEY", "jasper-admin-key"): UserRole.ADMIN,
        }

        if self.secret_key == self._generate_default_secret():
            logger.warning("Using default JWT secret - set JWT_SECRET in production!")

    def _generate_default_secret(self) -> str:
        """Generate a default secret (NOT for production)."""
        return "jasper-dev-secret-change-in-production-" + "x" * 32


class AuthService:
    """
    JWT Authentication Service.

    Provides token generation, validation, and role-based access control.
    """

    def __init__(self):
        self.config = AuthConfig()
        logger.info("AuthService initialized with JWT authentication")

    def create_access_token(
        self,
        subject: str,
        role: UserRole = UserRole.READONLY,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a new JWT access token.

        Args:
            subject: User ID or service identifier
            role: User role for access control
            expires_delta: Optional custom expiration time

        Returns:
            Encoded JWT token string
        """
        now = datetime.utcnow()

        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=self.config.access_token_expire_minutes)

        payload = {
            "sub": subject,
            "role": role.value,
            "exp": expire,
            "iat": now,
            "type": "access"
        }

        token = jwt.encode(
            payload,
            self.config.secret_key,
            algorithm=self.config.algorithm
        )

        logger.info(f"Created access token for {subject} with role {role.value}")
        return token

    def create_refresh_token(self, subject: str, role: UserRole) -> str:
        """
        Create a refresh token for obtaining new access tokens.

        Args:
            subject: User ID or service identifier
            role: User role

        Returns:
            Encoded JWT refresh token
        """
        now = datetime.utcnow()
        expire = now + timedelta(days=self.config.refresh_token_expire_days)

        payload = {
            "sub": subject,
            "role": role.value,
            "exp": expire,
            "iat": now,
            "type": "refresh"
        }

        return jwt.encode(
            payload,
            self.config.secret_key,
            algorithm=self.config.algorithm
        )

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.

        Args:
            token: JWT token string

        Returns:
            Decoded payload if valid, None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                self.config.secret_key,
                algorithms=[self.config.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None

    def verify_legacy_api_key(self, api_key: str) -> Optional[UserRole]:
        """
        Verify a legacy API key (backward compatibility).

        Args:
            api_key: Legacy API key string

        Returns:
            User role if valid, None if invalid
        """
        return self.config.legacy_api_keys.get(api_key)

    def get_token_data(self, token: str) -> Optional[TokenData]:
        """
        Get structured token data from a JWT.

        Args:
            token: JWT token string

        Returns:
            TokenData if valid, None if invalid
        """
        payload = self.verify_token(token)
        if not payload:
            return None

        try:
            return TokenData(
                sub=payload["sub"],
                role=UserRole(payload["role"]),
                exp=datetime.fromtimestamp(payload["exp"]),
                iat=datetime.fromtimestamp(payload["iat"]),
                jti=payload.get("jti")
            )
        except (KeyError, ValueError) as e:
            logger.warning(f"Failed to parse token data: {e}")
            return None

    def create_service_token(self, service_name: str) -> str:
        """
        Create a long-lived token for service-to-service auth.

        Args:
            service_name: Name of the service

        Returns:
            JWT token with extended expiry
        """
        return self.create_access_token(
            subject=f"service:{service_name}",
            role=UserRole.AGENT,
            expires_delta=timedelta(days=365)  # 1 year for services
        )


# Singleton instance
auth_service = AuthService()
