"""Build the OpenAI-compatible model once, lazily (so import works without a key).

Works with any OpenAI-compatible /v1 endpoint (vLLM, OpenRouter, OpenAI, …) — set
AI_BASE_URL, AI_API_KEY and AI_MODEL in the environment / .env.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.config import settings


@lru_cache
def get_model() -> OpenAIChatModel:
    if not settings.ai_api_key:
        raise RuntimeError(
            "AI_API_KEY is not set — AI features are unavailable. "
            "Add it to your .env file."
        )
    provider = OpenAIProvider(
        base_url=settings.ai_base_url,
        api_key=settings.ai_api_key,
    )
    return OpenAIChatModel(settings.ai_model, provider=provider)
