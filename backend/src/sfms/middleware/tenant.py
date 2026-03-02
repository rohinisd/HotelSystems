from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from jose import jwt

from sfms.config import get_settings

PUBLIC_PATHS = {
    "/api/v1/health",
    "/api/v1/health/db",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/docs",
    "/api/redoc",
    "/openapi.json",
    "/docs",
    "/redoc",
}


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        request.state.tenant_id = None

        path = request.url.path.rstrip("/")
        if path in PUBLIC_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                settings = get_settings()
                payload = jwt.decode(
                    token,
                    settings.jwt_secret,
                    algorithms=[settings.jwt_algorithm],
                )
                request.state.tenant_id = payload.get("facility_id")
            except Exception:
                pass

        return await call_next(request)
