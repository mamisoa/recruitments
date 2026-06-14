"""Pydantic AI agents and the high-level functions the routers call.

Agents are built lazily and cached so that importing this module never requires an
API key. All calls are async (`await agent.run(...)`) so the ASGI worker is not blocked.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_ai import Agent, BinaryContent

from app.ai.provider import get_model
from app.ai.schemas import CandidateIdentifiers
from app.config import settings

# Pydantic AI accepts text, BinaryContent (PDF bytes), or plain strings in the prompt.
DocPart = str | BinaryContent


@lru_cache
def _extractor() -> Agent[None, CandidateIdentifiers]:
    return Agent(
        get_model(),
        output_type=CandidateIdentifiers,
        system_prompt=(
            "You extract candidate identifiers from CV documents. "
            "Return null for any field not clearly present — never invent or guess a "
            "value. The isikukood is an Estonian personal identification code of "
            "exactly 11 digits; only return it if you see it verbatim."
        ),
    )


@lru_cache
def _summarizer(system_prompt: str) -> Agent[None, str]:
    return Agent(get_model(), system_prompt=system_prompt)


# --- System prompts (kept terse; the model writes neutral recruitment prose) -------
_COMPANY_SP = (
    "You write concise, neutral company presentations for a recruiter to use before an "
    "interview. 4-6 sentences: what the company does, its sector, size/notable facts, "
    "and culture if available. No marketing fluff, no invented facts."
)
_JOB_SP = (
    "You write concise, neutral job/role presentations for a recruiter. 4-6 sentences: "
    "the role's mission, key responsibilities, and required profile. No invented facts."
)
_PROFILE_SP = (
    "You write a concise, neutral summary of a candidate's professional profile from "
    "their CV(s), for a recruiter to use before an interview. Cover experience, key "
    "skills, education, and notable strengths. Do not invent anything not in the CVs."
)
_INTERVIEW_SP = (
    "You write a balanced interview summary for a recruiter's records. Synthesize the "
    "company/role context, the candidate profile, the recruiter's per-criterion scores "
    "(0-10) and notes, and the candidate's expectations into a clear assessment with a "
    "short overall recommendation. Be factual and base everything on the input given."
)


_LANGUAGE_NAMES = {"fr": "French", "en": "English"}


def _language_directive(lang: str | None) -> str:
    """Map a UI locale (e.g. 'fr', 'en-US') to a 'write in <language>' instruction."""
    name = _LANGUAGE_NAMES.get((lang or "").lower()[:2], "English")
    return f"Write the entire response in {name}."


def _doc_parts(docs: list[tuple[bytes, str]]) -> list[DocPart]:
    """Turn (bytes, content_type) tuples into prompt parts."""
    parts: list[DocPart] = []
    for data, content_type in docs:
        if content_type == "text/plain":
            try:
                parts.append(data.decode("utf-8", errors="replace"))
            except Exception:
                parts.append(BinaryContent(data=data, media_type="text/plain"))
        else:
            parts.append(BinaryContent(data=data, media_type=content_type))
    return parts


# --------------------------------------------------------------------------- #
# Public functions used by the routers
# --------------------------------------------------------------------------- #
async def generate_company_presentation(company_text: str) -> str:
    result = await _summarizer(_COMPANY_SP).run(
        f"Write a company presentation based on this source material:\n\n{company_text}"
    )
    return result.output


async def generate_job_presentation(job_text: str) -> str:
    result = await _summarizer(_JOB_SP).run(
        f"Write a job/role presentation based on this job description:\n\n{job_text}"
    )
    return result.output


async def extract_candidate_identifiers(
    docs: list[tuple[bytes, str]],
) -> CandidateIdentifiers:
    prompt: list[DocPart] = [
        "Extract the candidate identifiers from the following CV document(s)."
    ]
    prompt.extend(_doc_parts(docs))
    result = await _extractor().run(prompt)
    return result.output


async def generate_profile_summary(docs: list[tuple[bytes, str]]) -> str:
    prompt: list[DocPart] = [
        "Summarize the candidate's professional profile from the following CV(s)."
    ]
    prompt.extend(_doc_parts(docs))
    result = await _summarizer(_PROFILE_SP).run(prompt)
    return result.output


async def generate_interview_summary(context: str, lang: str | None = None) -> str:
    result = await _summarizer(_INTERVIEW_SP).run(
        f"{context}\n\n{_language_directive(lang)}"
    )
    return result.output


def ai_model_name() -> str:
    return settings.ai_model
