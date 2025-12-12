"""
JASPER CRM - Notification Models
Pydantic models for notification management
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class NotificationType(str, Enum):
    """Notification categories"""
    LEAD = "lead"
    INVOICE = "invoice"
    PROJECT = "project"
    CLIENT = "client"
    MESSAGE = "message"
    SYSTEM = "system"
    ALERT = "alert"


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# --- Base Models ---

class NotificationCreate(BaseModel):
    """Model for creating a notification"""
    type: NotificationType
    title: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2, max_length=1000)
    link: Optional[str] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    user_id: str = "admin"


class Notification(BaseModel):
    """Complete notification model"""
    id: str = Field(default_factory=lambda: f"NOTIF-{uuid.uuid4().hex[:8].upper()}")
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    user_id: str = "admin"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# --- Response Models ---

class NotificationResponse(BaseModel):
    """API response for a single notification"""
    success: bool = True
    notification: Notification


class NotificationListResponse(BaseModel):
    """API response for notification list"""
    success: bool = True
    notifications: List[Notification]
    unread_count: int
    total: int
