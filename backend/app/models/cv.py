"""CV file: metadata only; bytes live on the upload volume."""

from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel

from .candidate import Candidate
from .common import utcnow


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
