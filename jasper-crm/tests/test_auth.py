"""
JASPER CRM - Authentication Tests

Tests for JWT authentication, token generation, and role-based access.
"""

import pytest
from datetime import datetime, timedelta


class TestAuthService:
    """Tests for AuthService functionality."""

    def test_create_access_token(self):
        """Test JWT access token creation."""
        from services.auth_service import auth_service, UserRole

        token = auth_service.create_access_token(
            subject="test-user",
            role=UserRole.ADMIN
        )

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are typically long

    def test_verify_valid_token(self):
        """Test verification of valid token."""
        from services.auth_service import auth_service, UserRole

        token = auth_service.create_access_token(
            subject="test-user",
            role=UserRole.AGENT
        )

        payload = auth_service.verify_token(token)

        assert payload is not None
        assert payload["sub"] == "test-user"
        assert payload["role"] == "agent"

    def test_verify_expired_token(self):
        """Test verification of expired token."""
        from services.auth_service import auth_service, UserRole

        # Create token with past expiration
        token = auth_service.create_access_token(
            subject="test-user",
            role=UserRole.AGENT,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )

        payload = auth_service.verify_token(token)
        assert payload is None

    def test_verify_invalid_token(self):
        """Test verification of invalid token."""
        from services.auth_service import auth_service

        payload = auth_service.verify_token("invalid-token-string")
        assert payload is None

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        from services.auth_service import auth_service, UserRole

        token = auth_service.create_refresh_token(
            subject="test-user",
            role=UserRole.ADMIN
        )

        payload = auth_service.verify_token(token)

        assert payload is not None
        assert payload["type"] == "refresh"
        assert payload["sub"] == "test-user"

    def test_get_token_data(self):
        """Test structured token data extraction."""
        from services.auth_service import auth_service, UserRole

        token = auth_service.create_access_token(
            subject="test-user",
            role=UserRole.READONLY
        )

        data = auth_service.get_token_data(token)

        assert data is not None
        assert data.sub == "test-user"
        assert data.role == UserRole.READONLY

    def test_legacy_api_key_verification(self):
        """Test legacy API key backward compatibility."""
        from services.auth_service import auth_service, UserRole

        role = auth_service.verify_legacy_api_key("jasper-ai-blog-key")

        assert role == UserRole.AGENT

    def test_invalid_legacy_api_key(self):
        """Test invalid legacy API key rejection."""
        from services.auth_service import auth_service

        role = auth_service.verify_legacy_api_key("invalid-key")
        assert role is None

    def test_service_token_creation(self):
        """Test long-lived service token creation."""
        from services.auth_service import auth_service

        token = auth_service.create_service_token("test-service")

        payload = auth_service.verify_token(token)

        assert payload is not None
        assert "service:test-service" in payload["sub"]


class TestAuthRoutes:
    """Tests for authentication API endpoints."""

    def test_health_check(self, client):
        """Test basic health check."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_token_info_with_jwt(self, client, auth_headers):
        """Test /auth/me endpoint with valid JWT."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "test-user"
        assert data["auth_method"] == "jwt"
        assert data["valid"] is True

    def test_token_info_with_legacy_key(self, client, legacy_api_headers):
        """Test /auth/me endpoint with legacy API key."""
        response = client.get("/api/v1/auth/me", headers=legacy_api_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["auth_method"] == "api_key"

    def test_token_info_unauthorized(self, client):
        """Test /auth/me endpoint without auth."""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_verify_endpoint(self, client, auth_headers):
        """Test token verification endpoint."""
        response = client.post("/api/v1/auth/verify", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["valid"] is True

    def test_dev_quick_token(self, client):
        """Test development quick token endpoint."""
        response = client.post("/api/v1/auth/dev/quick-token?role=agent")

        # Should work when DEBUG=true
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "agent"
