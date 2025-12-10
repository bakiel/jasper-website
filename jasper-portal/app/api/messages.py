"""
JASPER Client Portal - Messages API
Admin-to-client messaging with thread support
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import json

from app.models.base import get_db
from app.models.message import Message, MessageType
from app.models.company import Company
from app.models.project import Project
from app.models.contact import Contact

router = APIRouter()


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class MessageCreate(BaseModel):
    company_id: int
    project_id: Optional[int] = None
    subject: Optional[str] = None
    content: str
    message_type: MessageType = MessageType.TEXT
    attachment_ids: Optional[List[int]] = None
    parent_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    company_id: int
    project_id: Optional[int]
    sender_type: str
    sender_id: int
    sender_name: str
    message_type: str
    subject: Optional[str]
    content: str
    attachment_ids: List[int]
    is_read: bool
    read_at: Optional[datetime]
    parent_id: Optional[int]
    created_at: datetime
    reply_count: Optional[int] = 0

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    unread_count: int


class ThreadResponse(BaseModel):
    company_id: int
    company_name: str
    project_id: Optional[int]
    project_name: Optional[str]
    last_message: Optional[MessageResponse]
    message_count: int
    unread_count: int


class ThreadListResponse(BaseModel):
    threads: List[ThreadResponse]
    total: int


# ============================================
# HELPER FUNCTIONS
# ============================================

def message_to_response(msg: Message, reply_count: int = 0) -> MessageResponse:
    """Convert Message model to response schema"""
    return MessageResponse(
        id=msg.id,
        company_id=msg.company_id,
        project_id=msg.project_id,
        sender_type=msg.sender_type,
        sender_id=msg.sender_id,
        sender_name=msg.sender_name,
        message_type=msg.message_type.value if msg.message_type else "text",
        subject=msg.subject,
        content=msg.content,
        attachment_ids=json.loads(msg.attachment_ids) if msg.attachment_ids else [],
        is_read=msg.is_read,
        read_at=msg.read_at,
        parent_id=msg.parent_id,
        created_at=msg.created_at,
        reply_count=reply_count,
    )


# ============================================
# ADMIN ENDPOINTS
# ============================================

@router.post("/send", response_model=MessageResponse, status_code=201)
async def send_message(
    data: MessageCreate,
    sender_name: str = Query(default="Admin"),
    sender_id: int = Query(default=1),
    db: Session = Depends(get_db)
):
    """
    Send a message from admin to a company/client.
    Messages can be scoped to a specific project.
    """
    # Verify company exists
    company = db.execute(
        select(Company).where(Company.id == data.company_id)
    ).scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Verify project if provided
    if data.project_id:
        project = db.execute(
            select(Project).where(
                Project.id == data.project_id,
                Project.company_id == data.company_id
            )
        ).scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Create message
    message = Message(
        company_id=data.company_id,
        project_id=data.project_id,
        sender_type="admin",
        sender_id=sender_id,
        sender_name=sender_name,
        message_type=data.message_type,
        subject=data.subject,
        content=data.content,
        attachment_ids=json.dumps(data.attachment_ids) if data.attachment_ids else None,
        parent_id=data.parent_id,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message_to_response(message)


@router.get("/threads", response_model=ThreadListResponse)
async def list_threads(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List all message threads (grouped by company).
    Each thread shows the last message and unread count.
    """
    # Get all companies with messages
    query = select(Company.id, Company.name).join(
        Message, Company.id == Message.company_id
    ).distinct()

    if company_id:
        query = query.where(Company.id == company_id)

    companies = db.execute(query).fetchall()

    threads = []
    for company in companies:
        # Get message count
        msg_count = db.execute(
            select(func.count(Message.id))
            .where(Message.company_id == company.id)
        ).scalar() or 0

        # Get unread count (messages from clients that admin hasn't read)
        unread_count = db.execute(
            select(func.count(Message.id))
            .where(
                Message.company_id == company.id,
                Message.sender_type == "client",
                Message.is_read == False
            )
        ).scalar() or 0

        # Get last message
        last_msg = db.execute(
            select(Message)
            .where(Message.company_id == company.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        threads.append(ThreadResponse(
            company_id=company.id,
            company_name=company.name,
            project_id=None,
            project_name=None,
            last_message=message_to_response(last_msg) if last_msg else None,
            message_count=msg_count,
            unread_count=unread_count,
        ))

    # Sort by last message date
    threads.sort(key=lambda t: t.last_message.created_at if t.last_message else datetime.min, reverse=True)

    return ThreadListResponse(
        threads=threads,
        total=len(threads)
    )


@router.get("/company/{company_id}", response_model=MessageListResponse)
async def get_company_messages(
    company_id: int,
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all messages for a company, optionally filtered by project"""
    query = select(Message).where(Message.company_id == company_id)

    if project_id:
        query = query.where(Message.project_id == project_id)

    # Only get top-level messages (not replies)
    query = query.where(Message.parent_id == None)
    query = query.order_by(Message.created_at.desc())

    # Count total
    count_query = select(func.count(Message.id)).where(
        Message.company_id == company_id,
        Message.parent_id == None
    )
    if project_id:
        count_query = count_query.where(Message.project_id == project_id)
    total = db.execute(count_query).scalar() or 0

    # Count unread (from clients)
    unread_query = select(func.count(Message.id)).where(
        Message.company_id == company_id,
        Message.sender_type == "client",
        Message.is_read == False
    )
    if project_id:
        unread_query = unread_query.where(Message.project_id == project_id)
    unread_count = db.execute(unread_query).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    messages = db.execute(query.offset(offset).limit(page_size)).scalars().all()

    # Get reply counts for each message
    message_responses = []
    for msg in messages:
        reply_count = db.execute(
            select(func.count(Message.id))
            .where(Message.parent_id == msg.id)
        ).scalar() or 0
        message_responses.append(message_to_response(msg, reply_count))

    return MessageListResponse(
        messages=message_responses,
        total=total,
        unread_count=unread_count
    )


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific message"""
    message = db.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Get reply count
    reply_count = db.execute(
        select(func.count(Message.id))
        .where(Message.parent_id == message_id)
    ).scalar() or 0

    return message_to_response(message, reply_count)


@router.get("/{message_id}/replies", response_model=MessageListResponse)
async def get_message_replies(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Get all replies to a message"""
    # Verify parent exists
    parent = db.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one_or_none()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent message not found")

    replies = db.execute(
        select(Message)
        .where(Message.parent_id == message_id)
        .order_by(Message.created_at.asc())
    ).scalars().all()

    return MessageListResponse(
        messages=[message_to_response(r) for r in replies],
        total=len(replies),
        unread_count=sum(1 for r in replies if not r.is_read and r.sender_type == "client")
    )


@router.patch("/{message_id}/read")
async def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    message = db.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.mark_as_read()
    db.commit()

    return {"success": True}


@router.patch("/company/{company_id}/read-all")
async def mark_all_as_read(
    company_id: int,
    db: Session = Depends(get_db)
):
    """Mark all messages from a company as read"""
    db.execute(
        Message.__table__.update()
        .where(
            Message.company_id == company_id,
            Message.is_read == False
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    db.commit()

    return {"success": True}


# ============================================
# CLIENT ENDPOINTS (for client portal)
# ============================================

@router.post("/client/send", response_model=MessageResponse, status_code=201)
async def send_client_message(
    data: MessageCreate,
    contact_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Send a message from client to admin.
    Used by the client portal.
    """
    # Get contact info
    contact = db.execute(
        select(Contact).where(Contact.id == contact_id)
    ).scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Verify contact belongs to company
    if contact.company_id != data.company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create message
    message = Message(
        company_id=data.company_id,
        project_id=data.project_id,
        sender_type="client",
        sender_id=contact.id,
        sender_name=f"{contact.first_name} {contact.last_name}",
        message_type=data.message_type,
        subject=data.subject,
        content=data.content,
        attachment_ids=json.dumps(data.attachment_ids) if data.attachment_ids else None,
        parent_id=data.parent_id,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message_to_response(message)


@router.get("/client/{company_id}", response_model=MessageListResponse)
async def get_client_messages(
    company_id: int,
    contact_id: int = Query(...),
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get messages for a client.
    Used by the client portal.
    """
    # Verify contact belongs to company
    contact = db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.company_id == company_id
        )
    ).scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=403, detail="Access denied")

    query = select(Message).where(Message.company_id == company_id)

    if project_id:
        query = query.where(Message.project_id == project_id)

    query = query.where(Message.parent_id == None)
    query = query.order_by(Message.created_at.desc())

    # Count total
    count_query = select(func.count(Message.id)).where(
        Message.company_id == company_id,
        Message.parent_id == None
    )
    total = db.execute(count_query).scalar() or 0

    # Count unread (from admin)
    unread_count = db.execute(
        select(func.count(Message.id)).where(
            Message.company_id == company_id,
            Message.sender_type == "admin",
            Message.is_read == False
        )
    ).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    messages = db.execute(query.offset(offset).limit(page_size)).scalars().all()

    return MessageListResponse(
        messages=[message_to_response(m) for m in messages],
        total=total,
        unread_count=unread_count
    )
