# Roadmap

## Now (consolidation phase — this branch)

- [x] Scaffold monorepo (`api/`, `db/`, `packages/`, `apps/`, `docs/`).
- [x] Postgres + PostGIS schema with RLS and audit trigger.
- [x] 30 seeded civic resources with real source URLs.
- [x] MiaGPT package: Claude wrapper, `query_resources` tool, EN/HT/ES prompts.
- [x] Shared language packs: EN/HT/ES/FR.
- [x] Four serverless API routes (`/resources`, `/resources/:id`, `/categories`, `/suggest`) with CORS.
- [x] Documentation: architecture, API contract, language pack guide.
- [ ] Import MiamiVerse hackathon source into `apps/miamiverse/`.
- [ ] Import LHRT Finder hackathon source into `apps/lhrt-finder/`.

## Next (data + product MVP)

- [ ] Geocode every seeded resource (verified street address → `location` point).
- [ ] Reach 100 verified resources covering 33127 / 33137 / 33138.
- [ ] Server-side proximity ranking on `/resources?zipcode=…` using PostGIS.
- [ ] Moderator console for the suggestion queue (Supabase Studio + role).
- [ ] `apps/miamiverse` consuming the API end-to-end (search, detail, suggest).
- [ ] `apps/lhrt-finder` consuming the API with Kreyòl as the default UI language.
- [ ] MiaGPT chat integrated into MiamiVerse with streaming + tool execution.

## Later (hardening + reach)

- [ ] Application-layer rate limits on `POST /suggest`.
- [ ] Spam / abuse triage on the suggestion queue.
- [ ] Snapshots: nightly export of `resources` to `db/exports/` for redundancy.
- [ ] Full-text search via `to_tsvector` + a `resources_search` materialized view.
- [ ] Open-data CSV download endpoint.
- [ ] Mobile-friendly LHRT Finder PWA.
- [ ] Add Brazilian Portuguese (`pt-br`) and possibly Mandarin / Russian per community demand.

## Eventually

- [ ] Federate with neighboring civic directories (Broward, Palm Beach).
- [ ] Resource health score (auto-detect dead URLs, request re-verification).
- [ ] Public dashboards: counts by category, gaps in coverage, resolution times for 311 referrals.
