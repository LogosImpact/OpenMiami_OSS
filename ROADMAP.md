# Roadmap

## Ground-truth feedback target

The next external feedback we're solving for is from **MLHT** (Miami Little Haiti Trust) on the live demo at https://impact-lab-miami.vercel.app/ and the OpenMiami_OSS modules that complement it. Until that feedback lands, treat new scope as proposals to discuss, not commitments. The Sonnet-reasoning / Haiku-ranking split, the mobile-first contract, and BYOK chat are non-negotiable for that review — confirmed during the workshop and on Discord (Sol, 2026-05-02).

## Now (consolidation phase — this branch)

- [x] Scaffold monorepo (`api/`, `db/`, `packages/`, `apps/`, `docs/`).
- [x] Postgres + PostGIS schema with RLS and audit trigger.
- [x] 30 seeded civic resources with real source URLs.
- [x] MiaGPT package: Claude wrapper, `query_resources` tool, EN/HT/ES prompts.
- [x] Shared language packs: EN/HT/ES/FR.
- [x] Four serverless API routes (`/resources`, `/resources/:id`, `/categories`, `/suggest`) with CORS.
- [x] Documentation: architecture, API contract, language pack guide.
- [x] **Multi-CityVerse schema** — `verses` table (SustainaCities → FloridaVerse → MiamiVerse → OpenMiami / LHRT) with `verse_id` on resources.
- [x] **Link-health + ranking** — `resource_url_checks` log + `health_score` trigger + `scripts/check-links.js`.
- [x] **Privacy doc + Web3 considerations doc.**
- [x] **ESLint rule banning `localStorage` / `sessionStorage` for `apps/*`.**
- [x] **Root monorepo plumbing** — `package.json` with workspaces, `.env.example`, `.gitignore`, `docker-compose.yml`, dev-bootstrap script.
- [x] **Neon-compatible DB shim** — `api/_lib/db.js` runs against Supabase (primary) or Neon (alternative).
- [x] **Mobile-first front-end stub** — `apps/miamiverse/` Vite + React app with verse switcher, health-score badges, BYOK chat.
- [x] **`/chat` SSE route + tool-loop** — server-side `query_resources` execution; Sonnet for reasoning, Haiku for ranking.
- [x] **CI workflows** — `ci.yml` (schema apply + lint + tests) and nightly `check-links.yml`.
- [x] **Handoff doc** — `docs/handoff.md` for the impact-lab-backend consolidation conversation.
- [ ] Import `grantkurz/impact-lab-backend` once access is granted.
- [ ] Import `arevlo/impact-lab` once access is granted (currently private).

## Next (data + product MVP)

- [ ] Geocode every seeded resource (verified street address → `location` point).
- [ ] Reach 100 verified resources covering 33127 / 33137 / 33138.
- [ ] Server-side proximity ranking on `/resources?zipcode=…` using PostGIS.
- [ ] Moderator console for the suggestion queue.
- [ ] `apps/miamiverse` consuming the API end-to-end (search, detail, suggest).
- [ ] `apps/lhrt-finder` consuming the API with Kreyòl as default UI.
- [ ] MiaGPT chat integrated into MiamiVerse with streaming + tool execution.
- [ ] Run `scripts/check-links.js` on a schedule (GitHub Action / Supabase Edge Function).
- [ ] Surface health-score-based UI (visually flag stale / broken resources).

## Later (hardening + reach)

- [ ] Application-layer rate limits on `POST /suggest`.
- [ ] Spam / abuse triage on the suggestion queue.
- [ ] Snapshots: nightly export of `resources` to `db/exports/` for redundancy.
- [ ] Full-text search via `to_tsvector` + a `resources_search` materialized view.
- [ ] Open-data CSV download endpoint.
- [ ] Mobile-friendly LHRT Finder PWA.
- [ ] Add Brazilian Portuguese (`pt-br`) and possibly Mandarin / Russian per community demand.
- [ ] **Spin up FloridaVerse** as the first sibling CityVerse; validate the multi-verse rollup queries.
- [ ] **Stand up the freemium tier** — hosted community instances for verified non-profits and cities.

## Eventually

- [ ] Federate with neighboring civic directories (Broward, Palm Beach) under FloridaVerse.
- [ ] Public dashboards: counts by category, gaps in coverage, 311 resolution times.
- [ ] **dApp store / module marketplace** — licensing terms for civic-tech modules. See `docs/web3-considerations.md`.
- [ ] **Community data coop** — opt-in Ocean Protocol / dClimate plumbing for community-owned aggregate datasets. Strictly aggregate / anonymized; never PII.
- [ ] **Provenance anchoring** — optional public-chain anchor for moderator events and grant releases.
- [ ] Reseller / distributor partnership templates for partners who want to bundle OpenMiami modules into their own products.

## Hosting decision

- **Default:** Vercel for everything (`api.openmiami.org`, `apps/miamiverse`). Cheap, fast, easy, secure-enough for public-benefit data we're already happy to disclose.
- **Higher-sensitivity components** (moderator console, audit log queries, anything touching the suggestion queue) may need a hardened host (a Supabase project with stricter network rules, or a dedicated VPC). Decide before any moderator-only surface ships.
- **Web3 modules**, when/if they ship, are deployed independently — they never block the base stack.
