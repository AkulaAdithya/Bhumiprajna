"""
Bhumi Prajna - Authentication & Authorization Dependencies
JWT extraction, user resolution, and RBAC enforcement.
Backend-enforced — frontend hiding alone is not security.
"""

from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT token."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def require_roles(*roles):
    """
    Dependency factory: require the current user to have one of the specified roles.
    Accepts UserRole enum members OR plain strings (e.g. "ADMIN").
    Also accepts a single list as the first arg (legacy call style).
    """
    # Normalise: if caller passed a single list, unpack it
    if len(roles) == 1 and isinstance(roles[0], list):
        roles = roles[0]
    # Convert any enum values to strings for comparison
    role_strings = [r.value if hasattr(r, 'value') else str(r) for r in roles]

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role not in role_strings:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {role_strings}",
            )
        return current_user
    return role_checker


def require_admin():
    """Shortcut: require ADMIN role."""
    return require_roles(UserRole.ADMIN)


def require_any_officer():
    """Shortcut: require any officer role (not admin-only endpoints)."""
    return require_roles(
        UserRole.ADMIN,
        UserRole.CENTRAL_OFFICER,
        UserRole.STATE_OFFICER,
        UserRole.DISTRICT_OFFICER,
    )


def enforce_geographic_scope(user: User, state: Optional[str], district: Optional[str]) -> None:
    """
    Enforce geographic scope on a resource.
    Raises 403 if the user doesn't have access.
    Central/Admin: access everything.
    State Officer: access only their state.
    District Officer: access only their state + district.
    """
    if user.role in (UserRole.ADMIN, UserRole.CENTRAL_OFFICER):
        return

    if state and not user.has_access_to_state(state):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you do not have access to state '{state}'",
        )

    if district and not user.has_access_to_district(state or "", district):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you do not have access to district '{district}'",
        )
