"""Database engine, SQLite pragmas, and the per-request session dependency."""

from __future__ import annotations

import json
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

def _json_default(obj: object) -> object:
    """Serialize values JSON columns may receive that ``json.dumps`` can't.

    Pydantic/SQLModel instances (e.g. CustomEvaluation items assigned directly)
    are reduced to plain JSON-compatible dicts.
    """
    model_dump = getattr(obj, "model_dump", None)
    if callable(model_dump):
        return model_dump(mode="json")
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _json_serializer(value: object) -> str:
    return json.dumps(value, default=_json_default)


# check_same_thread=False is required: FastAPI runs sync endpoints in a threadpool,
# so a connection may be used by a different thread than the one that created it.
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False},
    json_serializer=_json_serializer,
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
    _run_light_migrations()


def _run_light_migrations() -> None:
    """Idempotent additive migrations for SQLite.

    ``create_all`` never alters existing tables, so columns added after a table
    was first created must be backfilled by hand. Add new entries here when a
    nullable/defaulted column is introduced on an existing model.
    """
    from sqlalchemy import inspect, text

    additions = {
        "interview": {
            "custom_evaluations": "JSON DEFAULT '[]'",
            "specificites_candidat": "TEXT",
        },
    }
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, columns in additions.items():
            if table not in existing_tables:
                continue
            present = {col["name"] for col in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in present:
                    conn.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
                    )


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

# Silence an unused-import linter while keeping Engine available for typing if needed.
_ = Engine
