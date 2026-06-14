"""Candidate: belongs to a position, owns CV files and a 1:1 interview."""

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from pydantic import computed_field, field_validator
from sqlmodel import Field, Relationship, SQLModel

from .common import ISIKUKOOD_RE, compute_age, utcnow
from .position import Position

if TYPE_CHECKING:
    from .cv import CvFile
    from .interview import Interview


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
