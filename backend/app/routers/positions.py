"""Position (reusable company + job) endpoints."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException
from sqlalchemy import func
from sqlmodel import select

from app.ai import agents
from app.db import SessionDep
from app.models import (
    Candidate,
    Position,
    PositionCreate,
    PositionRead,
    PositionReadWithCounts,
    PositionUpdate,
)
from app.models import utcnow
from app.scraping import fetch_clean_text

router = APIRouter(prefix="/positions", tags=["positions"])


def _get_or_404(session: SessionDep, position_id: int) -> Position:
    position = session.get(Position, position_id)
    if position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    return position


@router.post("", response_model=PositionRead, status_code=201)
def create_position(payload: PositionCreate, session: SessionDep) -> Position:
    position = Position.model_validate(payload)
    session.add(position)
    session.commit()
    session.refresh(position)
    return position


@router.get("", response_model=list[PositionReadWithCounts])
def list_positions(session: SessionDep) -> list[PositionReadWithCounts]:
    counts = dict(
        session.exec(
            select(Candidate.position_id, func.count(Candidate.id)).group_by(
                Candidate.position_id
            )
        ).all()
    )
    positions = session.exec(select(Position).order_by(Position.updated_at.desc())).all()
    return [
        PositionReadWithCounts(
            **PositionRead.model_validate(p).model_dump(),
            candidate_count=counts.get(p.id, 0),
        )
        for p in positions
    ]


@router.get("/{position_id}", response_model=PositionRead)
def get_position(position_id: int, session: SessionDep) -> Position:
    return _get_or_404(session, position_id)


@router.put("/{position_id}", response_model=PositionRead)
def update_position(
    position_id: int, payload: PositionUpdate, session: SessionDep
) -> Position:
    position = _get_or_404(session, position_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(position, key, value)
    position.updated_at = utcnow()
    session.add(position)
    session.commit()
    session.refresh(position)
    return position


@router.post("/{position_id}/generate", response_model=PositionRead)
async def generate_presentations(position_id: int, session: SessionDep) -> Position:
    """Scrape the company URL / job source and AI-generate both presentation texts."""
    position = _get_or_404(session, position_id)

    if not position.company_url and not position.job_source:
        raise HTTPException(
            status_code=400,
            detail="Provide at least a company URL or a job description first.",
        )

    try:
        if position.company_url:
            company_text = await fetch_clean_text(position.company_url)
            position.company_presentation = await agents.generate_company_presentation(
                company_text
            )

        if position.job_source:
            if position.job_is_url:
                job_text = await fetch_clean_text(position.job_source)
            else:
                job_text = position.job_source
            position.job_presentation = await agents.generate_job_presentation(job_text)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {exc}") from exc
    except RuntimeError as exc:  # AI not configured
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    position.ai_model = agents.ai_model_name()
    position.generated_at = utcnow()
    position.updated_at = utcnow()
    session.add(position)
    session.commit()
    session.refresh(position)
    return position
