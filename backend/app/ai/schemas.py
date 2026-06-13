"""Pydantic models for AI structured output."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class CandidateIdentifiers(BaseModel):
    """Identifiers the model proposes from a CV. All optional — never fabricated."""

    nom: str | None = Field(default=None, description="Family name / surname")
    prenom: str | None = Field(default=None, description="First / given name")
    ddn: date | None = Field(
        default=None, description="Date of birth as an ISO date if clearly present"
    )
    email: str | None = None
    telephone: str | None = None
    isikukood: str | None = Field(
        default=None,
        description="Estonian personal identification code: exactly 11 digits",
    )
