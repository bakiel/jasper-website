"""
JASPER CRM - Lead Service
Centralized lead management service for AgenticBrain integration.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class LeadService:
    """
    Centralized service for lead operations.
    Provides a clean interface for AgenticBrain and other services.

    Returns Lead Pydantic models that AgenticBrain expects.
    """

    def __init__(self):
        logger.info("LeadService initialized")

    async def get(self, lead_id: str) -> Optional[Any]:
        """
        Get a lead by ID. Returns Lead Pydantic model.
        (AgenticBrain calls this as leads.get())
        """
        from db.database import SessionLocal
        from db.tables import LeadTable
        from models.lead import Lead

        db = SessionLocal()
        try:
            lead_row = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
            if lead_row:
                # Convert database row to Lead model
                return self._row_to_model(lead_row)
            return None
        except Exception as e:
            logger.error(f"Error getting lead {lead_id}: {e}")
            return None
        finally:
            db.close()

    async def update(self, lead_id: str, updates: Any) -> Optional[Any]:
        """
        Update a lead with new data.
        Accepts either dict or Lead model.
        (AgenticBrain calls this as leads.update())
        """
        from db.database import SessionLocal
        from db.tables import LeadTable
        from models.lead import Lead

        db = SessionLocal()
        try:
            lead_row = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
            if not lead_row:
                return None

            # Handle both dict and model inputs
            if hasattr(updates, 'dict'):
                update_dict = updates.dict(exclude_unset=True)
            elif isinstance(updates, dict):
                update_dict = updates
            else:
                update_dict = {}

            # Apply updates to database row
            for key, value in update_dict.items():
                if hasattr(lead_row, key) and value is not None:
                    # Handle enum values
                    if hasattr(value, 'value'):
                        value = value.value
                    setattr(lead_row, key, value)

            lead_row.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(lead_row)
            logger.info(f"Updated lead {lead_id}")
            return self._row_to_model(lead_row)
        except Exception as e:
            logger.error(f"Error updating lead {lead_id}: {e}")
            db.rollback()
            return None
        finally:
            db.close()

    def _row_to_model(self, row) -> Any:
        """Convert database row to Lead Pydantic model."""
        from models.lead import Lead, LeadStatus, LeadSource, LeadPriority, LeadTier, ResearchStatus

        try:
            # Build the Lead model from the database row
            lead_data = {
                "id": str(row.id),
                "name": row.name or "",
                "email": row.email or "",
                "company": row.company or "",
                "phone": row.phone or "",
                "sector": row.sector or "other",
                "funding_stage": row.funding_stage or "unknown",
                "funding_amount": row.funding_amount or "",
                "message": row.message or "",
                "notes": row.notes or "",
                "qualification_score": row.qualification_score or 5,
                "created_at": row.created_at or datetime.utcnow(),
                "updated_at": row.updated_at or datetime.utcnow(),
            }

            # Handle status enum
            try:
                lead_data["status"] = LeadStatus(row.status) if row.status else LeadStatus.NEW
            except:
                lead_data["status"] = LeadStatus.NEW

            # Handle source enum
            try:
                lead_data["source"] = LeadSource(row.source) if row.source else LeadSource.WEBSITE
            except:
                lead_data["source"] = LeadSource.WEBSITE

            # Handle priority enum
            try:
                lead_data["priority"] = LeadPriority(row.priority) if row.priority else LeadPriority.MEDIUM
            except:
                lead_data["priority"] = LeadPriority.MEDIUM

            # Set defaults for AI fields (not in database yet)
            lead_data["tier"] = LeadTier.COLD
            lead_data["research_status"] = ResearchStatus.NONE
            lead_data["score"] = 0

            return Lead(**lead_data)

        except Exception as e:
            logger.error(f"Error converting row to Lead model: {e}")
            # Return a minimal Lead model
            from models.lead import Lead
            return Lead(
                id=str(row.id),
                name=row.name or "Unknown",
                email=row.email or "",
            )

    async def update_status(self, lead_id: str, status: str, tier: str = None, notes: str = None) -> Dict[str, Any]:
        """Update lead status and tier."""
        updates = {}
        if status:
            updates["status"] = status
        if tier:
            updates["tier"] = tier
        if notes:
            lead = await self.get(lead_id)
            if lead:
                existing_notes = lead.notes or ""
                updates["notes"] = f"{existing_notes}\n\n[{datetime.utcnow().isoformat()}] {notes}"

        result = await self.update(lead_id, updates)
        return {"success": result is not None, "lead": result}

    async def get_context(self, lead_id: str) -> Dict[str, Any]:
        """Get full context for a lead including interactions."""
        lead = await self.get(lead_id)
        if not lead:
            return {"success": False, "error": "Lead not found"}

        return {
            "success": True,
            "lead": lead,
            "context": {
                "days_since_created": (datetime.utcnow() - lead.created_at).days if lead.created_at else 0,
                "engagement_level": self._calculate_engagement(lead),
                "recommended_actions": self._get_recommended_actions(lead)
            }
        }

    async def schedule_followup(self, lead_id: str, action: str, days_from_now: int) -> Dict[str, Any]:
        """Schedule a follow-up for a lead."""
        from datetime import timedelta

        followup_date = datetime.utcnow() + timedelta(days=days_from_now)
        note = f"FOLLOW-UP SCHEDULED: {action} on {followup_date.strftime('%Y-%m-%d')}"

        result = await self.update_status(lead_id, None, None, note)
        return {
            "success": True,
            "followup_date": followup_date.isoformat(),
            "action": action
        }

    def _calculate_engagement(self, lead) -> str:
        """Calculate engagement level based on activity."""
        score = getattr(lead, 'qualification_score', 0) or 0
        if score >= 8:
            return "high"
        elif score >= 5:
            return "medium"
        return "low"

    def _get_recommended_actions(self, lead) -> List[str]:
        """Get recommended actions based on lead state."""
        actions = []
        status = getattr(lead, 'status', None)
        status_value = status.value if hasattr(status, 'value') else str(status)

        if status_value == "new":
            actions.append("Send initial outreach")
            actions.append("Research company background")
        elif status_value == "contacted":
            actions.append("Schedule discovery call")
            actions.append("Send relevant case studies")
        elif status_value == "qualified":
            actions.append("Prepare proposal")
            actions.append("Demo JASPER financial model")

        return actions


# Singleton instance
lead_service = LeadService()
