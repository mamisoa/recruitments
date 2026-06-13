"""Database engine, SQLite pragmas, and the per-request session dependency."""

from __future__ import annotations

import os
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings


def _sqlite_path_from_url(url: str) -> str | None:
    """Return the filesystem path for a sqlite URL, or None for other backends."""
    prefix = "sqlite:///"
    if url.startswith(prefix):
        return url[len(prefix) :]
    return None


# Ensure the directory holding the SQLite file exists before the engine connects.
_db_path = _sqlite_path_from_url(settings.database_url)
if _db_path:
    parent = os.path.dirname(os.path.abspath(_db_path))
    os.makedirs(parent, exist_ok=True)

# check_same_thread=False is required: FastAPI runs sync endpoints in a threadpool,
# so a connection may be used by a different thread than the one that created it.
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, _connection_record) -> None:
    """Apply WAL + sane pragmas on every new connection (pooled conns don't inherit)."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


def create_db_and_tables() -> None:
    # Import models so they register on SQLModel.metadata before create_all.
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

# Silence an unused-import linter while keeping Engine available for typing if needed.
_ = Engine
