"""
Pravaah - Audit Log Model
Append-oriented audit records for traceability.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    actor_email = Column(String(255), nullable=False)
    project_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    changed_fields = Column(JSONB, nullable=True)
    before_values = Column(JSONB, nullable=True)
    after_values = Column(JSONB, nullable=True)
    source = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
