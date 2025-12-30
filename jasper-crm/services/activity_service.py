"""
Activity Service - Centralized activity logging for transparency
Uses the existing ActivityLogTable from db/tables.py
"""

import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from db import SessionLocal, ActivityLogTable

logger = logging.getLogger(__name__)


async def log_activity(
    entity_type: str,
    entity_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> None:
    """
    Log an activity to the database for transparency tracking.

    Args:
        entity_type: Type of entity (e.g., "blog", "lead", "sequence")
        entity_id: Identifier of the entity (e.g., slug, email, id)
        action: Action performed (e.g., "created", "updated", "published")
        details: Additional details as dictionary
        user_id: User who performed the action
    """
    try:
        db = SessionLocal()
        try:
            activity = ActivityLogTable(
                entity_type=entity_type,
                entity_id=str(entity_id),
                action=action,
                details=json.dumps(details) if details else None,
                user_id=user_id or "system"
            )
            db.add(activity)
            db.commit()
            logger.info(f"Activity logged: {entity_type}/{entity_id} - {action}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        # Don't raise - activity logging should not break the main flow


async def get_activities(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get activities from the database with optional filtering.

    Args:
        entity_type: Filter by entity type
        entity_id: Filter by entity ID
        action: Filter by action type
        limit: Maximum number of results
        offset: Number of results to skip

    Returns:
        List of activity dictionaries
    """
    try:
        db = SessionLocal()
        try:
            query = db.query(ActivityLogTable)

            if entity_type:
                query = query.filter(ActivityLogTable.entity_type == entity_type)
            if entity_id:
                query = query.filter(ActivityLogTable.entity_id == entity_id)
            if action:
                query = query.filter(ActivityLogTable.action == action)

            # Order by most recent first
            query = query.order_by(ActivityLogTable.created_at.desc())

            # Apply pagination
            activities = query.offset(offset).limit(limit).all()

            return [
                {
                    "id": a.id,
                    "entity_type": a.entity_type,
                    "entity_id": a.entity_id,
                    "action": a.action,
                    "details": json.loads(a.details) if a.details else None,
                    "user_id": a.user_id,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in activities
            ]
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error getting activities: {e}")
        return []


async def get_activity_count(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None
) -> int:
    """Get total count of activities matching filters."""
    try:
        db = SessionLocal()
        try:
            query = db.query(ActivityLogTable)

            if entity_type:
                query = query.filter(ActivityLogTable.entity_type == entity_type)
            if entity_id:
                query = query.filter(ActivityLogTable.entity_id == entity_id)

            return query.count()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error counting activities: {e}")
        return 0


# Convenience function for sync calls (non-async contexts)
def log_activity_sync(
    entity_type: str,
    entity_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> None:
    """Synchronous version of log_activity for non-async contexts."""
    try:
        db = SessionLocal()
        try:
            activity = ActivityLogTable(
                entity_type=entity_type,
                entity_id=str(entity_id),
                action=action,
                details=json.dumps(details) if details else None,
                user_id=user_id or "system"
            )
            db.add(activity)
            db.commit()
            logger.info(f"Activity logged (sync): {entity_type}/{entity_id} - {action}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error logging activity (sync): {e}")
