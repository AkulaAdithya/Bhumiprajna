"""
Pravaah - Stage Definitions Model
Configurable acquisition stage sequence — not hardcoded as a universal legal workflow.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


# Default prototype stages per PRD §7
DEFAULT_STAGES = [
    {"name": "Initial Assessment / SIA", "order": 1, "description": "Social Impact Assessment and initial project evaluation"},
    {"name": "Notification", "order": 2, "description": "Public notification under applicable land acquisition law"},
    {"name": "Objection / Hearing", "order": 3, "description": "Hearing objections from affected parties"},
    {"name": "Land & Ownership Verification", "order": 4, "description": "Verification of land records and ownership"},
    {"name": "Award / Valuation", "order": 5, "description": "Land valuation and award determination"},
    {"name": "Compensation Disbursement", "order": 6, "description": "Disbursement of compensation to beneficiaries"},
    {"name": "Rehabilitation & Resettlement", "order": 7, "description": "R&R of affected families"},
    {"name": "Possession", "order": 8, "description": "Taking possession of acquired land"},
    {"name": "Acquisition Completion", "order": 9, "description": "Final completion of acquisition process"},
]


class StageDefinition(Base):
    __tablename__ = "stage_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    stage_order = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
