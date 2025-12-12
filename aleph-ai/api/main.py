"""
ALEPH AI Infrastructure - Main Application
Self-Hosted AI Platform for Kutlwano Holdings

API Gateway serving:
- JASPER Financial Architecture
- ALEPH Creative-Hub
- Gahn Eden Foods
- Paji E-Commerce
- Ubuntu Agricultural Initiative
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from pathlib import Path
import time

from .config import settings, RATE_LIMITS
from .models import model_manager
from .services import milvus_service
from .routes import (
    embed_router,
    vision_router,
    search_router,
    complete_router,
    ingest_router,
    rag_router,
    crm_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("=" * 60)
    print("  ALEPH AI Infrastructure")
    print("  Self-Hosted AI Platform for Kutlwano Holdings")
    print("=" * 60)

    # Load models
    await model_manager.startup()

    # Initialize Milvus (triggers collection creation)
    _ = milvus_service.list_collections()

    # Start cleanup loop for on-demand models
    cleanup_task = asyncio.create_task(model_manager.cleanup_loop())

    print()
    print("API ready at http://0.0.0.0:8000")
    print("Docs at http://0.0.0.0:8000/docs")
    print("=" * 60)

    yield

    # Shutdown
    cleanup_task.cancel()
    print("ALEPH AI shutting down...")


# Create FastAPI app
app = FastAPI(
    title="ALEPH AI Infrastructure",
    description="""
Self-Hosted AI Platform for Kutlwano Holdings

## Businesses Served
- **JASPER** - DFI Financial Modeling
- **ALEPH** - Creative Design Services
- **Gahn Eden** - Vegan Food Brand
- **Paji** - E-Commerce Platform
- **Ubuntu** - Agricultural Initiative

## Model Stack
- **Embeddings**: EmbeddingGemma (768 dims, FREE)
- **Vision OCR**: SmolDocling (FREE)
- **Vision General**: SmolVLM-500M (FREE)
- **Detection**: Moondream-2B (on-demand, FREE)
- **Completions**: OpenRouter (Gemini FREE, Grok, DeepSeek)

## Authentication
All requests require `X-API-Key` header.
""",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Key validation middleware
@app.middleware("http")
async def validate_api_key(request: Request, call_next):
    """Validate API key and track usage."""
    # Skip validation for docs, health, and chat
    if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc", "/chat"]:
        return await call_next(request)

    # Get API key
    api_key = request.headers.get("X-API-Key")

    if not api_key:
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing X-API-Key header"},
        )

    # Validate key (in production, check against database)
    valid_keys = {
        settings.jasper_api_key: "jasper",
        settings.aleph_api_key: "aleph",
        settings.gahn_api_key: "gahn",
        settings.paji_api_key: "paji",
        settings.ubuntu_api_key: "ubuntu",
    }

    # Allow any key starting with valid prefix in dev
    business = None
    for key, biz in valid_keys.items():
        if api_key == key or api_key.startswith(f"{biz}_"):
            business = biz
            break

    if not business:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid API key"},
        )

    # Add business to request state
    request.state.business = business

    # Process request
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    # Log request (in production, store in database)
    print(f"[{business}] {request.method} {request.url.path} - {duration:.3f}s")

    return response


# Include routers
app.include_router(embed_router)
app.include_router(vision_router)
app.include_router(search_router)
app.include_router(complete_router)
app.include_router(ingest_router)
app.include_router(rag_router)
app.include_router(crm_router)


@app.get("/")
async def root():
    """API root - shows service info."""
    return {
        "service": "ALEPH AI Infrastructure",
        "version": "1.0.0",
        "description": "Self-Hosted AI Platform for Kutlwano Holdings",
        "endpoints": {
            "embed": "/v1/embed",
            "vision": "/v1/vision/*",
            "search": "/v1/search",
            "complete": "/v1/complete",
            "ingest": "/v1/ingest/*",
            "rag": "/v1/rag/*",
            "crm": "/v1/crm/*",
        },
        "docs": "/docs",
    }


@app.get("/chat", response_class=HTMLResponse)
async def chat_interface():
    """Serve the chat interface."""
    chat_file = Path(__file__).parent.parent / "chat.html"
    if chat_file.exists():
        return HTMLResponse(content=chat_file.read_text(), status_code=200)
    return HTMLResponse(content="<h1>Chat interface not found</h1>", status_code=404)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    model_status = model_manager.get_status()

    return {
        "status": "healthy" if model_manager.is_ready else "starting",
        "service": "aleph-ai",
        "version": "1.0.0",
        "models": model_status,
        "milvus": await milvus_service.ping(),
        "collections": len(milvus_service.list_collections()),
    }


@app.get("/status")
async def detailed_status():
    """Detailed system status."""
    collections = milvus_service.list_collections()

    return {
        "service": "aleph-ai",
        "version": "1.0.0",
        "models": model_manager.get_status(),
        "collections": {
            c: milvus_service.count(c)
            for c in collections
        },
        "businesses": ["jasper", "aleph", "gahn", "paji", "ubuntu"],
        "layer_status": {
            "embedding": "self-hosted",
            "vision": "self-hosted",
            "completion": "openrouter",
            "storage": "milvus-lite",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
