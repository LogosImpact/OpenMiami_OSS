# OpenMiami_OSS — Architecture

## One-paragraph version

OpenMiami_OSS is a single, MIT-licensed monorepo for the OpenMiami / MiamiVerse civic stack. A Postgres + PostGIS database (Supabase-primary; Neon-compatible via `api/_lib/db.js`) holds a moderated directory of civic resources organized into a hierarchical "verse" tree. Stateless serverless API routes expose verified resources, accept community suggestions, return categories, and stream BYOK Claude chat. Two front-end apps consume the API: **MiamiVerse** (Vercel) and **LHRT Finder** (Netlify). A shared package, **MiaGPT**, wraps Claude with multilingual system prompts (EN / HT / ES / FR), a `query_resources` tool, and a Sonnet-reasoning + Haiku-ranking split that matches the live demo at `impact-lab-miami.vercel.app`. A WhatsApp channel is in flight in `grantkurz/impact-lab-backend` and will plug into the same API surface.

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  MiamiVerse    │    │  LHRT Finder   │    │  MiaGPT (BYOK) │    │   WhatsApp     │
│   (Vercel)     │    │   (Netlify)    │    │  (web + SSE)   │    │  (in flight)   │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │                     │
        └─────────────┬───────┴────────┬────────────┴──────────┬──────────┘
                      │                │                       │
                      ▼                ▼                       ▼
            ┌──────────────────────────────────────────────────────────┐
            │   api.openmiami.org                                      │
            │   /resources, /resources/:id, /categories, /suggest,     │
            │   /chat (SSE, tool-loop)                                 │
            └────────────────────┬──────────────────────┬──────────────┘
                                 │                      │
                                 ▼                      ▼
                  ┌─────────────────────────┐   ┌────────────────────┐
                  │  Supabase (primary)     │   │  Anthropic Claude  │
                  │   OR Neon (compatible)  │   │  Sonnet (reasoning)│
                  │  Postgres + PostGIS     │   │  Haiku  (ranking)  │
                  │  verses, resources,     │   │                    │
                  │  suggestions, audit,    │   └────────────────────┘
                  │  url_checks             │
                  └─────────────────────────┘
```

## Repository layout

```
OpenMiami_OSS/
├── api/                  Vercel-style serverless functions
│   ├── _lib/             cors, db (Supabase + Neon), json helpers
│   ├── resources/        GET /resources, GET /resources/:id
│   ├── categories/       GET /categories
│   ├── suggest/          POST /suggest
│   ├── chat/             POST /chat (BYOK SSE + tool-loop)
│   └── __tests__/        node:test smoke tests
├── apps/
│   ├── miamiverse/       Vite + React mobile-first stub (verse switch, BYOK chat)
│   └── lhrt-finder/      LHRT Finder (placeholder — see IMPORTING.md)
├── db/
│   ├── schema.sql        Postgres / PostGIS schema + RLS + audit + link-health
│   └── seed.sql          30 starter records + 5-verse hierarchy
├── packages/
│   ├── miagpt/           Claude wrapper, tools, prompts; Sonnet + Haiku model split
│   └── languages/        en|ht|es|fr UI strings shared by all apps
├── scripts/
│   ├── check-links.js    Walks resources, logs link health, updates score
│   └── dev-bootstrap.sh  Resets and re-seeds local docker-compose DB
├── examples/
│   └── miagpt-transcripts/   Saved EN + HT conversations
├── docs/
│   ├── architecture.md   (this file)
│   ├── api-contract.md   request/response shapes, errors
│   ├── handoff.md        OpenMiami_OSS ↔ impact-lab-backend menu of borrowables
│   ├── quickstart.md     10-minute clone-and-run path
│   ├── language-pack-guide.md
│   ├── privacy.md
│   └── web3-considerations.md
├── .github/workflows/
│   ├── ci.yml            Schema apply + lint + tests on push/PR
│   └── check-links.yml   Nightly link health
├── docker-compose.yml    Local Postgres + PostGIS, auto-seeded
├── package.json          Root workspaces
├── .env.example          Required env vars (both modes)
├── README.md / ROADMAP.md / CONTRIBUTING.md / HISTORY.md / SEED-ISSUES.md / LICENSE
```

## Data model

- **`verses`** — hierarchical CityVerse registry. Tree (`parent_id`): `sustainacities` → `floridaverse` → `miamiverse` → {`openmiami`, `lhrt`}. Each verse can carry a PostGIS jurisdictional boundary (`scope_geom`) and a `default_languages` array. The `verse_descendants(slug)` recursive helper drives rollup queries (`/resources?verse=miamiverse` includes `openmiami` and `lhrt` children).
- **`resources`** — published, moderator-verified civic resources. Public read via RLS, only rows where `verified_at is not null`. Has a `verse_id` foreign key, a 0..100 `health_score` (trigger-computed), and a cached `url_status`.
- **`resource_suggestions`** — community submissions. Public insert via RLS; only service role can read/update (moderation queue).
- **`resources_audit`** — append-only log of every insert / update / delete to `resources`. Useful for accountability and rollback.
- **`resource_url_checks`** — append-only log written by `scripts/check-links.js`. Drives `health_score` recomputation.

PostGIS is enabled for distance queries; `resources.location` is `geography(point, 4326)` with a GiST index. Languages are stored as a `text[]` with a GIN index so `?language=ht` filters use index ops.

### Supabase mode vs Neon mode

`api/_lib/db.js` is a thin shim that exposes four high-level operations — `listResources`, `getResource`, `categoryCounts`, `insertSuggestion` — over two backends:

- **Supabase mode (primary)**: when `SUPABASE_URL` + `SUPABASE_ANON_KEY` are set. Uses `@supabase/supabase-js`. RLS policies in `db/schema.sql` act as a defense-in-depth layer; the anon key is enough for `/resources`, `/categories`, `/suggest` because the policies are tight.
- **Neon / vanilla Postgres mode (alternative)**: when only `DATABASE_URL` is set. Uses `pg.Pool`. **RLS is NOT enforced by the DB** in this mode — the API layer is the only guardrail. Both routes are already structurally safe: `listResources` and `getResource` always filter on `verified_at is not null`, and `insertSuggestion` writes only into the suggestions queue. Any new write path in Neon mode must enforce its own access control explicitly.

Mode is auto-detected at module load. Supabase wins if both sets of env vars are present. The Neon path mirrors `grantkurz/impact-lab-backend`'s deployed stack — see `docs/handoff.md`.

### BYOK chat

`POST /chat` accepts an Anthropic API key in the request body and never persists it. This mirrors the live demo's UX: residents (or contributors testing) supply their own credit so we can keep the public surface free without a back-channel cost. The route runs a server-side tool-loop: when MiaGPT emits `tool_use` for `query_resources`, the route calls `listResources` directly (no second HTTP hop), feeds the result back as a `tool_result` content block, and continues streaming. Frames are emitted as SSE (`data: {...}\n\n`).

## Privacy

- The `resources` table contains only **organization-level** contact info (website, public phone, public address). Never PII of beneficiaries.
- The `resource_suggestions` table is also org-level — but moderators are responsible for stripping any submitter PII before promoting a row.
- MiaGPT does not log user messages to disk. The prompts explicitly tell the assistant to discourage users from sharing PII.

## Hosting plan (deferred)

| Component                 | Host     | Domain                         |
| ------------------------- | -------- | ------------------------------ |
| API                       | Vercel   | api.openmiami.org              |
| MiamiVerse (stub + prod)  | Vercel   | miamiverse.world; preview URLs auto on every push |
| LHRT Finder               | Netlify  | (TBD by LHRT team)             |
| DB (primary)              | Supabase | (managed)                      |
| DB (alternative)          | Neon     | matches `impact-lab-backend`   |
| MiaGPT                    | embedded | runs on whichever app hosts; BYOK key per session |
| WhatsApp channel          | TBD      | wiring in `impact-lab-backend`, not yet merged |

CORS is open to: `miamiverse.world`, `*.miamiverse.world`, `*.netlify.app`, `*.vercel.app`, `localhost:*`. The `*.vercel.app` glob covers the live demo at `impact-lab-miami.vercel.app` and all preview deploys of the stub.

## Terminology

The Discord channel uses **LHRF** ("Little Haiti Revitalization Fund"); this repo's schema, seed, and prompts use **LHRT** ("Little Haiti Revitalization Trust"). The Trust is the City-of-Miami board; the Fund is one of its programs. Both names will appear in conversation with stakeholders. OpenMiami_OSS stays on **LHRT** until the team picks a canonical name — swapping is a one-row update against `public.verses`.
