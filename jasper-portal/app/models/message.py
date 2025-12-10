"""
JASPER Client Portal - Message Model
Admin-to-client messaging system with thread support
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from app.models.base import Base


class MessageType(str, Enum):
    """Message types"""
    TEXT = "text"
    NOTIFICATION = "notification"
    SYSTEM = "system"
    DOCUMENT_SHARE = "document_share"


class Message(Base):
    """Message model for admin-client communication"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    # Thread context - messages are scoped to a company/project
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)

    # Sender info
    sender_type = Column(String(20), nullable=False)  # 'admin' or 'client'
    sender_id = Column(Integer, nullable=False)  # admin_user.id or contact.id
    sender_name = Column(String(255), nullable=False)  # Cached for display

    # Message content
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    subject = Column(String(500), nullable=True)  # Optional subject line
    content = Column(Text, nullable=False)

    # Attachments (stored as JSON array of document IDs)
    attachment_ids = Column(Text, nullable=True)  # JSON: [1, 2, 3]

    # Read status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    # Reply threading
    parent_id = Column(Integer, ForeignKey("messages.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="messages")
    project = relationship("Project", backref="messages")
    replies = relationship("Message", backref="parent", remote_side=[id])

    def __repr__(self):
        return f"<Message {self.id} from {self.sender_type}:{self.sender_name}>"

    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()

    def to_dict(self):
        """Convert to dictionary for API response"""
        import json
        return {
            "id": self.id,
            "company_id": self.company_id,
            "project_id": self.project_id,
            "sender_type": self.sender_type,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "message_type": self.message_type.value if self.message_type else "text",
            "subject": self.subject,
            "content": self.content,
            "attachment_ids": json.loads(self.attachment_ids) if self.attachment_ids else [],
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
