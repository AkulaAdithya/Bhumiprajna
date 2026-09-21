"""
Bhumi Prajna - FastAPI Main Application
Entry point for the backend API server.
"""

import sys
import os
import uuid as _uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db, close_db, AsyncSessionLocal
from app.db.seed import seed_database

# Import route modules
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.geography import router as geo_router
from app.api.v1.projects import router as projects_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.notifications import notif_router, audit_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.gis import router as gis_router
from app.api.v1.models import router as models_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize DB, seed data, load ML models."""
    # Startup
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    # Retroactively complete projects whose latest snapshot satisfies all milestones
    try:
        from sqlalchemy import select
        from app.models.project import Project, ProjectStateSnapshot
        from app.models.audit import AuditLog
        from app.api.v1.projects import _is_snapshot_complete
        import uuid

        async with AsyncSessionLocal() as session:
            # Fetch all ONGOING projects
            result = await session.execute(
                select(Project).where(Project.status == "ONGOING")
            )
            ongoing = result.scalars().all()

            completed_count = 0
            for project in ongoing:
                # Fetch its latest snapshot
                snap_result = await session.execute(
                    select(ProjectStateSnapshot)
                    .where(ProjectStateSnapshot.project_id == project.id)
                    .order_by(ProjectStateSnapshot.snapshot_date.desc())
                    .limit(1)
                )
                snap = snap_result.scalar_one_or_none()
                if snap and _is_snapshot_complete(snap):
                    project.status = "COMPLETED"
                    session.add(AuditLog(
                        actor_user_id=project.created_by,
                        actor_email="system@pravaah",
                        project_id=project.id,
                        action="PROJECT_COMPLETED",
                        details=f"[Startup scan] Project '{project.project_name}' auto-completed — all milestones fulfilled.",
                        before_values={"status": "ONGOING"},
                        after_values={"status": "COMPLETED"},
                    ))
                    completed_count += 1

            if completed_count:
                await session.commit()
                print(f"[INFO] Auto-completed {completed_count} project(s) at startup.")
    except Exception as e:
        print(f"[WARNING] Startup completion scan error: {e}")

    # Load ML prediction service (non-blocking — falls back gracefully if missing)
    try:
        # Add backend root to sys.path so ml_pipeline is importable
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        from app.ml.prediction_service import prediction_service
        prediction_service.load()
    except Exception as e:
        print(f"[WARNING] ML model load warning: {e}")

    print(f"[INFO] {settings.APP_NAME} v{settings.APP_VERSION} started")

    yield

    # Shutdown
    await close_db()
    print(f"[INFO] {settings.APP_NAME} stopped")




app = FastAPI(
    title=settings.APP_NAME,
    description="Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)


class SecurityHeadersMiddleware:
    """Pure ASGI middleware — adds security headers without BaseHTTPMiddleware overhead."""
    def __init__(self, app, debug: bool = True):
        self.app = app
        self.debug = debug

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        request_id = dict(scope.get("headers", [])).get(b"x-request-id", str(_uuid.uuid4()).encode()).decode()

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                headers[b"x-content-type-options"] = b"nosniff"
                headers[b"x-frame-options"] = b"DENY"
                headers[b"x-xss-protection"] = b"1; mode=block"
                headers[b"referrer-policy"] = b"strict-origin-when-cross-origin"
                headers[b"x-request-id"] = request_id.encode()
                if not self.debug:
                    headers[b"strict-transport-security"] = b"max-age=31536000; includeSubDomains"
                message = {**message, "headers": list(headers.items())}
            await send(message)

        await self.app(scope, receive, send_with_headers)


app.add_middleware(SecurityHeadersMiddleware, debug=settings.DEBUG)

# Register API routes
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(geo_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(notif_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(gis_router, prefix="/api/v1")
app.include_router(models_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
