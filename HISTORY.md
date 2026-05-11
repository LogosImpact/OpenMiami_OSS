# History

A running, dated log of consolidation moves and decisions. New entries on top.

---

## 2026-05-11 — Round 3: complementary track to the live `impact-lab` stack

### Context from Discord (#backend, #general — late April / early May 2026)

The OpenMiami_OSS branch was working in parallel with `grantkurz/impact-lab-backend` (Grant Kurz, private) and `arevlo/impact-lab` (Sol Ar, private). The team — Grant, Sol, Mina (`@marshmallow_mina`), Silvio (`@MiamiSilvio` / Logos Capital), and ather.techie — has:

- A working production-style demo deployed at **https://impact-lab-miami.vercel.app/**.
- Postgres pushed to **Neon** (not Supabase).
- **BYOK chat** — users paste their own Anthropic key.
- **Model split**: Sonnet for reasoning, Haiku for ranking (cost-conscious, Sol's call).
- **Mobile-first** locked in as a hard requirement at the workshop.
- **WhatsApp channel** wiring in flight, not yet merged.
- A planned MLHT feedback session as the next ground-truth target.

Grant traveled to India before he could move the backend repo into the LogosImpact GitHub org. Sol's words on the channel: *"let's jam on that Claude project you started for now but we'll figure it out."*

### Goal this round

Make OpenMiami_OSS a **menu of borrowable modules** for Grant's stack, not a competitor. Plus a small clickable surface that exercises what the live demo doesn't show yet — multi-verse, link-health, language switching beyond EN, Sonnet/Haiku model split.

### What landed

- **Monorepo plumbing** — root `package.json` with workspaces, `.env.example`, `.gitignore`, `docker-compose.yml` (postgis/postgis:16-3.4, auto-seeded), `scripts/dev-bootstrap.sh`.
- **Neon-compatible DB shim** — `api/_lib/db.js` exposes `listResources`, `getResource`, `categoryCounts`, `insertSuggestion` over either `@supabase/supabase-js` (primary; RLS as defense-in-depth) or `pg.Pool` (alternative; aligns with Grant's Neon). Mode auto-detected from env. All four existing routes migrated.
- **Mobile-first front-end stub** — `apps/miamiverse/` Vite + React + TypeScript SPA. Search / Detail / Suggest / Chat views. Verse switcher (all / miamiverse / openmiami / lhrt). Health-score badges (green ≥ 75 / amber 50–74 / red < 50). Language switcher (EN/HT/ES/FR). BYOK chat input (React state only — no `localStorage`, per ESLint rule). Vercel preview deploys via `vercel.json` + native GitHub integration.
- **`POST /chat`** — SSE route with server-side tool-loop. When MiaGPT emits `tool_use` for `query_resources`, the route calls `listResources` directly and feeds the result back as a `tool_result` block, looping until done. BYOK key from request body, never persisted.
- **MiaGPT model split** — `createMiaGPT()` now takes `rankerModel` (default `claude-haiku-4-5-20251001`); reasoning stays on `claude-sonnet-4-6`. New `mia.rank({ candidates, intent, lang })` helper for Haiku re-ranking. `packages/miagpt/README.md` documents the pattern.
- **Example transcripts** — `examples/miagpt-transcripts/{en-housing,ht-food}.md` so reviewers see what a working answer looks like without burning an API key.
- **CI** — `.github/workflows/ci.yml` (schema apply against a Postgres+PostGIS service container, lint, `node --test`). `.github/workflows/check-links.yml` (nightly cron + manual dispatch).
- **Smoke tests** — `api/__tests__/resources.test.js` (CORS + validation unconditionally; happy-path + verse rollup when a DB is configured). `packages/miagpt/__tests__/load-prompts.test.js` (prompt loader + supportedLanguages).
- **Docs** — `docs/quickstart.md` (10-minute path), `docs/handoff.md` (the round's strategic artifact: what each repo could borrow from the other, who's who, coordination items). `docs/architecture.md` rewritten to cover Supabase vs Neon mode, BYOK chat, WhatsApp track, and the new repo layout. `docs/api-contract.md` extended with `?verse=` and `POST /chat`.
- **Maintainer block** — `CONTRIBUTING.md` lists Grant, Sol, Silvio, Mina, ather.techie by GitHub handle only (no personal contact info; LogosImpact org for coordination).
- **MLHT feedback target** — called out at the top of `ROADMAP.md` as the next ground-truth.

### Decisions confirmed

- **Backend posture**: Supabase-primary with a Neon-compatible shim. RLS stays the primary guardrail; the API layer enforces the same constraints in Neon mode. (User picked this over flipping primary to Neon.)
- **Stub deploys**: Vercel preview URLs on every push via the native GitHub integration. `apps/miamiverse/vercel.json` checked in; no custom Action.
- **Models**: Sonnet for reasoning + Haiku for ranking, matching the live demo. Both overridable.
- **No consolidation merge yet** — wait for Grant's repo access.

### Decisions worth re-litigating

- **`/chat` runs the tool-loop server-side, not client-side.** Trade-off: the API does an internal DB call rather than the client doing two HTTP hops. Cleaner UX, hides the key, but the API now needs to scale chat traffic. Revisit if cost or throughput becomes a problem.
- **Stub vs. production front end.** The live demo at impact-lab-miami.vercel.app is the canonical user-facing surface. The stub in `apps/miamiverse/` is intentionally throwaway — it exercises verse / health / multilingual / BYOK end-to-end so reviewers can see them work, but it's not the deploy target. `IMPORTING.md` documents the swap procedure for when access is granted.
- **LHRF vs LHRT.** Discord uses LHRF (Fund); this repo uses LHRT (Trust). The OSS schema, seed, and prompts stay on LHRT until the team picks a canonical name — swapping is a one-row update against `public.verses`. Documented in `docs/handoff.md` and `docs/architecture.md`.
- **MAX_TURNS=4 in `/chat`.** Caps the server-side tool-loop. Enough for one `query_resources` → answer cycle plus a refinement turn. Bump if real users hit it.

### What's still **not** done

- No actual import of `grantkurz/impact-lab-backend` or `arevlo/impact-lab` (both private; access pending Grant's return from India).
- No moderator console.
- No WhatsApp wiring on this side (Grant's track; we acknowledge it in architecture).
- No geocoding of seed `location` columns.
- No PostGIS proximity ranking on `/resources?zipcode=…`.

### Coordination carryovers

- Saturday 2–5pm ET sync request from Silvio — outstanding; coordination only.
- When Grant grants repo access, schedule a separate consolidation round using `docs/handoff.md` as the agenda.

---

## 2026-04-27 — Round 2: multi-verse schema, link-health, privacy, Web3 framing

### Source-repo access

`arevlo/impact-lab` was supplied as one of the hackathon repos to consolidate. In this consolidation sandbox both `WebFetch` and `git clone https://github.com/arevlo/impact-lab.git` failed — the URL returned 404 over the public web and the git clone had no credentials configured. The repo is either private or has been moved/renamed. The consolidation of `apps/*` from impact-lab is therefore deferred to the next session, once one of the following is true:

- The repo is made public, or
- The sandbox is provisioned with a `GH_TOKEN` that has read access, or
- The source is supplied as a tarball / zip uploaded into this workspace.

The second hackathon repo (Grant has it; pinged on Discord) is also still pending.

### What landed in this round

- **`db/schema.sql`** extended with:
  - `verses` table (kinds: `platform | state | metro | neighborhood | theme`) modeling the SustainaCities → FloridaVerse → MiamiVerse → OpenMiami / LHRT hierarchy with optional `scope_geom`. RLS public-read.
  - `verse_id` column on `resources` (nullable; tightened later if/when every row is required to belong to a verse).
  - `verse_descendants(root_slug)` recursive helper for rollup queries.
  - `resource_url_checks` append-only log + `url_status_*` cached columns on `resources`.
  - `compute_resource_health()` + `tg_resources_health_score` trigger — a 0..100 ranking computed from `verified_at` recency, link health, and completeness.
  - `health_score`, `verse_id`, and `url_status` indexes.
- **`db/seed.sql`** seeds the five starter verses and routes every existing resource to the right one (`lhrt`, `openmiami`, or `miamiverse`).
- **`scripts/check-links.js`** — runnable Node script that walks every resource, performs a HEAD/GET, logs to `resource_url_checks`, and updates the cached link-status columns. The health-score trigger then recomputes downstream.
- **`docs/privacy.md`** — the public privacy posture: no PII, RLS boundaries, MiaGPT promises, threat model, freemium tiers (Open source / Hosted community / Hosted partner / Reseller).
- **`docs/web3-considerations.md`** — when Web3 helps (community data coops via Ocean / dClimate, provenance anchoring, the dApp store) vs when it doesn't (resident UX, PII, pay-to-access). Sets the ground rule that Web3 is opt-in and never required.
- **`.eslintrc.json`** — bans `localStorage` / `sessionStorage` in `apps/*`. Permitted in `scripts/` and `api/` (Node).
- **`ROADMAP.md`** updated to reflect multi-verse, link-health, freemium hosting, and the Web3 / dApp-store track.

### Decisions worth re-litigating

- **Verse hierarchy** is modeled as a tree with `parent_id` rather than path-based. Rollup queries use the `verse_descendants` recursive helper. If we expand to thousands of cities, revisit with `ltree`.
- **Health-score formula** in `compute_resource_health()` is heuristic and tunable. Don't take the numbers as canon — refine after we've seen real link-check data for a few weeks.
- **`resources.verse_id` is nullable** for now to keep the migration trivial. Once front ends always pass a verse, flip to `not null` and backfill.
- **Hosting:** lean Vercel for the public-benefit surface; reserve a hardened host for moderator-only surfaces. Web3 modules deploy independently.
- **No Web3 in MVP.** Documented in `docs/web3-considerations.md`. Open question: does the dApp-store track need a token? Defer to legal review before any token issuance.

### What's still **not** done

- No actual import of the impact-lab source (see access note above).
- No moderator console.
- No CI to run `scripts/check-links.js` on a schedule.
- No FloridaVerse front end. The schema supports it; the UX doesn't.

---

## 2026-04-26 — Initial consolidation pass (branch `claude/consolidate-openmiami-oss-3xe1u`)

### Repo audit

The `LogosImpact/OpenMiami_OSS` repo was empty save for a stub `README.md` ("OpenMiami Collabothon"). The instructions referenced "2-3 additional hackathon repos under contributor personal accounts" but **no URLs were provided to this consolidation session**. As a result, the cleanest-history audit and the actual import of MiamiVerse and LHRT Finder source code were **deferred**.

What this pass *did* establish:

- A clean monorepo layout that the imported sources will drop into without restructuring.
- A canonical backend (`db/schema.sql`, `db/seed.sql`, `api/`) the front ends can integrate against immediately.
- A shared `packages/miagpt` and `packages/languages` so both apps inherit the same multilingual surface.
- Placeholder READMEs in `apps/miamiverse/` and `apps/lhrt-finder/` with explicit import checklists (no `.git`, no `.env`, no vendored secrets, no `localStorage`).

### Conflicts and gaps

| Issue                                                    | Status                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| Hackathon repo URLs not supplied                         | **Blocker for `apps/`.** Filed in SEED-ISSUES as `import-miamiverse-source` and `import-lhrt-finder-source`. |
| Real street addresses / phone numbers for seed records   | Intentionally **omitted** to honor "never invent." Each seeded row has a verified org-level `source_url` and `verified_at = now()`; `contact` contains only the website. Moderators add geocoded address + phone after live verification. |
| Geocoded `location` for seed records                     | All seeded rows have `location = NULL`. Map view will not plot pins until geocoding lands (see ROADMAP). |
| Some `source_url`s point at organization homepages       | Deliberate. Deep links rot; homepages are the most stable provenance anchor. Moderators may refine to deep links during the verification pass. |
| `City of Miami Mom and Pop` source                        | Set to `https://www.miami.gov/` (homepage) rather than a deep program URL — the program URL changes per fiscal year. Refine during verification. |
| LHRT sub-program names                                    | Drawn from the public mandate of the Trust (small business, anti-displacement, cultural preservation, land strategy). Exact program titles and eligibility criteria should be verified against current LHRT board materials before going live. |

### Things explicitly **not** done in this pass

- No hosting deploys (per the instructions: "All hosting deferred — consolidate code first").
- No `gh` CLI — issue creation is via the MCP GitHub bridge.
- No `apps/*` source import — see Blocker above.
- No CI/CD setup (`.github/workflows/`) — out of scope for the consolidation pass.

### Decisions worth re-litigating

- **API style** — the `api/` folder uses Vercel-style serverless handlers (`export default function handler(req, res)`) so files work with both standalone Vercel deployments and Next.js Pages Router. If the team commits to Next.js App Router, a future pass should migrate to `app/api/*/route.ts`.
- **No `localStorage`** is currently a project rule, not a lint check. Add an ESLint rule once the front ends arrive.
- **Languages: en / ht / es / fr** — added Brazilian Portuguese as a "later" item on the roadmap because of the size of the South Florida Brazilian community.
