"""
JASPER CRM - Database Layer
"""

from .database import Base, engine, SessionLocal, get_db, init_db
from .tables import LeadTable, NotificationTable, ActivityLogTable
from .leads import create_lead, get_lead_by_email, get_lead_by_id, update_lead

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "LeadTable",
    "NotificationTable",
    "ActivityLogTable",
    # Lead operations
    "create_lead",
    "get_lead_by_email",
    "get_lead_by_id",
    "update_lead",
]
