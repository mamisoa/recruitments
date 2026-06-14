"""Company singleton: shared across all positions."""

from datetime import datetime

from sqlmodel import Field, SQLModel

from .common import utcnow


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
