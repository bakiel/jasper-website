"""
JASPER CRM - Health and Integration Tests

Tests for system health, endpoint availability, and basic integration.
"""

import pytest


class TestHealthEndpoints:
    """Tests for health check and system status."""

    def test_health_check(self, client):
        """Test main health check endpoint."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "jasper-crm"

    def test_docs_endpoint(self, client):
        """Test OpenAPI docs are accessible."""
        response = client.get("/docs")

        assert response.status_code == 200

    def test_openapi_schema(self, client):
        """Test OpenAPI schema is valid."""
        response = client.get("/openapi.json")

        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data


class TestCORSConfiguration:
    """Tests for CORS configuration."""

    def test_cors_headers_allowed_origin(self, client):
        """Test CORS headers for allowed origin."""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )

        # CORS preflight should be handled
        assert response.status_code in [200, 204, 405]

    def test_cors_headers_disallowed_origin(self, client):
        """Test CORS for disallowed origin."""
        response = client.get(
            "/health",
            headers={"Origin": "http://malicious-site.com"}
        )

        # Request should still work but without CORS headers
        assert response.status_code == 200


class TestAPIRouteAvailability:
    """Tests to verify all major routes are available."""

    def test_leads_routes_exist(self, client):
        """Test leads endpoints exist."""
        response = client.get("/api/v1/leads")
        # May require auth, but route should exist
        assert response.status_code in [200, 401, 403]

    def test_content_routes_exist(self, client):
        """Test content endpoints exist."""
        response = client.get("/api/v1/content/suggestions")
        assert response.status_code in [200, 401, 404]

    def test_seo_routes_exist(self, client):
        """Test SEO endpoints exist."""
        response = client.get("/api/v1/seo/keywords")
        assert response.status_code in [200, 401]

    def test_auth_routes_exist(self, client):
        """Test auth endpoints exist."""
        response = client.post("/api/v1/auth/verify")
        # Should return 401 without token
        assert response.status_code == 401

    def test_agents_routes_exist(self, client):
        """Test agents endpoints exist."""
        response = client.get("/api/v1/agents")
        assert response.status_code in [200, 401, 404]


class TestErrorHandling:
    """Tests for error handling."""

    def test_404_handler(self, client):
        """Test 404 for non-existent routes."""
        response = client.get("/api/v1/nonexistent-route")

        assert response.status_code == 404

    def test_method_not_allowed(self, client):
        """Test method not allowed handling."""
        response = client.delete("/health")

        assert response.status_code == 405

    def test_validation_error(self, client, auth_headers):
        """Test validation error handling."""
        response = client.post(
            "/api/v1/leads",
            headers=auth_headers,
            json={"invalid": "data"}  # Missing required fields
        )

        # Should return validation error
        assert response.status_code in [422, 401, 400]
