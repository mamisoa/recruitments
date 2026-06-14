"""Candidate endpoints: CRUD, CV upload, AI extraction & profile summary."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile
from sqlmodel import select

from app.ai import agents
from app.ai.schemas import CandidateIdentifiers
from app.db import SessionDep
from app.models import (
    Candidate,
    CandidateCreate,
    CandidateDetailRead,
    CandidateRead,
    CandidateScoresRead,
    CandidateUpdate,
    CvFile,
    CvFileRead,
    InterviewSheetRead,
    Position,
    PositionRead,
    utcnow,
)
from app import storage

router = APIRouter(tags=["candidates"])


def _candidate_or_404(session: SessionDep, candidate_id: int) -> Candidate:
    candidate = session.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def _load_cv_docs(candidate: Candidate) -> list[tuple[bytes, str]]:
    if not candidate.cv_files:
        raise HTTPException(
            status_code=400, detail="Upload at least one CV file first."
        )
    return [
        (storage.read_bytes(cv.stored_path), cv.content_type)
        for cv in candidate.cv_files
    ]


# --- CRUD ------------------------------------------------------------------- #
@router.get("/positions/{position_id}/candidates", response_model=list[CandidateRead])
def list_candidates(position_id: int, session: SessionDep) -> list[Candidate]:
    if session.get(Position, position_id) is None:
        raise HTTPException(status_code=404, detail="Position not found")
    return session.exec(
        select(Candidate)
        .where(Candidate.position_id == position_id)
        .order_by(Candidate.updated_at.desc())
    ).all()


@router.get(
    "/positions/{position_id}/candidates/scores",
    response_model=list[CandidateScoresRead],
)
def list_candidate_scores(position_id: int, session: SessionDep) -> list[Candidate]:
    """Candidates of a position with their interview scores, for the dashboard."""
    if session.get(Position, position_id) is None:
        raise HTTPException(status_code=404, detail="Position not found")
    return session.exec(
        select(Candidate)
        .where(Candidate.position_id == position_id)
        .order_by(Candidate.created_at.asc())
    ).all()


@router.post(
    "/positions/{position_id}/candidates", response_model=CandidateRead, status_code=201
)
def create_candidate(
    position_id: int, payload: CandidateCreate, session: SessionDep
) -> Candidate:
    if session.get(Position, position_id) is None:
        raise HTTPException(status_code=404, detail="Position not found")
    candidate = Candidate.model_validate(payload, update={"position_id": position_id})
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return candidate


@router.get("/candidates/{candidate_id}", response_model=CandidateDetailRead)
def get_candidate(candidate_id: int, session: SessionDep) -> Candidate:
    return _candidate_or_404(session, candidate_id)


@router.get("/candidates/{candidate_id}/sheet", response_model=InterviewSheetRead)
def get_interview_sheet(candidate_id: int, session: SessionDep) -> InterviewSheetRead:
    candidate = _candidate_or_404(session, candidate_id)
    position = session.get(Position, candidate.position_id)
    return InterviewSheetRead(
        position=PositionRead.model_validate(position),
        candidate=CandidateRead.model_validate(candidate),
        cv_files=[CvFileRead.model_validate(cv) for cv in candidate.cv_files],
        interview=candidate.interview,
    )


@router.put("/candidates/{candidate_id}", response_model=CandidateDetailRead)
def update_candidate(
    candidate_id: int, payload: CandidateUpdate, session: SessionDep
) -> Candidate:
    candidate = _candidate_or_404(session, candidate_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(candidate, key, value)
    candidate.updated_at = utcnow()
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return candidate


@router.delete("/candidates/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, session: SessionDep) -> None:
    candidate = _candidate_or_404(session, candidate_id)
    for cv in candidate.cv_files:
        storage.delete_file(cv.stored_path)
    session.delete(candidate)
    session.commit()


# --- CV upload -------------------------------------------------------------- #
@router.post("/candidates/{candidate_id}/cv", response_model=list[CvFileRead])
async def upload_cvs(
    candidate_id: int, session: SessionDep, files: list[UploadFile]
) -> list[CvFile]:
    candidate = _candidate_or_404(session, candidate_id)
    saved: list[CvFile] = []
    for file in files:
        stored_path, size = await storage.save_upload(file)
        cv = CvFile(
            candidate_id=candidate.id,
            original_name=file.filename or "cv",
            stored_path=stored_path,
            content_type=(file.content_type or "").split(";")[0].strip(),
            size_bytes=size,
        )
        session.add(cv)
        saved.append(cv)
    session.commit()
    for cv in saved:
        session.refresh(cv)
    return saved


@router.delete("/candidates/{candidate_id}/cv/{cv_id}", status_code=204)
def delete_cv(candidate_id: int, cv_id: int, session: SessionDep) -> None:
    cv = session.get(CvFile, cv_id)
    if cv is None or cv.candidate_id != candidate_id:
        raise HTTPException(status_code=404, detail="CV file not found")
    storage.delete_file(cv.stored_path)
    session.delete(cv)
    session.commit()


# --- AI --------------------------------------------------------------------- #
@router.post("/candidates/{candidate_id}/extract", response_model=CandidateIdentifiers)
async def extract_identifiers(
    candidate_id: int, session: SessionDep
) -> CandidateIdentifiers:
    """Read the uploaded CVs and propose identifiers. Does NOT overwrite saved fields."""
    candidate = _candidate_or_404(session, candidate_id)
    docs = _load_cv_docs(candidate)
    try:
        return await agents.extract_candidate_identifiers(docs)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post(
    "/candidates/{candidate_id}/summary/generate", response_model=CandidateDetailRead
)
async def generate_summary(candidate_id: int, session: SessionDep) -> Candidate:
    candidate = _candidate_or_404(session, candidate_id)
    docs = _load_cv_docs(candidate)
    try:
        summary = await agents.generate_profile_summary(docs)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    candidate.profile_summary = summary
    candidate.ai_model = agents.ai_model_name()
    candidate.summary_generated_at = utcnow()
    candidate.updated_at = utcnow()
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return candidate
