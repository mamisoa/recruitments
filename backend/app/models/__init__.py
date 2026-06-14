"""SQLModel tables and their API (Create/Update/Read) variants.

Relationships (reusable entities):

    position (1) ──< candidate (N) ──< cv_file (N)
                          └──── interview (1:1)

The models are split one entity per module for isolation; everything is
re-exported here so callers keep using ``from app.models import X``. Modules are
imported in dependency order so SQLModel can resolve the string forward
references used in the relationships (e.g. ``"Candidate"``, ``"Interview"``).
"""

from .common import ISIKUKOOD_RE, compute_age, utcnow
from .company import Company, CompanyBase, CompanyRead, CompanyUpdate
from .position import (
    Position,
    PositionBase,
    PositionCreate,
    PositionRead,
    PositionReadWithCounts,
    PositionUpdate,
)
from .candidate import (
    Candidate,
    CandidateBase,
    CandidateCreate,
    CandidateRead,
    CandidateUpdate,
)
from .cv import CvFile, CvFileRead
from .interview import (
    CustomEvaluation,
    Interview,
    InterviewBase,
    InterviewRead,
    InterviewUpdate,
)
from .aggregates import CandidateDetailRead, CandidateScoresRead, InterviewSheetRead

__all__ = [
    "ISIKUKOOD_RE",
    "compute_age",
    "utcnow",
    "Company",
    "CompanyBase",
    "CompanyRead",
    "CompanyUpdate",
    "Position",
    "PositionBase",
    "PositionCreate",
    "PositionRead",
    "PositionReadWithCounts",
    "PositionUpdate",
    "Candidate",
    "CandidateBase",
    "CandidateCreate",
    "CandidateRead",
    "CandidateUpdate",
    "CvFile",
    "CvFileRead",
    "CustomEvaluation",
    "Interview",
    "InterviewBase",
    "InterviewRead",
    "InterviewUpdate",
    "CandidateDetailRead",
    "CandidateScoresRead",
    "InterviewSheetRead",
]
