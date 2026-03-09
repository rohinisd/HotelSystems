# Build context: backend/ (docker compose: context: ../backend)
# Paths are relative to backend/ — do NOT use backend/ prefix.
FROM python:3.12-slim AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
COPY src/ src/
COPY alembic.ini .
COPY alembic/ alembic/
RUN pip install --no-cache-dir .

FROM base AS production
ENV PYTHONPATH=/app/src
EXPOSE 8001
# Shell form so PYTHONPATH is set when uvicorn starts; 1 worker avoids subprocess env issues
CMD ["sh", "-c", "exec uvicorn hotel_ms.main:app --host 0.0.0.0 --port 8001 --workers 1"]
