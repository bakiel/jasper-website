"""
JASPER CRM - FastAPI Application
Self-hosted CRM system for JASPER Financial Architecture
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from db import init_db
from routes import leads, notifications, intake
from routes.sequences import router as sequences_router
from routes.agents import router as agents_router
from routes.content import router as content_router
from routes.orchestrator import router as orchestrator_router
from routes.webhooks import router as webhooks_router
from routes.vision import router as vision_router
from routes.documents import router as documents_router
from routes.admin_reports import router as admin_reports_router
from routes.seo import router as seo_router
from routes.auth import router as auth_router
from routes.metrics import router as metrics_router
from routes.images import router as images_router
from routes.news import router as news_router
from routes.prospector import router as prospector_router
from routes.blog_public import router as blog_public_router
from services.sequence_scheduler import sequence_scheduler
from services.news_monitor import news_monitor
from services.lead_prospector import lead_prospector
from services.comms_agent import comms_agent
from services.logging_service import logging_service, get_logger
from orchestrator.agentic_brain import create_agentic_brain
from middleware.logging_middleware import LoggingMiddleware, PerformanceMiddleware

# Initialize centralized logging
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    logger.info("Initializing JASPER CRM database...")
    init_db()
    logger.info("Database initialized")

    # Start email sequence scheduler
    logger.info("Starting email sequence scheduler...")
    sequence_scheduler.start_background_scheduler(interval_seconds=60)
    logger.info("Email scheduler started")

    # Initialize AgenticBrain (DeepSeek V3.2 orchestrator)
    logger.info("Initializing AgenticBrain (DeepSeek V3.2)...")
    app.state.agentic_brain = create_agentic_brain(
        comms_agent=comms_agent,  # AI-powered communications
        # Additional agents will be injected when configured:
        # research_agent, call_coach, lead_service, aleph_client, etc.
    )
    logger.info("AgenticBrain initialized - AI orchestration ready")
    logger.info("CommsAgent ready - WhatsApp/Email AI responses enabled")

    # News Monitor is available via API endpoints
    # Daily scans can be triggered via cron or manually at /api/v1/news/scan
    logger.info("News Monitor ready - DFI/sector news monitoring available")

    # Lead Prospector - Active lead generation from news sources
    logger.info("Lead Prospector ready - Active lead generation enabled")
    logger.info("JASPER CRM started successfully on port 8001")

    yield

    # Stop scheduler on shutdown
    logger.info("Stopping email scheduler...")
    sequence_scheduler.stop_scheduler()
    logger.info("Shutting down JASPER CRM")


app = FastAPI(
    title="JASPER CRM API",
    description="Self-hosted CRM for JASPER Financial Architecture - Lead Management, Notifications & AI Email Sequences",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
ALLOWED_ORIGINS = [
    "https://jasperfinance.org",
    "https://www.jasperfinance.org",
    "https://portal.jasperfinance.org",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(PerformanceMiddleware, slow_threshold_ms=2000)


# --- Static Files & Dashboard ---
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
async def dashboard():
    """System Architecture Dashboard"""
    dashboard_path = STATIC_DIR / "dashboard.html"
    if dashboard_path.exists():
        return FileResponse(dashboard_path)
    return {"message": "JASPER CRM API", "docs": "/docs", "health": "/health"}


# --- Health Check ---
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "jasper-crm",
        "version": "1.0.0",
    }


# --- Include Routers ---
app.include_router(leads.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(intake.router, prefix="/api/v1")
app.include_router(sequences_router)  # Email sequence automation
app.include_router(agents_router, prefix="/api/v1")  # AI Agents (Research, Comms, Call Coach)
app.include_router(content_router)  # AI Content Generation (Blog/SEO)
app.include_router(orchestrator_router)  # AgenticBrain Orchestrator (DeepSeek V3.2)
app.include_router(webhooks_router)  # WhatsApp/Email/Lead Collection Webhooks
app.include_router(vision_router)  # DeepSeek VL Vision (Business Cards, OCR, Search)
app.include_router(documents_router)  # Document Processing (Onboarding Portal Docs)
app.include_router(admin_reports_router)  # Admin AI Document Reports
app.include_router(seo_router)  # SEO Agent System (Keywords, Optimization, Technical)
app.include_router(auth_router)  # JWT Authentication System
app.include_router(metrics_router)  # Prometheus Metrics & Health Aggregator
app.include_router(images_router)  # Image Curation (Pixabay, Pexels, Unsplash)
app.include_router(news_router)  # News Monitor (DFI Announcements, Current Events SEO)
app.include_router(prospector_router)  # Lead Prospector (Active Lead Generation)
app.include_router(blog_public_router, prefix="/api/v1")  # Public Blog API (Search, Posts)


# --- Error Handlers ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal error occurred",
            "detail": str(exc) if os.getenv("DEBUG") else None,
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
