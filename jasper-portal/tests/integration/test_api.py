"""
JASPER Portal - API Integration Tests
Tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Tests for health check endpoints"""

    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint returns API info"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"

    def test_health_check(self, client: TestClient):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestDesignSystemEndpoint:
    """Tests for design system API"""

    def test_get_design_system(self, client: TestClient):
        """Test design system endpoint returns colors and fonts"""
        response = client.get("/api/design-system")

        assert response.status_code == 200
        data = response.json()
        assert "colors" in data
        assert "fonts" in data
        assert "emerald" in data["colors"]
        assert "navy" in data["colors"]


class TestCompanyInfoEndpoint:
    """Tests for company info API"""

    def test_get_company_info(self, client: TestClient):
        """Test company info endpoint"""
        response = client.get("/api/company-info")

        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "payment_methods" in data


class TestSecurityHeaders:
    """Tests for security headers middleware"""

    def test_security_headers_present(self, client: TestClient):
        """Test that security headers are set on responses"""
        response = client.get("/health")

        # Check for key security headers
        assert "x-content-type-options" in response.headers
        assert response.headers["x-content-type-options"] == "nosniff"

        assert "x-frame-options" in response.headers
        assert response.headers["x-frame-options"] == "DENY"

        assert "referrer-policy" in response.headers


class TestErrorHandling:
    """Tests for error handling"""

    def test_404_handler(self, client: TestClient):
        """Test 404 error response format"""
        response = client.get("/nonexistent-endpoint")

        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["error"] == "Not Found"


class TestWebhookEndpoints:
    """Tests for webhook endpoints"""

    def test_contact_form_webhook_validation(self, client: TestClient):
        """Test contact form webhook validates required fields"""
        # Missing required fields
        response = client.post(
            "/api/v1/webhooks/contact-form",
            json={"name": "Test"}
        )

        # Should fail validation
        assert response.status_code in [400, 422]


class TestRateLimiting:
    """Tests for rate limiting"""

    def test_rate_limit_headers(self, client: TestClient):
        """Test that rate limit headers are included in responses"""
        response = client.get("/api/v1/clients/")

        # Rate limit headers should be present
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
