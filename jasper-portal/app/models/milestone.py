"""
JASPER CRM - Milestone Model
Project milestones and deliverables tracking
"""

from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project


# Default milestones per package
DEFAULT_MILESTONES = {
    "growth": [
        {"name": "Kick-off Call", "order": 1, "days_offset": 0},
        {"name": "Data Collection Complete", "order": 2, "days_offset": 7},
        {"name": "Financial Model Draft", "order": 3, "days_offset": 21},
        {"name": "Client Review", "order": 4, "days_offset": 28},
        {"name": "Final Delivery", "order": 5, "days_offset": 35},
    ],
    "institutional": [
        {"name": "Kick-off Call", "order": 1, "days_offset": 0},
        {"name": "Data Collection Complete", "order": 2, "days_offset": 10},
        {"name": "Preliminary Analysis", "order": 3, "days_offset": 21},
        {"name": "Financial Model Draft", "order": 4, "days_offset": 35},
        {"name": "Client Review Round 1", "order": 5, "days_offset": 42},
        {"name": "Revisions Complete", "order": 6, "days_offset": 49},
        {"name": "Final Delivery", "order": 7, "days_offset": 56},
    ],
    "infrastructure": [
        {"name": "Kick-off Call", "order": 1, "days_offset": 0},
        {"name": "Data Collection Complete", "order": 2, "days_offset": 14},
        {"name": "Technical Analysis", "order": 3, "days_offset": 28},
        {"name": "Preliminary Financial Model", "order": 4, "days_offset": 42},
        {"name": "DFI Alignment Review", "order": 5, "days_offset": 56},
        {"name": "Client Review Round 1", "order": 6, "days_offset": 63},
        {"name": "Client Review Round 2", "order": 7, "days_offset": 70},
        {"name": "Final Model & Documentation", "order": 8, "days_offset": 77},
        {"name": "Final Delivery", "order": 9, "days_offset": 84},
    ],
}


class Milestone(Base):
    """
    Project milestone tracking.
    Each project has milestones based on package type.
    """
    __tablename__ = "milestones"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Milestone details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order: Mapped[int] = mapped_column(
        Integer,
        default=1,
        comment="Order in milestone sequence"
    )

    # Dates
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_date: Mapped[Optional[date]] = mapped_column(Date)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="milestones"
    )

    def __repr__(self):
        status = "done" if self.completed else "pending"
        return f"<Milestone(id={self.id}, name='{self.name}', status='{status}')>"

    @property
    def is_overdue(self) -> bool:
        """Check if milestone is overdue"""
        if self.completed or not self.due_date:
            return False
        return date.today() > self.due_date

    @property
    def days_until_due(self) -> Optional[int]:
        """Days until due date (negative if overdue)"""
        if not self.due_date:
            return None
        return (self.due_date - date.today()).days

    def mark_complete(self, completion_date: date = None):
        """Mark milestone as complete"""
        self.completed = True
        self.completed_date = completion_date or date.today()

    @classmethod
    def create_default_milestones(
        cls,
        project_id: int,
        package: str,
        start_date: date = None
    ) -> list["Milestone"]:
        """Create default milestones for a package type"""
        from datetime import timedelta

        start = start_date or date.today()
        templates = DEFAULT_MILESTONES.get(package, DEFAULT_MILESTONES["growth"])

        milestones = []
        for template in templates:
            milestone = cls(
                project_id=project_id,
                name=template["name"],
                order=template["order"],
                due_date=start + timedelta(days=template["days_offset"])
            )
            milestones.append(milestone)

        return milestones
