"""Composite read models that join several entities into one payload."""

from sqlmodel import SQLModel

from .candidate import CandidateRead
from .cv import CvFileRead
from .interview import InterviewRead
from .position import PositionRead


class CandidateDetailRead(CandidateRead):
    cv_files: list[CvFileRead] = []
    interview: InterviewRead | None = None


class CandidateScoresRead(CandidateRead):
    """Candidate plus its interview scores, for the results dashboard.

    Lighter than CandidateDetailRead: no CV files (unused when comparing scores).
    """

    interview: InterviewRead | None = None


class InterviewSheetRead(SQLModel):
    """Everything the final interview sheet needs in one payload."""

    position: PositionRead
    candidate: CandidateRead
    cv_files: list[CvFileRead] = []
    interview: InterviewRead | None = None
