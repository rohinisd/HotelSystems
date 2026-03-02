from __future__ import annotations

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sfms.config import get_settings
from sfms.middleware.tenant import TenantMiddleware
from sfms.routers import auth, bookings, courts, dashboard, facilities, health, payments
from sfms.utils.logger import setup_logging

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(app_env=settings.app_env)

    app = FastAPI(
        title="SFMS API",
        description="Sports Facility Management System",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Tenant-ID"],
    )
    app.add_middleware(TenantMiddleware)

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(facilities.router, prefix="/api/v1")
    app.include_router(courts.router, prefix="/api/v1")
    app.include_router(bookings.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(dashboard.router, prefix="/api/v1")

    @app.on_event("startup")
    async def on_startup():
        logger.info("SFMS API starting", env=settings.app_env, debug=settings.debug)

    return app


app = create_app()
