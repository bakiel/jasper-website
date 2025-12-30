"""
JASPER CRM - Email Sequence Scheduler
Manages sequence triggers, scheduling, and execution
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from db.database import get_db
from db.tables import (
    LeadTable,
    EmailSequenceTable,
    EmailStepTable,
    SequenceTemplateTable,
    SequenceStepTemplateTable,
)
from models.email_sequence import (
    SequenceType,
    SequenceStatus,
    EmailStatus,
    TriggerType,
    EmailSequence,
    EmailStep,
    SequenceTemplate,
    EmailStepTemplate,
    DEFAULT_SEQUENCES,
)
from models.lead import LeadStatus
from services.email_generator import email_generator
from services.aleph_client import aleph


class SequenceScheduler:
    """Manages email sequence triggers, scheduling, and execution"""

    def __init__(self):
        self.running = False
        self._task = None

    async def start_sequence(
        self,
        db: Session,
        lead_id: str,
        template_id: Optional[str] = None,
        sequence_type: Optional[SequenceType] = None,
        custom_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Start an email sequence for a lead.

        Args:
            db: Database session
            lead_id: The lead ID
            template_id: Optional specific template ID
            sequence_type: Optional sequence type (if no template_id)
            custom_context: Additional context for personalization

        Returns:
            Dict with sequence details or error
        """
        # Get lead
        lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
        if not lead:
            return {"success": False, "error": "Lead not found"}

        # Check for existing active sequence
        existing = db.query(EmailSequenceTable).filter(
            and_(
                EmailSequenceTable.lead_id == lead_id,
                EmailSequenceTable.status == SequenceStatus.ACTIVE,
            )
        ).first()

        if existing:
            return {
                "success": False,
                "error": "Lead already has an active sequence",
                "existing_sequence_id": existing.id,
            }

        # Get template
        template = None
        if template_id:
            template_row = db.query(SequenceTemplateTable).filter(
                SequenceTemplateTable.id == template_id
            ).first()
            if template_row:
                # Build template from DB
                steps = db.query(SequenceStepTemplateTable).filter(
                    SequenceStepTemplateTable.template_id == template_id
                ).order_by(SequenceStepTemplateTable.step_number).all()

                template = {
                    "id": template_row.id,
                    "name": template_row.name,
                    "sequence_type": template_row.sequence_type,
                    "steps": [
                        EmailStepTemplate(
                            step_number=s.step_number,
                            delay_days=s.delay_days,
                            delay_hours=s.delay_hours,
                            subject_template=s.subject_template,
                            body_template=s.body_template,
                            use_ai_personalization=s.use_ai_personalization,
                            ai_tone=s.ai_tone,
                            ai_context_prompt=s.ai_context_prompt,
                            send_time_preference=s.send_time_preference,
                        )
                        for s in steps
                    ]
                }
        elif sequence_type:
            # Use default template
            default = DEFAULT_SEQUENCES.get(sequence_type)
            if default:
                template = {
                    "id": default.id,
                    "name": default.name,
                    "sequence_type": default.sequence_type,
                    "steps": default.steps,
                }

        if not template:
            return {"success": False, "error": "Template not found"}

        # Build lead context
        lead_context = {
            "name": lead.name,
            "email": lead.email,
            "company": lead.company,
            "sector": lead.sector.value if lead.sector else "general",
            "funding_stage": lead.funding_stage.value if lead.funding_stage else "growth",
            "funding_amount": lead.funding_amount or "undisclosed",
            "source": lead.source.value if lead.source else "website",
            "message": lead.message or "",
        }
        if custom_context:
            lead_context.update(custom_context)

        # Create sequence
        sequence_id = f"SEQ-{uuid.uuid4().hex[:8].upper()}"
        sequence = EmailSequenceTable(
            id=sequence_id,
            lead_id=lead_id,
            lead_email=lead.email,
            lead_name=lead.name,
            company=lead.company,
            template_id=template["id"],
            template_name=template["name"],
            sequence_type=template["sequence_type"],
            status=SequenceStatus.ACTIVE,
            current_step=0,
            total_steps=len(template["steps"]),
            lead_context=lead_context,
        )
        db.add(sequence)

        # Create email steps
        now = datetime.utcnow()
        for step_template in template["steps"]:
            step_id = f"STEP-{uuid.uuid4().hex[:8].upper()}"

            # Calculate scheduled time
            if step_template.step_number == 1:
                scheduled_at = now + timedelta(hours=step_template.delay_hours)
            else:
                # Find previous step's scheduled time
                delay = timedelta(
                    days=step_template.delay_days,
                    hours=step_template.delay_hours,
                )
                scheduled_at = now + delay  # Will be recalculated based on previous step

            step = EmailStepTable(
                id=step_id,
                sequence_id=sequence_id,
                lead_id=lead_id,
                step_number=step_template.step_number,
                delay_days=step_template.delay_days,
                delay_hours=step_template.delay_hours,
                subject_template=step_template.subject_template,
                body_template=step_template.body_template,
                use_ai_personalization=step_template.use_ai_personalization,
                ai_tone=step_template.ai_tone,
                ai_context_prompt=step_template.ai_context_prompt,
                send_time_preference=step_template.send_time_preference,
                status=EmailStatus.SCHEDULED if step_template.step_number == 1 else EmailStatus.PENDING,
                scheduled_at=scheduled_at if step_template.step_number == 1 else None,
            )
            db.add(step)

        db.commit()

        return {
            "success": True,
            "sequence_id": sequence_id,
            "template_name": template["name"],
            "total_steps": len(template["steps"]),
            "first_email_scheduled": now + timedelta(hours=template["steps"][0].delay_hours),
        }

    async def pause_sequence(self, db: Session, sequence_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Pause an active sequence"""
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()

        if not sequence:
            return {"success": False, "error": "Sequence not found"}

        if sequence.status != SequenceStatus.ACTIVE:
            return {"success": False, "error": f"Sequence is not active (status: {sequence.status})"}

        sequence.status = SequenceStatus.PAUSED
        sequence.paused_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": f"Sequence {sequence_id} paused",
            "reason": reason,
        }

    async def resume_sequence(self, db: Session, sequence_id: str) -> Dict[str, Any]:
        """Resume a paused sequence"""
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()

        if not sequence:
            return {"success": False, "error": "Sequence not found"}

        if sequence.status != SequenceStatus.PAUSED:
            return {"success": False, "error": f"Sequence is not paused (status: {sequence.status})"}

        sequence.status = SequenceStatus.ACTIVE
        sequence.paused_at = None

        # Reschedule next pending step
        next_step = db.query(EmailStepTable).filter(
            and_(
                EmailStepTable.sequence_id == sequence_id,
                EmailStepTable.status == EmailStatus.PENDING,
            )
        ).order_by(EmailStepTable.step_number).first()

        if next_step:
            next_step.status = EmailStatus.SCHEDULED
            next_step.scheduled_at = datetime.utcnow() + timedelta(hours=1)  # Schedule for 1 hour from now

        db.commit()

        return {
            "success": True,
            "message": f"Sequence {sequence_id} resumed",
            "next_step": next_step.step_number if next_step else None,
        }

    async def cancel_sequence(self, db: Session, sequence_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Cancel a sequence entirely"""
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()

        if not sequence:
            return {"success": False, "error": "Sequence not found"}

        if sequence.status in [SequenceStatus.COMPLETED, SequenceStatus.CANCELLED]:
            return {"success": False, "error": f"Sequence already {sequence.status}"}

        sequence.status = SequenceStatus.CANCELLED
        sequence.completed_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": f"Sequence {sequence_id} cancelled",
            "reason": reason,
        }

    async def mark_replied(self, db: Session, sequence_id: str) -> Dict[str, Any]:
        """Mark sequence as replied (auto-pause)"""
        sequence = db.query(EmailSequenceTable).filter(
            EmailSequenceTable.id == sequence_id
        ).first()

        if not sequence:
            return {"success": False, "error": "Sequence not found"}

        sequence.status = SequenceStatus.REPLIED
        sequence.replied = True
        sequence.completed_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": f"Sequence {sequence_id} marked as replied",
        }

    async def process_scheduled_emails(self, db: Session) -> Dict[str, Any]:
        """
        Process all emails that are due to be sent.
        This should be called periodically by a background task.
        """
        now = datetime.utcnow()

        # Get all scheduled emails that are due
        due_emails = db.query(EmailStepTable).filter(
            and_(
                EmailStepTable.status == EmailStatus.SCHEDULED,
                EmailStepTable.scheduled_at <= now,
            )
        ).all()

        results = {
            "processed": 0,
            "sent": 0,
            "failed": 0,
            "errors": [],
        }

        for step in due_emails:
            results["processed"] += 1

            # Get sequence to check if still active
            sequence = db.query(EmailSequenceTable).filter(
                EmailSequenceTable.id == step.sequence_id
            ).first()

            if not sequence or sequence.status != SequenceStatus.ACTIVE:
                continue

            # Generate AI-personalized email if enabled
            if step.use_ai_personalization:
                step_template = EmailStepTemplate(
                    step_number=step.step_number,
                    delay_days=step.delay_days,
                    delay_hours=step.delay_hours,
                    subject_template=step.subject_template,
                    body_template=step.body_template,
                    use_ai_personalization=True,
                    ai_tone=step.ai_tone,
                    ai_context_prompt=step.ai_context_prompt,
                )

                email_result = await email_generator.generate_email(
                    step_template,
                    sequence.lead_context,
                )

                if email_result.get("success"):
                    step.ai_generated_subject = email_result["subject"]
                    step.ai_generated_body = email_result["body"]
                else:
                    # Use template fallback
                    step.ai_generated_subject = step.subject_template
                    step.ai_generated_body = step.body_template
                    step.error_message = f"AI generation failed: {email_result.get('error')}"
            else:
                # Use template directly with simple replacements
                step.ai_generated_subject = email_generator._simple_replace(
                    step.subject_template, sequence.lead_context
                )
                step.ai_generated_body = email_generator._simple_replace(
                    step.body_template, sequence.lead_context
                )

            # Mark as sent (actual email sending would happen here)
            # In production, integrate with email service (SendGrid, Postmark, etc.)
            step.status = EmailStatus.SENT
            step.sent_at = now
            step.message_id = f"MSG-{uuid.uuid4().hex[:12]}"

            # Update sequence
            sequence.emails_sent += 1
            sequence.last_email_sent_at = now
            sequence.current_step = step.step_number

            # Schedule next step
            next_step = db.query(EmailStepTable).filter(
                and_(
                    EmailStepTable.sequence_id == sequence.id,
                    EmailStepTable.step_number == step.step_number + 1,
                )
            ).first()

            if next_step:
                next_step.status = EmailStatus.SCHEDULED
                next_step.scheduled_at = now + timedelta(
                    days=next_step.delay_days,
                    hours=next_step.delay_hours,
                )
            else:
                # No more steps, mark sequence complete
                sequence.status = SequenceStatus.COMPLETED
                sequence.completed_at = now

            results["sent"] += 1

        db.commit()
        return results

    async def get_sequence_stats(self, db: Session, sequence_id: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics for sequences"""
        query = db.query(EmailSequenceTable)

        if sequence_id:
            sequence = query.filter(EmailSequenceTable.id == sequence_id).first()
            if not sequence:
                return {"success": False, "error": "Sequence not found"}

            # Get steps
            steps = db.query(EmailStepTable).filter(
                EmailStepTable.sequence_id == sequence_id
            ).all()

            return {
                "success": True,
                "sequence_id": sequence_id,
                "status": sequence.status.value,
                "emails_sent": sequence.emails_sent,
                "emails_opened": sequence.emails_opened,
                "emails_clicked": sequence.emails_clicked,
                "replied": sequence.replied,
                "open_rate": sequence.emails_opened / sequence.emails_sent if sequence.emails_sent > 0 else 0,
                "click_rate": sequence.emails_clicked / sequence.emails_sent if sequence.emails_sent > 0 else 0,
                "steps": [
                    {
                        "step_number": s.step_number,
                        "status": s.status.value,
                        "scheduled_at": s.scheduled_at.isoformat() if s.scheduled_at else None,
                        "sent_at": s.sent_at.isoformat() if s.sent_at else None,
                        "opened_at": s.opened_at.isoformat() if s.opened_at else None,
                    }
                    for s in steps
                ],
            }
        else:
            # Overall stats
            total = query.count()
            active = query.filter(EmailSequenceTable.status == SequenceStatus.ACTIVE).count()
            completed = query.filter(EmailSequenceTable.status == SequenceStatus.COMPLETED).count()
            replied = query.filter(EmailSequenceTable.replied == True).count()

            # Email stats
            all_sequences = query.all()
            total_sent = sum(s.emails_sent for s in all_sequences)
            total_opened = sum(s.emails_opened for s in all_sequences)
            total_clicked = sum(s.emails_clicked for s in all_sequences)

            return {
                "success": True,
                "total_sequences": total,
                "active_sequences": active,
                "completed_sequences": completed,
                "replied_sequences": replied,
                "reply_rate": replied / completed if completed > 0 else 0,
                "total_emails_sent": total_sent,
                "total_opens": total_opened,
                "total_clicks": total_clicked,
                "overall_open_rate": total_opened / total_sent if total_sent > 0 else 0,
                "overall_click_rate": total_clicked / total_sent if total_sent > 0 else 0,
            }

    async def trigger_on_lead_created(self, db: Session, lead_id: str) -> Dict[str, Any]:
        """Auto-trigger welcome sequence when a new lead is created"""
        lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
        if not lead:
            return {"success": False, "error": "Lead not found"}

        # Embed lead in Milvus for semantic search (async, non-blocking)
        try:
            lead_context = {
                "company": lead.company,
                "sector": lead.sector.value if lead.sector else "",
                "funding_stage": lead.funding_stage.value if lead.funding_stage else "",
                "funding_amount": lead.funding_amount or "",
                "message": lead.message or "",
                "source": lead.source.value if lead.source else "",
                "status": lead.status.value if lead.status else "new",
            }
            await email_generator.embed_lead_for_search(lead_id, lead_context)
        except Exception as e:
            print(f"[SequenceScheduler] Lead embedding failed (non-critical): {e}")

        # Check if source qualifies for welcome sequence
        if lead.source and lead.source.value in ["website", "linkedin"]:
            return await self.start_sequence(
                db,
                lead_id,
                sequence_type=SequenceType.WELCOME,
            )

        return {"success": False, "message": "Lead source doesn't qualify for auto-sequence"}

    async def trigger_on_status_change(
        self,
        db: Session,
        lead_id: str,
        old_status: LeadStatus,
        new_status: LeadStatus,
    ) -> Dict[str, Any]:
        """Trigger sequences based on lead status changes"""
        # Update lead embedding with new status (important for finding similar won/lost leads)
        lead = db.query(LeadTable).filter(LeadTable.id == lead_id).first()
        if lead:
            try:
                lead_context = {
                    "company": lead.company,
                    "sector": lead.sector.value if lead.sector else "",
                    "funding_stage": lead.funding_stage.value if lead.funding_stage else "",
                    "funding_amount": lead.funding_amount or "",
                    "message": lead.message or "",
                    "source": lead.source.value if lead.source else "",
                    "status": new_status.value,  # Updated status
                }
                await email_generator.embed_lead_for_search(lead_id, lead_context)
            except Exception as e:
                print(f"[SequenceScheduler] Lead re-embedding failed (non-critical): {e}")

        # Proposal sent -> start proposal follow-up
        if new_status == LeadStatus.PROPOSAL_SENT:
            return await self.start_sequence(
                db,
                lead_id,
                sequence_type=SequenceType.PROPOSAL_FOLLOWUP,
            )

        # Won -> start post-win sequence
        if new_status == LeadStatus.WON:
            # Cancel any active sequences first
            active = db.query(EmailSequenceTable).filter(
                and_(
                    EmailSequenceTable.lead_id == lead_id,
                    EmailSequenceTable.status == SequenceStatus.ACTIVE,
                )
            ).all()
            for seq in active:
                seq.status = SequenceStatus.CANCELLED

            return await self.start_sequence(
                db,
                lead_id,
                sequence_type=SequenceType.POST_WIN,
            )

        # Lost -> start re-engagement sequence (delayed)
        if new_status == LeadStatus.LOST:
            # Cancel active sequences
            active = db.query(EmailSequenceTable).filter(
                and_(
                    EmailSequenceTable.lead_id == lead_id,
                    EmailSequenceTable.status == SequenceStatus.ACTIVE,
                )
            ).all()
            for seq in active:
                seq.status = SequenceStatus.CANCELLED

            return await self.start_sequence(
                db,
                lead_id,
                sequence_type=SequenceType.POST_LOSS,
            )

        return {"success": False, "message": "Status change doesn't trigger a sequence"}

    async def run_scheduler_loop(self, interval_seconds: int = 60):
        """
        Background loop that processes scheduled emails.
        Should be started as an asyncio task.
        """
        self.running = True
        print("[SequenceScheduler] Starting email scheduler loop...")

        while self.running:
            try:
                # Get a fresh DB session
                db = next(get_db())
                try:
                    result = await self.process_scheduled_emails(db)
                    if result["sent"] > 0:
                        print(f"[SequenceScheduler] Sent {result['sent']} emails")
                finally:
                    db.close()

            except Exception as e:
                print(f"[SequenceScheduler] Error in scheduler loop: {e}")

            await asyncio.sleep(interval_seconds)

    def start_background_scheduler(self, interval_seconds: int = 60):
        """Start the scheduler as a background task"""
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self.run_scheduler_loop(interval_seconds))
            return True
        return False

    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self._task:
            self._task.cancel()


# Singleton instance
sequence_scheduler = SequenceScheduler()
