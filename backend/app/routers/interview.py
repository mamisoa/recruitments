"""Interview sheet endpoints: save scores/notes and generate the AI summary."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai import agents
from app.db import SessionDep
from app.models import (
    Candidate,
    Company,
    Interview,
    InterviewRead,
    InterviewUpdate,
    Position,
    compute_age,
    utcnow,
)

router = APIRouter(tags=["interview"])

_CRITERIA = [
    ("Fluence du langage", "score_fluence", "note_fluence"),
    ("Professionnalisme", "score_professionnalisme", "note_professionnalisme"),
    ("Compétences", "score_competences", "note_competences"),
    ("Capacités en langues étrangères", "score_langues", "note_langues"),
]


def _candidate_or_404(session: SessionDep, candidate_id: int) -> Candidate:
    candidate = session.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def _get_or_create_interview(session: SessionDep, candidate: Candidate) -> Interview:
    if candidate.interview is not None:
        return candidate.interview
    interview = Interview(candidate_id=candidate.id)
    session.add(interview)
    session.commit()
    session.refresh(interview)
    return interview


@router.put("/candidates/{candidate_id}/interview", response_model=InterviewRead)
def save_interview(
    candidate_id: int, payload: InterviewUpdate, session: SessionDep
) -> Interview:
    candidate = _candidate_or_404(session, candidate_id)
    interview = _get_or_create_interview(session, candidate)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(interview, key, value)
    interview.updated_at = utcnow()
    session.add(interview)
    session.commit()
    session.refresh(interview)
    return interview


@router.post(
    "/candidates/{candidate_id}/interview/summary/generate",
    response_model=InterviewRead,
)
async def generate_interview_summary(
    candidate_id: int, session: SessionDep, lang: str = "en"
) -> Interview:
    candidate = _candidate_or_404(session, candidate_id)
    interview = _get_or_create_interview(session, candidate)
    position = session.get(Position, candidate.position_id)
    company = session.get(Company, 1)

    context = _build_context(company, position, candidate, interview)
    try:
        summary = await agents.generate_interview_summary(context, lang)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    interview.interview_summary = summary
    interview.ai_model = agents.ai_model_name()
    interview.summary_generated_at = utcnow()
    interview.updated_at = utcnow()
    session.add(interview)
    session.commit()
    session.refresh(interview)
    return interview


@router.get("/candidates/{candidate_id}/interview/summary/prompt")
def get_interview_summary_prompt(
    candidate_id: int, session: SessionDep, lang: str = "en"
) -> dict[str, str]:
    """Rebuild the summary prompt from the saved data (what the next generation sends).

    Read-only and independent of the AI provider: it only assembles text.
    """
    candidate = _candidate_or_404(session, candidate_id)
    interview = _get_or_create_interview(session, candidate)
    position = session.get(Position, candidate.position_id)
    company = session.get(Company, 1)
    context = _build_context(company, position, candidate, interview)
    return {"prompt": agents.compose_interview_prompt(context, lang)}


def _eval_field(evaluation: object, name: str) -> object:
    """Read a field from a custom evaluation, tolerating dict or model shape.

    Values loaded straight from the JSON column arrive as dicts; values just
    assigned in-process are CustomEvaluation instances.
    """
    if isinstance(evaluation, dict):
        return evaluation.get(name)
    return getattr(evaluation, name, None)


def _eval_title(evaluation: object) -> str:
    title = _eval_field(evaluation, "title")
    return str(title).strip() if title else ""


def _build_context(
    company: Company | None,
    position: Position | None,
    candidate: Candidate,
    interview: Interview,
) -> str:
    lines: list[str] = []
    if position or (company and company.company_presentation):
        lines.append("# Company & role context")
        if company and company.company_presentation:
            lines.append(f"Company:\n{company.company_presentation}")
        if position and position.job_presentation:
            lines.append(f"Role:\n{position.job_presentation}")
        if position and position.selection_criteria:
            lines.append(f"Selection criteria:\n{position.selection_criteria}")
    lines.append("\n# Candidate")
    lines.append(f"Name: {candidate.prenom} {candidate.nom}")
    age = compute_age(candidate.ddn)
    if age is not None:
        lines.append(f"Age: {age}")
    if candidate.statut_marital:
        lines.append(f"Marital status: {candidate.statut_marital}")
    lines.append(
        f"Student status: {'yes' if candidate.statut_etudiant else 'no'}"
    )
    if candidate.profile_summary:
        lines.append(f"Profile summary:\n{candidate.profile_summary}")
    lines.append("\n# Interview scores (0-10) and notes")
    for label, score_attr, note_attr in _CRITERIA:
        score = getattr(interview, score_attr)
        note = getattr(interview, note_attr)
        lines.append(f"- {label}: {score if score is not None else 'n/a'}/10")
        if note:
            lines.append(f"  Note: {note}")
    custom = [e for e in (interview.custom_evaluations or []) if _eval_title(e)]
    if custom:
        lines.append("\n# Additional evaluations")
        for evaluation in custom:
            title = _eval_field(evaluation, "title")
            score = _eval_field(evaluation, "score")
            note = _eval_field(evaluation, "note")
            lines.append(f"- {title}: {score if score is not None else 'n/a'}/10")
            if note:
                lines.append(f"  Note: {note}")
    if interview.attentes_candidat:
        lines.append(f"\n# Candidate expectations\n{interview.attentes_candidat}")
    if interview.specificites_candidat:
        lines.append(f"\n# Candidate specificities\n{interview.specificites_candidat}")
    if position and position.selection_criteria:
        lines.append(
            "\nWrite the interview summary now. End with a section that assesses the "
            "candidate against each selection criterion, followed by a short overall "
            "recommendation."
        )
    else:
        lines.append(
            "\nWrite the interview summary now, ending with a short overall recommendation."
        )
    return "\n".join(lines)
