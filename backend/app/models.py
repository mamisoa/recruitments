"""SQLModel tables and their API (Create/Update/Read) variants.

Relationships (reusable entities):

    position (1) ──< candidate (N) ──< cv_file (N)
                          └──── interview (1:1)
"""

import re
from datetime import date, datetime, timezone
from typing import Optional

from pydantic import computed_field, field_validator
from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def compute_age(ddn: date | None) -> int | None:
    if ddn is None:
        return None
    today = date.today()
    return today.year - ddn.year - ((today.month, today.day) < (ddn.month, ddn.day))


ISIKUKOOD_RE = re.compile(r"^\d{11}$")


# --------------------------------------------------------------------------- #
# Company (singleton: shared across all positions)
# --------------------------------------------------------------------------- #
class CompanyBase(SQLModel):
    name: str = ""
    company_url: str | None = None
    company_presentation: str | None = None  # AI-generated, editable


class Company(CompanyBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ai_model: str | None = None
    generated_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class CompanyUpdate(SQLModel):
    name: str | None = None
    company_url: str | None = None
    company_presentation: str | None = None


class CompanyRead(CompanyBase):
    id: int
    ai_model: str | None
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------- #
# Position (reusable job context; company lives on the Company singleton)
# --------------------------------------------------------------------------- #
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


# --------------------------------------------------------------------------- #
# Candidate
# --------------------------------------------------------------------------- #
class CandidateBase(SQLModel):
    nom: str = ""
    prenom: str = ""
    ddn: date | None = None  # date de naissance
    email: str | None = None
    telephone: str | None = None
    isikukood: str | None = None  # Estonian personal ID (11 digits)
    statut_marital: str | None = None
    statut_etudiant: bool = False
    profile_summary: str | None = None  # AI-generated, editable

    @field_validator("isikukood")
    @classmethod
    def _validate_isikukood(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        v = v.strip()
        if not ISIKUKOOD_RE.match(v):
            raise ValueError("isikukood must be exactly 11 digits")
        return v


class Candidate(CandidateBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    position_id: int = Field(foreign_key="position.id", index=True)
    ai_model: str | None = None
    summary_generated_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    position: Position | None = Relationship(back_populates="candidates")
    cv_files: list["CvFile"] = Relationship(
        back_populates="candidate",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    interview: Optional["Interview"] = Relationship(
        back_populates="candidate",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "uselist": False},
    )


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(SQLModel):
    nom: str | None = None
    prenom: str | None = None
    ddn: date | None = None
    email: str | None = None
    telephone: str | None = None
    isikukood: str | None = None
    statut_marital: str | None = None
    statut_etudiant: bool | None = None
    profile_summary: str | None = None

    @field_validator("isikukood")
    @classmethod
    def _validate_isikukood(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        v = v.strip()
        if not ISIKUKOOD_RE.match(v):
            raise ValueError("isikukood must be exactly 11 digits")
        return v


class CandidateRead(CandidateBase):
    id: int
    position_id: int
    ai_model: str | None
    summary_generated_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def age(self) -> int | None:
        return compute_age(self.ddn)


# --------------------------------------------------------------------------- #
# CV file (metadata only; bytes live on the upload volume)
# --------------------------------------------------------------------------- #
class CvFile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    candidate_id: int = Field(foreign_key="candidate.id", index=True)
    original_name: str
    stored_path: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime = Field(default_factory=utcnow)

    candidate: Candidate | None = Relationship(back_populates="cv_files")


class CvFileRead(SQLModel):
    id: int
    candidate_id: int
    original_name: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime


# --------------------------------------------------------------------------- #
# Interview (1:1 with candidate)
# --------------------------------------------------------------------------- #
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


# --------------------------------------------------------------------------- #
# Aggregate read models
# --------------------------------------------------------------------------- #
class CandidateDetailRead(CandidateRead):
    cv_files: list[CvFileRead] = []
    interview: InterviewRead | None = None


class InterviewSheetRead(SQLModel):
    """Everything the final interview sheet needs in one payload."""

    position: PositionRead
    candidate: CandidateRead
    cv_files: list[CvFileRead] = []
    interview: InterviewRead | None = None
