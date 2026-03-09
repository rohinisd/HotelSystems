from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hotel_ms.config import get_settings
from hotel_ms.routers import auth, health, restaurants

settings = get_settings()

app = FastAPI(
    title="Restaurant Table Booking API",
    description="SaaS for restaurant table reservations - multi-tenant",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(restaurants.router, prefix="/api/v1")
