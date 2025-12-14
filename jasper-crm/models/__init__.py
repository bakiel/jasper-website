"""
JASPER CRM - Pydantic Models
"""

from .lead import (
    Lead,
    LeadCreate,
    LeadUpdate,
    LeadStatus,
    LeadSource,
    LeadPriority,
    LeadTier,
    ResearchStatus,
    Sector,
    FundingStage,
    LeadResponse,
    LeadListResponse,
    LeadStats,
    LeadStatsResponse,
    BANTQualification,
    CompanyProfile,
    PersonProfile,
    SimilarDeal,
)

from .notification import (
    Notification,
    NotificationCreate,
    NotificationType,
    NotificationPriority,
    NotificationResponse,
    NotificationListResponse,
)

__all__ = [
    # Lead models
    "Lead",
    "LeadCreate",
    "LeadUpdate",
    "LeadStatus",
    "LeadSource",
    "LeadPriority",
    "Sector",
    "FundingStage",
    "LeadResponse",
    "LeadListResponse",
    "LeadStats",
    "LeadStatsResponse",
    # Notification models
    "Notification",
    "NotificationCreate",
    "NotificationType",
    "NotificationPriority",
    "NotificationResponse",
    "NotificationListResponse",
]
