"""
Bhūmi Prājñā - Pydantic Schemas for Auth & Users
Request/response validation models.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---

class LoginRequest(BaseModel):
    email: str = Field(..., description="Officer email or ID")
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# --- User Schemas ---

class UserCreate(BaseModel):
    email: str = Field(..., description="Officer email")
    password: str = Field(..., min_length=8, description="Must be at least 8 characters")
    full_name: str = Field(..., min_length=2)
    role: str = Field(..., description="ADMIN, CENTRAL_OFFICER, STATE_OFFICER, DISTRICT_OFFICER")
    state: Optional[str] = Field(None, description="Required for State/District officers")
    district: Optional[str] = Field(None, description="Required for District officers")


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    state: Optional[str]
    district: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


# Update forward reference
TokenResponse.model_rebuild()
