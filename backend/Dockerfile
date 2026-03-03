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
EXPOSE 8001
CMD ["uvicorn", "sfms.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
