"""Fetch a URL and extract clean main-content text with trafilatura."""

from __future__ import annotations

import httpx
import trafilatura

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; RecruitmentsBot/0.1; +https://recruitments.local)"
    )
}


async def fetch_clean_text(url: str, *, max_chars: int = 20_000) -> str:
    """Download `url` and return readable text. Raises on network errors."""
    async with httpx.AsyncClient(
        follow_redirects=True, timeout=20.0, headers=_HEADERS
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        html = resp.text

    extracted = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        favor_recall=True,
    )
    text = (extracted or "").strip()
    if not text:
        # Fall back to the raw HTML stripped of tags if extraction came up empty.
        text = trafilatura.utils.sanitize(html) if hasattr(trafilatura, "utils") else html
    return text[:max_chars]
