"""
JASPER Client Portal - FastAPI Application
Ultimate client experience with design-aligned UI
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import get_settings, design
from app.core.security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
)
from app.models.base import init_db
from app.api import auth, clients, projects, invoices, proposals, documents, admin, webhooks, admin_auth, questionnaire, messages

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure security logging
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Startup: Initialize database tables
    try:
        init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.warning(f"Database init skipped (run migrations instead): {e}")
    yield
    # Shutdown: Clean up resources
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## JASPER Client Portal API

    Professional client management system for JASPER Financial Architecture.

    ### Features
    - Passwordless authentication (magic links)
    - Client onboarding workflow
    - Project tracking & invoicing
    - Document management
    - Payment tracking with crypto support

    ### Design System
    All UI components follow the JASPER brand guidelines:
    - Primary: Emerald (#2C8A5B)
    - Text: Dark Navy (#0F172A)
    - Font: Montserrat
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ============================================
# SECURITY MIDDLEWARE STACK
# ============================================
# Order matters: middleware is applied in reverse order of addition

# Security Headers (outermost - applied last in request, first in response)
app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting
app.add_middleware(RateLimitMiddleware)

# Trusted Host Middleware (prevent Host header attacks)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "jasperfinance.org",
            "*.jasperfinance.org",
            "api.jasperfinance.org",
            "portal.jasperfinance.org",
        ]
    )

# CORS middleware (configure explicitly, avoid wildcards in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jasperfinance.org",
        "https://www.jasperfinance.org",
        "https://portal.jasperfinance.org",
        "https://api.jasperfinance.org",
        "http://localhost:3000",  # Dev only
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Accept",
        "Origin",
    ],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-Request-Id",
    ],
    max_age=3600,  # Cache preflight for 1 hour
)


# Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")


# ============================================
# API ROUTES
# ============================================

# Include routers with /api/v1 prefix
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

app.include_router(
    clients.router,
    prefix=f"{settings.API_V1_PREFIX}/clients",
    tags=["Clients"]
)

app.include_router(
    projects.router,
    prefix=f"{settings.API_V1_PREFIX}/projects",
    tags=["Projects"]
)

app.include_router(
    invoices.router,
    prefix=f"{settings.API_V1_PREFIX}/invoices",
    tags=["Invoices"]
)

app.include_router(
    proposals.router,
    prefix=f"{settings.API_V1_PREFIX}/proposals",
    tags=["Proposals"]
)

app.include_router(
    documents.router,
    prefix=f"{settings.API_V1_PREFIX}/documents",
    tags=["Documents"]
)

app.include_router(
    admin.router,
    prefix=f"{settings.API_V1_PREFIX}/admin",
    tags=["Admin"]
)

app.include_router(
    webhooks.router,
    prefix=f"{settings.API_V1_PREFIX}/webhooks",
    tags=["Webhooks"]
)

app.include_router(
    admin_auth.router,
    prefix=f"{settings.API_V1_PREFIX}/admin/auth",
    tags=["Admin Authentication"]
)

app.include_router(
    questionnaire.router,
    prefix=f"{settings.API_V1_PREFIX}/questionnaire",
    tags=["Client Questionnaire"]
)

app.include_router(
    messages.router,
    prefix=f"{settings.API_V1_PREFIX}/messages",
    tags=["Messages"]
)


# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint - API information and navigation"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "docs": "/api/docs",
            "redoc": "/api/redoc",
            "health": "/health",
            "api": {
                "clients": "/api/v1/clients/",
                "projects": "/api/v1/projects/",
                "invoices": "/api/v1/invoices/",
                "admin": "/api/v1/admin/dashboard",
                "webhooks": "/api/v1/webhooks/"
            }
        },
        "message": "Welcome to JASPER Client Portal API. Visit /api/docs for interactive documentation."
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/api/design-system", tags=["Design"])
async def get_design_system():
    """
    Get JASPER design system constants for frontend alignment.
    Ensures consistent styling across all portal components.
    """
    return {
        "colors": design.COLORS,
        "fonts": design.FONTS,
        "spacing": design.SPACING,
        "radius": design.RADIUS,
        "shadows": design.SHADOWS,
        "components": design.COMPONENTS,
        "branding": {
            "company_name": settings.COMPANY_NAME,
            "logo_url": "/static/images/logo.png",
            "favicon_url": "/static/images/favicon.ico",
        }
    }


@app.get("/api/company-info", tags=["Info"])
async def get_company_info():
    """Get company information for documents and UI"""
    return {
        "name": settings.COMPANY_NAME,
        "registration": settings.COMPANY_REG,
        "address": settings.COMPANY_ADDRESS,
        "email": settings.COMPANY_EMAIL,
        "website": settings.COMPANY_WEBSITE,
        "payment_methods": {
            "crypto": {
                "usdt_trc20": settings.USDT_TRC20,
                "usdc_erc20": settings.USDC_ERC20,
                "btc": settings.BTC_ADDRESS,
                "discount": f"{settings.CRYPTO_DISCOUNT * 100:.0f}%"
            },
            "paypal": settings.PAYPAL_EMAIL,
            "bank": {
                "account_name": settings.COMPANY_NAME,
                "account_number": settings.FNB_ACCOUNT,
                "branch_code": settings.FNB_BRANCH,
                "swift": settings.FNB_SWIFT,
                "bank": "FNB (First National Bank)"
            }
        }
    }


# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path)
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
