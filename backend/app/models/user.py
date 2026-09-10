"""
Pravaah - User & RBAC Database Models
Roles: ADMIN, CENTRAL_OFFICER, STATE_OFFICER, DISTRICT_OFFICER
Geographic scope enforcement is built into the user model.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum, Text
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class UserRole(str, PyEnum):
    ADMIN = "ADMIN"
    CENTRAL_OFFICER = "CENTRAL_OFFICER"
    STATE_OFFICER = "STATE_OFFICER"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role_enum"), nullable=False)

    # Geographic scope — enforced on backend
    state = Column(String(100), nullable=True)  # NULL for Admin/Central
    district = Column(String(100), nullable=True)  # NULL for Admin/Central/State

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"

    def has_access_to_state(self, state: str) -> bool:
        """Check if user has access to a given state."""
        if self.role in (UserRole.ADMIN, UserRole.CENTRAL_OFFICER):
            return True
        return self.state == state

    def has_access_to_district(self, state: str, district: str) -> bool:
        """Check if user has access to a given district."""
        if self.role in (UserRole.ADMIN, UserRole.CENTRAL_OFFICER):
            return True
        if self.role == UserRole.STATE_OFFICER:
            return self.state == state
        return self.state == state and self.district == district
