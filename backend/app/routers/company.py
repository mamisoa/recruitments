"""Company (singleton) endpoints: shared company context across all positions."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from app.ai import agents
from app.db import SessionDep
from app.models import Company, CompanyRead, CompanyUpdate, utcnow
from app.scraping import fetch_clean_text

router = APIRouter(prefix="/company", tags=["company"])


def _get_or_create(session: SessionDep) -> Company:
    """Return the singleton company row (id=1), creating an empty one if absent."""
    company = session.get(Company, 1)
    if company is None:
        company = Company(id=1)
        session.add(company)
        session.commit()
        session.refresh(company)
    return company


@router.get("", response_model=CompanyRead)
def get_company(session: SessionDep) -> Company:
    return _get_or_create(session)


@router.put("", response_model=CompanyRead)
def update_company(payload: CompanyUpdate, session: SessionDep) -> Company:
    company = _get_or_create(session)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    company.updated_at = utcnow()
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.post("/generate", response_model=CompanyRead)
async def generate_presentation(session: SessionDep, lang: str = "en") -> Company:
    """Scrape the company URL and AI-generate the company presentation."""
    company = _get_or_create(session)

    if not company.company_url:
        raise HTTPException(
            status_code=400,
            detail="Provide a company URL first.",
        )

    try:
        company_text = await fetch_clean_text(company.company_url)
        company.company_presentation = await agents.generate_company_presentation(
            company_text, lang
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {exc}") from exc
    except RuntimeError as exc:  # AI not configured
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    company.ai_model = agents.ai_model_name()
    company.generated_at = utcnow()
    company.updated_at = utcnow()
    session.add(company)
    session.commit()
    session.refresh(company)
    return company
