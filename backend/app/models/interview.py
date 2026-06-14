"""Interview: 1:1 with candidate, including free-form custom evaluations."""

from datetime import datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

from .candidate import Candidate
from .common import utcnow


class CustomEvaluation(SQLModel):
    """A free-form interview evaluation: title + 0-10 score + note.

    Stored as a JSON list on the Interview row (see InterviewBase below).
    """

    title: str = ""
    score: int | None = Field(default=None, ge=0, le=10)
    note: str | None = None


class InterviewBase(SQLModel):
    score_fluence: int | None = Field(default=None, ge=0, le=10)
    note_fluence: str | None = None
    score_professionnalisme: int | None = Field(default=None, ge=0, le=10)
    note_professionnalisme: str | None = None
    score_competences: int | None = Field(default=None, ge=0, le=10)
    note_competences: str | None = None
    score_langues: int | None = Field(default=None, ge=0, le=10)
    note_langues: str | None = None
    attentes_candidat: str | None = None
    specificites_candidat: str | None = None
    interview_summary: str | None = None  # AI-generated, editable, regenerable
    custom_evaluations: list[CustomEvaluation] = Field(
        default_factory=list, sa_column=Column(JSON)
    )


class Interview(InterviewBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id", unique=True, index=True)
    ai_model: str | None = None
    summary_generated_at: datetime | None = None
    updated_at: datetime = Field(default_factory=utcnow)

    candidate: Candidate | None = Relationship(back_populates="interview")


class InterviewUpdate(InterviewBase):
    pass


class InterviewRead(InterviewBase):
    id: int
    candidate_id: int
    ai_model: str | None
    summary_generated_at: datetime | None
    updated_at: datetime
