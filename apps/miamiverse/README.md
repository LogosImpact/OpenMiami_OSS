# MiamiVerse — front-end stub

A small, intentionally throwaway Vite + React + TypeScript app that exercises the OpenMiami_OSS backend end-to-end. It is mobile-first (base styles target ≤ 420px), shows search results with health-score badges, supports the multi-verse switcher and four UI languages (EN / HT / ES / FR), and includes a BYOK MiaGPT chat that mirrors the pattern used by the live demo at https://impact-lab-miami.vercel.app/.

> **Status:** stub for community feedback. The production MiamiVerse lives at https://impact-lab-miami.vercel.app/. When access to `grantkurz/impact-lab-backend` is granted, the production source replaces this directory — see [`IMPORTING.md`](./IMPORTING.md) for the swap procedure.

## Run locally

From the repo root:

```bash
cp .env.example .env       # set VITE_API_BASE if your API isn't on :3000
docker compose up -d db    # Postgres + PostGIS, auto-seeded
npm install                # workspace install
cd api && vercel dev       # or whatever runs the api/ routes locally
cd apps/miamiverse && npm run dev
```

Open http://localhost:5173. The chat view will prompt you to paste an Anthropic API key — it lives only in React state, never in `localStorage` (project policy and ESLint rule).

## Deploy

Vercel preview deploys are configured via `vercel.json` + the LogosImpact org's GitHub integration. Every push to `claude/consolidate-openmiami-oss-3xe1u` (or any other branch) gets a unique preview URL on Vercel automatically — no GitHub Action is needed. First-time setup: `vercel link` from this directory; set `VITE_API_BASE` in the Vercel project settings (pointing at wherever the API is deployed).

## What it exercises

- `GET /resources` with `q`, `category`, `language`, and `verse` filters.
- `GET /resources/:id` for the detail view.
- `POST /suggest` with the localized thank-you copy from `packages/languages/<lang>.json`.
- `POST /chat` with BYOK streaming, surfacing the `tool_use` → `tool_result` agent loop visually.
- The health-score column (`green ≥ 75`, `amber 50–74`, `red < 50`).
- The verse rollup query (`?verse=miamiverse` returns OpenMiami + LHRT children too).

## What it deliberately omits

- Map view (PostGIS proximity ranking is filed as `Next` on ROADMAP).
- Persistent state (no `localStorage`).
- Auth — no moderator surfaces here.
- Polished design — this is a feedback-driver, not a product.
