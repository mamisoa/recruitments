# syntax=docker/dockerfile:1.7

#### Stage 1: build the SPA with pnpm via corepack ####
FROM node:22-slim AS frontend
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable pnpm
WORKDIR /app/frontend
# Manifests first for better layer caching (.npmrc carries the install policy).
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/.npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY frontend/ ./
# vite build.outDir is ../backend/static -> writes to /app/backend/static
RUN pnpm run build

#### Stage 2: build the Python venv with uv ####
FROM python:3.13-slim AS backend
COPY --from=ghcr.io/astral-sh/uv:0.8 /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0
WORKDIR /app
# Install deps WITHOUT the project first for the best cache hit.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev
COPY backend/ /app/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

#### Stage 3: lean runtime ####
FROM python:3.13-slim AS runtime
RUN groupadd -r app && useradd -r -g app app
WORKDIR /app
ENV PATH=/app/.venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/app.db \
    UPLOAD_DIR=/data/uploads \
    CORS_ORIGINS=[]
# venv + app code from the backend stage (app/main.py serves ../static = /app/static)
COPY --from=backend --chown=app:app /app /app
# built SPA from the frontend stage
COPY --from=frontend --chown=app:app /app/backend/static /app/static
# pre-create + own the data volume mount point BEFORE switching user
RUN mkdir -p /data/uploads && chown -R app:app /data
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/health').status==200 else 1)" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
