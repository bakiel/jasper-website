"""
JASPER CRM - Orchestrator Routes

API endpoints for the AgenticBrain orchestrator.
Allows triggering events and testing AI decision-making.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

from orchestrator.events import (
    Event, EventType,
    lead_created_event,
    message_received_event,
    call_scheduled_event,
    content_requested_event,
    research_requested_event
)

router = APIRouter(prefix="/api/v1/orchestrator", tags=["Orchestrator"])


# =============================================================================
# REQUEST MODELS
# =============================================================================

class TriggerEventRequest(BaseModel):
    """Request to trigger an event through the AgenticBrain."""
    event_type: str = Field(..., description="Event type from EventType enum")
    lead_id: Optional[str] = Field(default=None, description="Lead ID if applicable")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Event data payload")


class TestBrainRequest(BaseModel):
    """Request to test the AgenticBrain's decision-making."""
    scenario: str = Field(..., description="Test scenario: new_lead, message_received, call_scheduled, content_request")
    mock_data: Optional[Dict[str, Any]] = Field(default=None, description="Mock data for the scenario")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/event")
async def trigger_event(request: TriggerEventRequest, req: Request):
    """
    Trigger an event through the AgenticBrain.

    The AgenticBrain (DeepSeek V3.2) will decide which tools to call
    based on the event type and context.

    Example:
        POST /api/v1/orchestrator/event
        {
            "event_type": "lead_created",
            "lead_id": "LEAD-12345",
            "data": {"source": "website"}
        }
    """
    # Get the AgenticBrain from app state
    brain = getattr(req.app.state, 'agentic_brain', None)
    if not brain:
        raise HTTPException(
            status_code=503,
            detail="AgenticBrain not initialized"
        )

    # Validate event type
    try:
        event_type = EventType(request.event_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event type: {request.event_type}. Valid types: {[e.value for e in EventType]}"
        )

    # Create event
    event = Event(
        type=event_type,
        lead_id=request.lead_id,
        data=request.data or {},
        source="api"
    )

    # Process through AgenticBrain
    try:
        result = await brain.handle_event(event)
        return {
            "success": result.get("handled", False),
            "event_id": event.id,
            "event_type": event.type,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_brain(request: TestBrainRequest, req: Request):
    """
    Test the AgenticBrain with predefined scenarios.

    This endpoint creates mock events and shows what tools
    the AI would call without executing them.

    Scenarios:
    - new_lead: Simulates a new lead creation
    - message_received: Simulates an inbound message
    - call_scheduled: Simulates a call being scheduled
    - content_request: Simulates a content generation request
    """
    brain = getattr(req.app.state, 'agentic_brain', None)
    if not brain:
        raise HTTPException(
            status_code=503,
            detail="AgenticBrain not initialized"
        )

    mock_data = request.mock_data or {}

    # Create scenario-specific events
    scenarios = {
        "new_lead": lead_created_event(
            lead_id=mock_data.get("lead_id", "TEST-LEAD-001"),
            source=mock_data.get("source", "website"),
            data={
                "name": mock_data.get("name", "Test Company"),
                "sector": mock_data.get("sector", "infrastructure"),
                "funding_stage": mock_data.get("funding_stage", "growth"),
            }
        ),
        "message_received": message_received_event(
            lead_id=mock_data.get("lead_id", "TEST-LEAD-001"),
            channel=mock_data.get("channel", "whatsapp"),
            content=mock_data.get("content", "I'd like to schedule a call to discuss IDC funding"),
            from_address=mock_data.get("from_address", "+27123456789")
        ),
        "call_scheduled": call_scheduled_event(
            lead_id=mock_data.get("lead_id", "TEST-LEAD-001"),
            scheduled_at=datetime.utcnow(),
            meeting_type=mock_data.get("meeting_type", "discovery")
        ),
        "content_request": content_requested_event(
            topic=mock_data.get("topic", "How to Apply for IDC Funding"),
            category=mock_data.get("category", "dfi-insights"),
            seo_keywords=mock_data.get("seo_keywords", ["IDC funding", "development finance"]),
            publish_immediately=mock_data.get("publish_immediately", False)
        ),
        "research_request": research_requested_event(
            lead_id=mock_data.get("lead_id", "TEST-LEAD-001"),
            mode=mock_data.get("mode", "deep")
        )
    }

    if request.scenario not in scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: {request.scenario}. Valid: {list(scenarios.keys())}"
        )

    event = scenarios[request.scenario]

    # Process through AgenticBrain
    try:
        result = await brain.handle_event(event)
        return {
            "scenario": request.scenario,
            "event_id": event.id,
            "event_type": event.type,
            "event_data": event.data,
            "brain_response": result,
            "tools_called": result.get("tools_called", 0),
            "results": result.get("results", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_brain_status(req: Request):
    """
    Get the status of the AgenticBrain.

    Returns information about the orchestrator's configuration
    and available tools.
    """
    brain = getattr(req.app.state, 'agentic_brain', None)

    if not brain:
        return {
            "status": "not_initialized",
            "message": "AgenticBrain not initialized"
        }

    return {
        "status": "ready",
        "model": brain.model,
        "available_tools": list(brain._tool_executors.keys()),
        "tool_count": len(brain._tool_executors),
        "services_configured": {
            "research_agent": brain.research is not None,
            "comms_agent": brain.comms is not None,
            "call_coach": brain.call_coach is not None,
            "lead_service": brain.leads is not None,
            "aleph_client": brain.aleph is not None,
            "notifier": brain.notifier is not None,
            "scoring_service": brain.scoring is not None,
            "blog_service": brain.blog is not None,
        }
    }


@router.get("/tools")
async def get_available_tools(req: Request):
    """
    Get detailed information about available tools.

    Returns the function schemas that DeepSeek V3.2 uses
    for tool/function calling.
    """
    from orchestrator.agentic_brain import JASPER_TOOLS

    return {
        "tool_count": len(JASPER_TOOLS),
        "tools": [
            {
                "name": tool["function"]["name"],
                "description": tool["function"]["description"],
                "parameters": tool["function"]["parameters"]
            }
            for tool in JASPER_TOOLS
        ]
    }


@router.get("/event-types")
async def get_event_types():
    """
    Get all available event types.

    Returns the EventType enum values that can be triggered
    through the orchestrator.
    """
    return {
        "event_types": [
            {
                "value": e.value,
                "name": e.name
            }
            for e in EventType
        ]
    }
