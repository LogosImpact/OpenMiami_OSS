# History

A running, dated log of consolidation moves and decisions. New entries on top.

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
