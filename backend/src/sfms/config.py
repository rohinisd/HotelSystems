from __future__ import annotations

import json
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "dev"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sfms"

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=" in url:
            url = url.split("?")[0]
        return url

    jwt_secret: str = "CHANGE_ME"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    cors_origins: str = '["http://localhost:3000"]'
    sms_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(o).strip() for o in parsed]
        except (json.JSONDecodeError, TypeError):
            pass
        cleaned = raw.strip("[]")
        return [o.strip().strip('"').strip("'") for o in cleaned.split(",") if o.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
