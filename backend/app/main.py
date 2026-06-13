"""FastAPI application: API under /api + the built SPA served as static files."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic_ai.exceptions import ModelHTTPError, UnexpectedModelBehavior
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.db import create_db_and_tables
from app.routers import candidates, interview, positions

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Recruitments API", version="0.1.0", lifespan=lifespan)

@app.exception_handler(ModelHTTPError)
async def _model_http_error(_request: Request, exc: ModelHTTPError) -> JSONResponse:
    # Surface upstream AI endpoint failures (e.g. 401 bad token) instead of a 500.
    status = 502 if exc.status_code >= 500 else exc.status_code
    return JSONResponse(
        status_code=status,
        content={"detail": f"AI endpoint error ({exc.status_code}): {exc.body}"},
    )


@app.exception_handler(UnexpectedModelBehavior)
async def _model_behavior_error(
    _request: Request, exc: UnexpectedModelBehavior
) -> JSONResponse:
    return JSONResponse(status_code=502, content={"detail": f"AI error: {exc}"})


if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- API ------------------------------------------------------------------- #
api = APIRouter(prefix="/api")


@api.get("/health", tags=["meta"])
def health() -> dict[str, object]:
    return {"status": "ok", "ai_enabled": settings.ai_enabled}


api.include_router(positions.router)
api.include_router(candidates.router)
api.include_router(interview.router)
app.include_router(api)


# --- SPA (mounted LAST so /api wins; falls back to index.html on 404) -------- #
class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


if os.path.isdir(STATIC_DIR):
    app.mount("/", SPAStaticFiles(directory=STATIC_DIR, html=True), name="spa")
