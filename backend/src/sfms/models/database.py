from __future__ import annotations

import ssl as _ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from sfms.config import get_settings

_engine = None
_session_factory = None


def _get_connect_args(db_url: str) -> dict:
    """Disable SSL for Fly.io internal connections; use verify-full otherwise."""
    if ".flycast" in db_url or ".internal" in db_url or "localhost" in db_url:
        return {"ssl": False}
    return {}


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.async_database_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            connect_args=_get_connect_args(settings.async_database_url),
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory
