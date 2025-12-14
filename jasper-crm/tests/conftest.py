"""
JASPER CRM - Test Configuration and Fixtures

Provides shared test fixtures for the test suite.
"""

import os
import sys
import pytest
from typing import Generator

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test environment variables
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-jwt-secret-for-testing-only"
os.environ["OPENROUTER_API_KEY"] = "test-api-key"
os.environ["DEBUG"] = "true"

from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="module")
def test_app():
    """Create test application instance."""
    from app.main import app
    return app


@pytest.fixture(scope="module")
def client(test_app) -> Generator:
    """Create synchronous test client."""
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
async def async_client(test_app):
    """Create async test client."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Generate valid JWT auth headers for testing."""
    from services.auth_service import auth_service, UserRole

    token = auth_service.create_access_token(
        subject="test-user",
        role=UserRole.ADMIN
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def agent_auth_headers():
    """Generate agent-level auth headers."""
    from services.auth_service import auth_service, UserRole

    token = auth_service.create_access_token(
        subject="test-agent",
        role=UserRole.AGENT
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def legacy_api_headers():
    """Legacy API key headers for backward compatibility tests."""
    return {"X-AI-API-Key": "jasper-ai-blog-key"}


@pytest.fixture
def sample_lead_data():
    """Sample lead data for testing."""
    return {
        "name": "Test Lead",
        "email": "test@example.com",
        "company": "Test Company",
        "phone": "+27123456789",
        "sector": "infrastructure",
        "funding_amount": 10000000,
        "source": "website"
    }


@pytest.fixture
def sample_content_request():
    """Sample content generation request."""
    return {
        "topic": "Infrastructure Finance in South Africa",
        "category": "dfi-insights",
        "seo_keywords": ["infrastructure finance", "DFI funding"],
        "publish_immediately": False
    }
