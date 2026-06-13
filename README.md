# Recruitments — AI-assisted interview workflow

A single-container web app that guides a recruiter through a fluid, step-by-step
interview workflow, with AI assistance at every stage:

1. **Position & company** — paste a company URL and a job description (URL or text); the
   backend scrapes them and generates an editable company presentation and job
   presentation. A *position* is reusable across many candidates.
2. **Candidate** — capture identity (nom, prénom, ddn, email, téléphone, isikukood,
   statut marital/étudiant) and upload one or more PDF/TXT CVs. The AI can read the CVs
   to **propose** identifiers (you accept/reject — it never silently overwrites) and to
   generate an editable profile summary.
3. **Interview sheet** — the final fiche: company + job context, key candidate facts
   (incl. computed age) with a deep-link back to edit the candidate, four 0–10 scored
   criteria (language fluency, professionalism, skills, foreign languages) each with a
   note, a free "candidate expectations" field, and a regenerable AI interview summary.

Everything is persisted to SQLite. Every AI-generated text is editable and can be
regenerated. The UI is bilingual **FR/EN** (switcher in the header).

## Stack

- **Backend**: FastAPI + SQLModel (SQLite, WAL) + Pydantic AI against any
  OpenAI-compatible `/v1` endpoint (OpenRouter, OpenAI, or a self-hosted vLLM), served by
  uvicorn. URL scraping with httpx + trafilatura.
- **Frontend**: pnpm + Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui
  (Base UI), TanStack Query, react-hook-form + zod, react-router, react-i18next.
- **Packaging**: a single Docker image (3-stage build) where FastAPI serves both the
  REST API under `/api/*` and the built SPA (with an `index.html` 404-fallback).

## Configuration

Copy `.env.example` to `.env` and set the AI endpoint. The backend talks to any
**OpenAI-compatible `/v1` endpoint**:

- `AI_BASE_URL` — `https://openrouter.ai/api/v1` (OpenRouter) or a self-hosted vLLM URL
- `AI_API_KEY` — the bearer token (OpenRouter key, or the vLLM `VLLM_API_KEY`)
- `AI_MODEL` — e.g. `openai/gpt-5.4-mini` (must be **multimodal** to read PDFs)

Without a valid `AI_API_KEY` the app still runs, but AI features are disabled.

```bash
cp .env.example .env   # then edit AI_API_KEY
```

## Run with Docker (production-like)

```bash
docker compose up --build
# open http://localhost:8000
```

The SQLite database and uploaded CVs live on the `app-data` named volume, so they
survive `docker compose down && docker compose up`.

## Local development (hot reload)

Two terminals. The Vite dev server proxies `/api` to the backend, so there's no CORS to
configure.

```bash
# Terminal 1 — backend on :8000
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend on :5173 (proxies /api -> :8000)
cd frontend
pnpm install
pnpm dev
# open http://localhost:5173
```

For a production-like local run from source (single origin), build the SPA into the
backend and run only uvicorn:

```bash
cd frontend && pnpm build      # outputs to ../backend/static
cd ../backend && uv run uvicorn app.main:app --port 8000
# open http://localhost:8000
```

## Project layout

```
backend/    FastAPI app (app/), models, routers, ai/, scraping, storage
frontend/   Vite + React SPA (src/routes, src/components, src/i18n, src/lib)
Dockerfile  3-stage build -> single image serving API + SPA
docker-compose.yml
```

## API

Interactive docs at `/docs` when the backend is running. Key endpoints (all under
`/api`): `positions` (CRUD + `/{id}/generate`), `positions/{id}/candidates`,
`candidates/{id}` (+ `/sheet`, `/cv`, `/extract`, `/summary/generate`),
`candidates/{id}/interview` (+ `/summary/generate`), and `health`.

## Notes

- SQLite runs with a **single** uvicorn worker (avoids write-lock contention) + WAL.
- The AI extraction step proposes identifiers for review; it never auto-overwrites saved
  fields, and `isikukood` is validated as exactly 11 digits server- and client-side.
- `.env` is git-ignored and excluded from the Docker image — pass secrets at runtime.
