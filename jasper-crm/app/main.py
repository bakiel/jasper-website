"""
JASPER CRM - FastAPI Application
Self-hosted CRM system for JASPER Financial Architecture
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from db import init_db
from routes import leads, notifications, intake
from routes.sequences import router as sequences_router
from services.sequence_scheduler import sequence_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    print("Initializing JASPER CRM database...")
    init_db()
    print("Database initialized")

    # Start email sequence scheduler
    print("Starting email sequence scheduler...")
    sequence_scheduler.start_background_scheduler(interval_seconds=60)
    print("Email scheduler started")

    yield

    # Stop scheduler on shutdown
    print("Stopping email scheduler...")
    sequence_scheduler.stop_scheduler()
    print("Shutting down JASPER CRM")


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


# --- Error Handlers ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    print(f"Unhandled error: {exc}")
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
