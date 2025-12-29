"""
Enhancement Orchestrator Routes
===============================
API endpoints for the autonomous enhancement system.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import Optional, List
from pydantic import BaseModel

from services.enhancement_orchestrator import enhancement_orchestrator
from services.task_tracker_service import task_tracker

router = APIRouter(prefix="/api/v1/enhancement", tags=["enhancement"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class QueueArticleRequest(BaseModel):
    article_slug: str
    triggered_by: str = "manual"


class QueueFullRequest(BaseModel):
    article_slug: str
    triggered_by: str = "manual"


class QueueResponse(BaseModel):
    success: bool
    message: str
    tasks_queued: dict


class ProcessResponse(BaseModel):
    status: str
    processed: int
    succeeded: int
    failed: int
    tasks: list


class StatusResponse(BaseModel):
    orchestrator: dict
    task_stats: dict
    daily_stats: dict
    pending_count: int


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check for enhancement orchestrator."""
    status = enhancement_orchestrator.get_status()
    return {
        "service": "enhancement-orchestrator",
        "status": "healthy",
        "is_running": status["orchestrator"]["is_running"],
        "pending_tasks": status["pending_count"]
    }


# ============================================================================
# QUEUE OPERATIONS
# ============================================================================

@router.post("/queue", response_model=QueueResponse)
async def queue_article_enhancement(request: QueueArticleRequest):
    """
    Queue enhancement tasks for an article.

    Queues: citations, internal links, A/B titles.
    Anti-waste: Skips tasks already done in last 7 days.
    """
    tasks_queued = await enhancement_orchestrator.queue_article_enhancement(
        article_slug=request.article_slug,
        triggered_by=request.triggered_by
    )

    queued_count = sum(1 for v in tasks_queued.values() if v is not None)

    return QueueResponse(
        success=True,
        message=f"Queued {queued_count} tasks for {request.article_slug}",
        tasks_queued=tasks_queued
    )


@router.post("/queue-full", response_model=QueueResponse)
async def queue_full_enhancement(request: QueueFullRequest):
    """
    Queue a full enhancement task (all-in-one).
    """
    task_id = await enhancement_orchestrator.queue_full_enhancement(
        article_slug=request.article_slug,
        triggered_by=request.triggered_by
    )

    return QueueResponse(
        success=task_id is not None,
        message=f"Full enhancement queued" if task_id else "Skipped (anti-waste)",
        tasks_queued={"full_enhancement": task_id}
    )


# ============================================================================
# PROCESSING
# ============================================================================

@router.post("/process")
async def process_pending_tasks(
    background_tasks: BackgroundTasks,
    max_tasks: int = Query(default=5, le=20),
    sync: bool = Query(default=False)
):
    """
    Process pending enhancement tasks.

    By default runs in background. Set sync=true to wait for completion.
    """
    if sync:
        # Synchronous processing
        result = await enhancement_orchestrator.process_pending_tasks(max_tasks=max_tasks)
        return result
    else:
        # Background processing
        background_tasks.add_task(
            enhancement_orchestrator.process_pending_tasks,
            max_tasks=max_tasks
        )
        return {
            "status": "processing_started",
            "message": f"Processing up to {max_tasks} tasks in background"
        }


# ============================================================================
# STATUS & MONITORING
# ============================================================================

@router.get("/status", response_model=StatusResponse)
async def get_orchestrator_status():
    """Get current orchestrator status and statistics."""
    return enhancement_orchestrator.get_status()


@router.get("/article/{slug}/status")
async def get_article_enhancement_status(slug: str):
    """Get enhancement status for a specific article."""
    status = task_tracker.get_article_enhancement_status(slug)
    history = task_tracker.get_tasks_for_article(slug)

    return {
        "status": status,
        "recent_tasks": history[-10:]  # Last 10 tasks
    }
