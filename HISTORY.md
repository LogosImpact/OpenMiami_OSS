# History

A running, dated log of consolidation moves and decisions. New entries on top.

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
