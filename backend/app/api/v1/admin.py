"""
Bhumi Prajna - Admin API Routes
Admin-only user management. Not exposed to ordinary officers.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.auth import UserCreate, UserUpdate, UserResponse, UserListResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Admin creates an officer account. No public signup."""
    # Validate role
    try:
        role = UserRole(request.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {[r.value for r in UserRole]}",
        )

    # Validate geographic scope requirements
    if role == UserRole.STATE_OFFICER and not request.state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State officer requires a state assignment",
        )
    if role == UserRole.DISTRICT_OFFICER:
        if not request.state or not request.district:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="District officer requires both state and district assignments",
            )

    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role=role,
        state=request.state if role in (UserRole.STATE_OFFICER, UserRole.DISTRICT_OFFICER) else None,
        district=request.district if role == UserRole.DISTRICT_OFFICER else None,
    )
    db.add(user)
    await db.flush()

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        action="CREATE_USER",
        after_values={"email": user.email, "role": role.value, "state": user.state, "district": user.district},
        details=f"Created user {user.email} with role {role.value}",
    )
    db.add(audit)

    return UserResponse.model_validate(user)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    role: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List all users (admin only)."""
    query = select(User)

    if role:
        query = query.where(User.role == role)
    if state:
        query = query.where(User.state == state)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Fetch
    result = await db.execute(query.order_by(User.created_at.desc()).offset(skip).limit(limit))
    users = result.scalars().all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    request: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update a user's role, scope, or status (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    before = {"full_name": user.full_name, "role": user.role.value, "state": user.state,
              "district": user.district, "is_active": user.is_active}
    changed = {}

    if request.full_name is not None:
        user.full_name = request.full_name
        changed["full_name"] = request.full_name
    if request.role is not None:
        try:
            user.role = UserRole(request.role)
            changed["role"] = request.role
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if request.state is not None:
        user.state = request.state
        changed["state"] = request.state
    if request.district is not None:
        user.district = request.district
        changed["district"] = request.district
    if request.is_active is not None:
        user.is_active = request.is_active
        changed["is_active"] = request.is_active

    if changed:
        audit = AuditLog(
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            action="UPDATE_USER",
            changed_fields=changed,
            before_values=before,
            after_values={**before, **changed},
            details=f"Updated user {user.email}",
        )
        db.add(audit)

    return UserResponse.model_validate(user)
