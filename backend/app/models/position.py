"""Position: reusable job context; company lives on the Company singleton."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .common import utcnow

if TYPE_CHECKING:
    from .candidate import Candidate


class PositionBase(SQLModel):
    title: str = ""
    job_source: str | None = None  # job description: a URL or pasted text
    job_is_url: bool = False
    job_presentation: str | None = None  # AI-generated, editable
    selection_criteria: str | None = None  # editable, manual


class Position(PositionBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ai_model: str | None = None
    generated_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    candidates: list["Candidate"] = Relationship(
        back_populates="position",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PositionCreate(PositionBase):
    pass


class PositionUpdate(SQLModel):
    title: str | None = None
    job_source: str | None = None
    job_is_url: bool | None = None
    job_presentation: str | None = None
    selection_criteria: str | None = None


class PositionRead(PositionBase):
    id: int
    ai_model: str | None
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PositionReadWithCounts(PositionRead):
    candidate_count: int = 0
