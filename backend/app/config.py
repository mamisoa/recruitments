"""Application settings loaded from environment / .env."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # AI — any OpenAI-compatible endpoint (OpenRouter, OpenAI, vLLM, …)
    ai_base_url: str = "https://openrouter.ai/api/v1"
    ai_api_key: str = ""
    ai_model: str = "openai/gpt-5.4-mini"

    # Persistence
    database_url: str = "sqlite:///./data/app.db"
    upload_dir: str = "./data/uploads"
    max_upload_mb: int = 15

    # CORS (dev only; SPA is same-origin in prod so leave empty there)
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        # Look in the backend dir and the repo root, so a single root .env works whether
        # uvicorn is launched from backend/ (dev) or the project root.
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def ai_enabled(self) -> bool:
        return bool(self.ai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
