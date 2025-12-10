"""
JASPER Portal - Test Configuration
Shared fixtures and test setup
"""

import pytest
from typing import Generator, AsyncGenerator
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Import app components
import sys
sys.path.insert(0, str(__file__).rsplit("/", 2)[0])

from app.main import app
from app.models.base import Base
from app.core.config import get_settings


# ============================================
# TEST DATABASE
# ============================================

# Use SQLite for tests (in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for tests"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# ============================================
# FIXTURES
# ============================================

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database override"""
    from app.models.base import get_db

    app.dependency_overrides[get_db] = lambda: db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def mock_email_service():
    """Mock email service for tests"""
    mock = MagicMock()
    mock.send_email.return_value = True
    return mock


# ============================================
# TEST DATA FACTORIES
# ============================================

@pytest.fixture
def sample_company_data():
    """Sample company data for tests"""
    return {
        "name": "Test Company Ltd",
        "industry": "technology",
        "website": "https://testcompany.com",
        "address": "123 Test Street, Test City",
        "notes": "Test company for unit tests"
    }


@pytest.fixture
def sample_contact_data():
    """Sample contact data for tests"""
    return {
        "name": "John Test",
        "email": "john.test@example.com",
        "phone": "+27123456789",
        "role": "CEO",
        "is_primary": True
    }


@pytest.fixture
def sample_project_data():
    """Sample project data for tests"""
    return {
        "title": "Test Financial Model",
        "description": "A test project for unit testing",
        "service_type": "full_model",
        "complexity": "medium"
    }


@pytest.fixture
def sample_invoice_data():
    """Sample invoice data for tests"""
    return {
        "type": "deposit",
        "currency": "USD",
        "due_date": "2025-01-15",
        "notes": "Test invoice"
    }


# ============================================
# AUTH FIXTURES
# ============================================

@pytest.fixture
def auth_headers():
    """Generate test authentication headers"""
    # In a real test, this would create a valid JWT token
    return {
        "Authorization": "Bearer test-token-for-testing"
    }


@pytest.fixture
def admin_user():
    """Create an admin user for tests"""
    return {
        "id": 1,
        "email": "admin@jasperfinance.org",
        "role": "admin",
        "is_active": True
    }


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_test_company(db: Session, **kwargs):
    """Helper to create a test company"""
    from app.models.company import Company
    from app.models.enums import Industry, CompanyStatus

    defaults = {
        "name": "Test Company",
        "industry": Industry.TECHNOLOGY,
        "status": CompanyStatus.LEAD,
    }
    defaults.update(kwargs)

    company = Company(**defaults)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def create_test_contact(db: Session, company_id: int, **kwargs):
    """Helper to create a test contact"""
    from app.models.contact import Contact

    defaults = {
        "company_id": company_id,
        "name": "Test Contact",
        "email": f"test{company_id}@example.com",
        "is_primary": True,
    }
    defaults.update(kwargs)

    contact = Contact(**defaults)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def create_test_project(db: Session, company_id: int, contact_id: int, **kwargs):
    """Helper to create a test project"""
    from app.models.project import Project
    from app.models.enums import ServiceType, ComplexityLevel

    defaults = {
        "company_id": company_id,
        "contact_id": contact_id,
        "title": "Test Project",
        "service_type": ServiceType.FULL_MODEL,
        "complexity": ComplexityLevel.MEDIUM,
    }
    defaults.update(kwargs)

    project = Project(**defaults)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
