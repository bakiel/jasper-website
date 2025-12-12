"""
JASPER CRM - Notification Routes
FastAPI routes for notification management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import Optional

from db import get_db, NotificationTable
from models import (
    Notification,
    NotificationCreate,
    NotificationType,
    NotificationResponse,
    NotificationListResponse,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    x_user_id: str = Header(default="admin"),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List notifications for a user"""
    query = db.query(NotificationTable).filter(NotificationTable.user_id == x_user_id)

    if unread_only:
        query = query.filter(NotificationTable.is_read == False)

    notifications = query.order_by(NotificationTable.created_at.desc()).limit(limit).all()
    unread_count = db.query(NotificationTable).filter(
        NotificationTable.user_id == x_user_id,
        NotificationTable.is_read == False,
    ).count()

    return NotificationListResponse(
        notifications=[Notification.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total=len(notifications),
    )


@router.post("", response_model=NotificationResponse, status_code=201)
async def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
):
    """Create a new notification"""
    notification = Notification(**notification_data.model_dump())
    db_notification = NotificationTable(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    return NotificationResponse(notification=Notification.model_validate(db_notification))


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    x_user_id: str = Header(default="admin"),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
    db_notification = db.query(NotificationTable).filter(
        NotificationTable.id == notification_id,
        NotificationTable.user_id == x_user_id,
    ).first()

    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db_notification.is_read = True
    db.commit()

    return {"success": True, "message": "Notification marked as read"}


@router.patch("/read-all")
async def mark_all_notifications_read(
    x_user_id: str = Header(default="admin"),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for a user"""
    db.query(NotificationTable).filter(
        NotificationTable.user_id == x_user_id,
        NotificationTable.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    x_user_id: str = Header(default="admin"),
    db: Session = Depends(get_db),
):
    """Delete a notification"""
    db_notification = db.query(NotificationTable).filter(
        NotificationTable.id == notification_id,
        NotificationTable.user_id == x_user_id,
    ).first()

    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(db_notification)
    db.commit()

    return {"success": True, "message": "Notification deleted"}


@router.delete("")
async def clear_all_notifications(
    x_user_id: str = Header(default="admin"),
    db: Session = Depends(get_db),
):
    """Clear all notifications for a user"""
    db.query(NotificationTable).filter(
        NotificationTable.user_id == x_user_id,
    ).delete()
    db.commit()

    return {"success": True, "message": "All notifications cleared"}
