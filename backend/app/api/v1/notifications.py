"""
Bhūmi Prājñā - Notifications + Audit APIs
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.models.project import Notification
from app.models.audit import AuditLog

# ── Notifications ─────────────────────────────────────────────────────────────
notif_router = APIRouter(tags=["Notifications"])


@notif_router.get("/notifications")
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        q = q.where(Notification.read_at.is_(None))
    if severity:
        q = q.where(Notification.severity == severity)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    unread = (await db.execute(
        select(func.count()).select_from(
            select(Notification).where(Notification.user_id == current_user.id,
                                       Notification.read_at.is_(None)).subquery()
        )
    )).scalar()
    q = q.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    notifications = result.scalars().all()
    return {
        "notifications": [
            {"id": str(n.id), "type": n.type, "severity": n.severity,
             "message": n.message, "created_at": n.created_at.isoformat() if n.created_at else None,
             "read_at": n.read_at.isoformat() if n.read_at else None,
             "project_id": str(n.project_id) if n.project_id else None}
            for n in notifications
        ],
        "total": total,
        "unread": unread,
    }


@notif_router.put("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = await db.get(Notification, notification_id)
    if not notif or notif.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Marked as read"}


# ── Audit Trail ───────────────────────────────────────────────────────────────
audit_router = APIRouter(tags=["Audit"])


@audit_router.get("/audit")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    project_id: Optional[uuid.UUID] = Query(None),
    action: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "CENTRAL_OFFICER"])),
):
    q = select(AuditLog).order_by(AuditLog.timestamp.desc())
    if project_id:
        q = q.where(AuditLog.project_id == project_id)
    if action:
        q = q.where(AuditLog.action == action)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    logs = result.scalars().all()
    return {
        "logs": [
            {
                "id": str(log.id),
                "actor_user_id": str(log.actor_user_id),
                "actor_email": log.actor_email,
                "project_id": str(log.project_id) if log.project_id else None,
                "action": log.action,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "details": log.details,
                "before_values": log.before_values,
                "after_values": log.after_values,
            }
            for log in logs
        ],
        "total": total,
    }
