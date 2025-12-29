"""
Task Routes API
===============
Provides visibility into enhancement task status and history.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from services.task_tracker_service import task_tracker, TaskType, TaskStatus

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TaskResponse(BaseModel):
    task_id: str
    article_slug: str
    task_type: str
    status: str
    triggered_by: str
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    result: Optional[dict]
    verification: Optional[dict]
    error: Optional[str]


class ArticleStatusResponse(BaseModel):
    article_slug: str
    has_citations: bool
    has_internal_links: bool
    has_ab_titles: bool
    is_fully_enhanced: bool
    pending_tasks: int
    failed_tasks: int


class StatsResponse(BaseModel):
    total_tasks: int
    completed: int
    failed: int
    pending_queue: int
    success_rate: float


class DailyStatsResponse(BaseModel):
    date: str
    total: int
    completed: int
    failed: int
    pending: int
    running: int


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check for task tracking service."""
    stats = task_tracker.get_overall_stats()
    return {
        "service": "task-tracker",
        "status": "healthy",
        "stats": stats
    }


# ============================================================================
# TASK QUERIES
# ============================================================================

@router.get("/recent", response_model=List[TaskResponse])
async def get_recent_tasks(limit: int = Query(default=50, le=100)):
    """Get most recent enhancement tasks."""
    tasks = task_tracker.get_recent_tasks(limit=limit)
    return tasks


@router.get("/pending", response_model=List[TaskResponse])
async def get_pending_tasks():
    """Get all pending tasks (queue)."""
    tasks = task_tracker.get_pending_tasks()
    return tasks


@router.get("/failed", response_model=List[TaskResponse])
async def get_failed_tasks(limit: int = Query(default=20, le=50)):
    """Get recent failed tasks for retry."""
    tasks = task_tracker.get_failed_tasks(limit=limit)
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get a specific task by ID."""
    task = task_tracker.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


# ============================================================================
# ARTICLE STATUS
# ============================================================================

@router.get("/article/{slug}/status", response_model=ArticleStatusResponse)
async def get_article_status(slug: str):
    """Get enhancement status for a specific article."""
    status = task_tracker.get_article_enhancement_status(slug)
    return status


@router.get("/article/{slug}/history", response_model=List[TaskResponse])
async def get_article_history(slug: str):
    """Get all tasks for a specific article."""
    tasks = task_tracker.get_tasks_for_article(slug)
    return tasks


# ============================================================================
# STATISTICS
# ============================================================================

@router.get("/stats/overall", response_model=StatsResponse)
async def get_overall_stats():
    """Get overall task statistics."""
    stats = task_tracker.get_overall_stats()
    return stats


@router.get("/stats/daily", response_model=DailyStatsResponse)
async def get_daily_stats():
    """Get today's task statistics."""
    stats = task_tracker.get_daily_stats()
    return stats


# ============================================================================
# ADMIN OPERATIONS
# ============================================================================

@router.post("/cleanup")
async def cleanup_old_tasks(days: int = Query(default=30, ge=7, le=90)):
    """
    Clean up completed/failed tasks older than specified days.
    Minimum 7 days, maximum 90 days.
    """
    task_tracker.cleanup_old_tasks(days=days)
    return {
        "success": True,
        "message": f"Cleaned up tasks older than {days} days"
    }
