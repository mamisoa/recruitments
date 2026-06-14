# Recruitments — AI-assisted interview workflow

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

A single-container web app that guides a recruiter through a fluid, step-by-step
interview workflow, with AI assistance at every stage. Navigation follows a
**cascade** — Company → Positions → Candidates — driven by a persistent left sidebar:

1. **Company** — a single, shared **company entity** (`/company`): paste a company URL
   and the backend scrapes it to generate an editable company presentation. Defined once
   and reused by every position (no longer duplicated per position).
2. **Position & job** — paste a job description (URL or text); the backend scrapes it and
   generates an editable job presentation. A position also carries free-form, manually
   edited **selection criteria**. A *position* is reusable across many candidates.
3. **Candidate** — capture identity (nom, prénom, ddn, email, téléphone, isikukood,
   statut marital/étudiant) and upload one or more PDF/TXT CVs. The AI can read the CVs
   to **propose** identifiers (you accept/reject — it never silently overwrites) and to
   generate an editable profile summary.
4. **Interview sheet** — the final fiche: company + job context, key candidate facts
   (incl. computed age, marital & student status) with a deep-link back to edit the
   candidate, four 0–10 scored criteria (language fluency, professionalism, skills,
   foreign languages) each with a note, plus an unlimited number of **custom
   evaluations** (title + 0–10 slider + note). Free "candidate expectations" and
   "candidate specifics" fields, and a regenerable AI interview summary that assesses the
   candidate against the position's selection criteria and ends with a go / no-go
   recommendation.

Everything is persisted to SQLite. Every AI-generated text is editable (markdown, with a
preview/edit toggle and modal editor) and can be regenerated. The AI summary is written in
the active UI language. The UI is available in **FR, EN, ET (Estonian), DE (German) and
NL (Dutch)** — switcher at the bottom of the sidebar.

## Stack

- **Backend**: FastAPI + SQLModel (SQLite, WAL) + Pydantic AI against any
  OpenAI-compatible `/v1` endpoint (OpenRouter, OpenAI, or a self-hosted vLLM), served by
  uvicorn. URL scraping with httpx + trafilatura.
- **Frontend**: pnpm + Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui
  (Base UI), TanStack Query, react-hook-form + zod, react-router, react-i18next.
  Markdown rendering via react-markdown + remark-gfm.
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

## Demo / Example mode (for screenshots & blog material)

A separate, **fully isolated** stack seeds fictional-but-realistic data — the
*Transmind AI* company, one open *Senior AI Solutions Engineer* position, and **10
international candidates** (each with a CV, interview scores, notes and an AI-style
summary). Free-text fields rotate through the five UI languages (ET, NL, DE, FR, EN),
so the dashboard naturally showcases the multilingual workflow. Use the app exactly as
you would in production.

```bash
docker compose -f docker-compose.demo.yml up --build
# open http://localhost:8010
```

It runs **alongside** the real app and never touches it: distinct Docker project
(`recruitments-demo`), distinct volume (`demo-data` ≠ `app-data`), distinct port
(8010 ≠ 8000), and a `SEED_DEMO=1` flag that *only* exists in the demo compose. The
seed is opt-in and idempotent — it only populates an empty database, so restarts never
duplicate data. To wipe and regenerate the demo data from scratch:

```bash
docker compose -f docker-compose.demo.yml down -v   # -v drops the demo-data volume
docker compose -f docker-compose.demo.yml up --build
```

No `.env`/AI key is required (the content is pre-filled). If a `.env` with a valid
`AI_API_KEY` is present, the "generate" buttons also work live during the demo.

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
backend/    FastAPI app (app/): models/ (one module per entity), routers/, ai/,
            scraping, storage
frontend/   Vite + React SPA (src/routes, src/components, src/i18n, src/lib)
Dockerfile  3-stage build -> single image serving API + SPA
docker-compose.yml
```

Code is organized one concern per file (no application file exceeds ~300 lines). Page
state/logic lives in dedicated hooks (`useCompanyForm`, `usePositionForm`,
`useCandidateForm`, `useInterviewForm`) with UI split into focused cards; backend models
are a package with one module per entity (`common`, `company`, `position`, `candidate`,
`cv`, `interview`, `aggregates`), fully re-exported from `__init__.py`.

## API

Interactive docs at `/docs` when the backend is running. Key endpoints (all under
`/api`):

- `company` — `GET` / `PUT` / `POST /generate` (the shared singleton company entity)
- `positions` — CRUD + `POST /{id}/generate`, `GET /{id}/candidates`
- `candidates/{id}` — `GET` / `PUT` / `DELETE`, `/sheet`, `/cv` (+ `DELETE /cv/{cv_id}`),
  `/extract`, `/summary/generate`
- `candidates/{id}/interview` — `PUT`, `/summary/generate` (accepts a `lang` param),
  `/summary/prompt` (read-only: reconstructs the exact prompt for the next regenerate)
- `health`

The root `/` redirects to `/company`.

## Notes

- SQLite runs with a **single** uvicorn worker (avoids write-lock contention) + WAL.
  Light additive migrations run at startup to add new columns (`selection_criteria`,
  `specificites_candidat`, `custom_evaluations`, …) to existing databases without
  recreation.
- The AI extraction step proposes identifiers for review; it never auto-overwrites saved
  fields, and `isikukood` is validated as exactly 11 digits server- and client-side.
- The AI interview summary is generated in the active UI language and, when the position
  defines selection criteria, evaluates the candidate criterion by criterion before a
  nuanced go / no-go recommendation.
- `.env` is git-ignored and excluded from the Docker image — pass secrets at runtime.
```
## License

Licensed under the [Apache License 2.0](LICENSE).
