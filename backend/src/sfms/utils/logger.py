from __future__ import annotations

import structlog


def setup_logging(app_env: str = "dev") -> None:
    """Configure structlog with environment-aware rendering."""
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        _mask_sensitive_data,
    ]

    if app_env == "prod":
        shared_processors.append(structlog.processors.JSONRenderer())
    else:
        shared_processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=shared_processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


SENSITIVE_KEYS = {"password", "secret", "token", "api_key", "authorization", "hashed_password"}


def _mask_sensitive_data(
    logger: structlog.types.WrappedLogger,
    method_name: str,
    event_dict: structlog.types.EventDict,
) -> structlog.types.EventDict:
    for key in event_dict:
        if key.lower() in SENSITIVE_KEYS:
            event_dict[key] = "********"
    return event_dict
