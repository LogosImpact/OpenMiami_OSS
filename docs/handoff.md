# Handoff — OpenMiami_OSS ↔ `grantkurz/impact-lab-backend`

A menu of what each repo has that the other could borrow. Written as a starting point for a future consolidation pass, not as a merge plan.

> **Status:** OpenMiami_OSS and `grantkurz/impact-lab-backend` are tracking parallel for now. Per Sol (Discord, 2026-04-29): *"let's jam on that Claude project you started for now but we'll figure it out."* When Grant returns from India and grants access, this doc becomes the agenda for the consolidation meeting.

## Live stack snapshot (as of 2026-05-11)

| What                | Where                                                 |
| ------------------- | ----------------------------------------------------- |
| Demo URL            | https://impact-lab-miami.vercel.app/                  |
| Backend repo        | https://github.com/grantkurz/impact-lab-backend (private) |
| Frontend repo       | https://github.com/arevlo/impact-lab/ (Sol's; private) |
| DB                  | Neon (Postgres)                                       |
| API + frontend host | Vercel                                                |
| Chat models         | Sonnet (reasoning) + Haiku (ranking), BYOK            |
| Other channels      | WhatsApp wiring in flight, not yet merged             |
| Mobile-first?       | Yes — locked in at the workshop                       |

## What `impact-lab-backend` could borrow from OpenMiami_OSS

| Asset                                                | Path                                          | Why                                                                     |
| ---------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `verses` table + `verse_descendants()`               | `db/schema.sql`                               | Lets one DB serve OpenMiami, LHRT, MiamiVerse, FloridaVerse, Broward... |
| Link-health: `resource_url_checks`, `compute_resource_health()`, `health_score` trigger | `db/schema.sql`, `scripts/check-links.js` | Catches dead source URLs before residents do. 0..100 score for UI.    |
| Audit log: `resources_audit` + `tg_resources_audit()` | `db/schema.sql`                               | Moderator accountability. Free with the trigger.                        |
| Language packs (EN/HT/ES/FR)                         | `packages/languages/*.json`                   | Shared multilingual UI strings, ready to drop into any front end.       |
| MiaGPT system prompts (EN/HT/ES)                     | `packages/miagpt/prompts/*.md`                | Tested civic-assistant prompts with privacy guardrails baked in.        |
| Privacy posture                                      | `docs/privacy.md`                             | Threat model + freemium-tier framing for resident-facing services.      |
| Web3 framing                                         | `docs/web3-considerations.md`                 | Where it helps (data co-ops, provenance) vs where it adds friction.     |
| `no-localStorage` ESLint rule                        | `.eslintrc.json`                              | Enforces the project policy automatically.                              |
| Mobile-first stub                                    | `apps/miamiverse/`                            | A small reference for the verse-switcher, health badges, BYOK chat.     |
| Neon-compatible DB shim                              | `api/_lib/db.js`                              | Same routes work against Supabase or Neon; useful for the merge.        |
| Dual-mode `/chat` SSE route                          | `api/chat/index.js`                           | Server-side tool-loop for `query_resources`, BYOK pattern.              |

## What OpenMiami_OSS could borrow from `impact-lab-backend`

> _Drafted from Discord; verify on access._

| Asset                              | Why                                                                  |
| ---------------------------------- | -------------------------------------------------------------------- |
| Canonical Neon migration(s)        | Confirm column naming and avoid divergence (`resource` vs `resources`, etc.). |
| Production chat ranking            | Whatever Sol has tuned in the live demo. Replace our heuristic if better. |
| WhatsApp channel wiring            | The unmerged feature Sol mentioned. Multi-channel from day one beats web-only. |
| Vercel deploy ergonomics           | Whatever's set up for the live preview, including BYOK chat UI patterns. |

## Open coordination items

- **Canonical schema owner.** If we converge, whose schema is the source of truth? The OpenMiami_OSS schema added `verses`, link-health, and audit; Grant's has WhatsApp and the deployed Neon state. A merge probably means: take OpenMiami's tables as additive migrations on top of Grant's.
- **Terminology.** Discord says **LHRF** ("Little Haiti Revitalization Fund"?), this repo says **LHRT** ("Little Haiti Revitalization Trust"). The Trust is the body; the Fund is one program. The OSS schema, seed, and prompts will stay on **LHRT** until the team picks a canonical name; switching is a one-row update against `public.verses`.
- **Mobile-first as a hard contract.** Sol locked this in at the workshop. Any UI work in OpenMiami_OSS must clear the 320px-width test before merging.
- **Models.** OSS now defaults to `claude-sonnet-4-6` for reasoning and `claude-haiku-4-5-20251001` for ranking, matching the live demo. Both are overridable.
- **`verses` table — land before or after MLHT feedback?** MLHT is the next-feedback target. If MLHT pushes for "show me just my neighborhood," the verses table earns its keep; if not, fold it into a later FloridaVerse expansion.

## Who's where (Discord, May 2026)

- **Grant Kurz** (`@grantkurz`) — backend; on travel to India through ~mid-May. Owns repo access on his side.
- **Sol Ar** (`@sol_ar`) — frontend lead; pushed the Neon DB and the Vercel preview; coordinator of the LogosImpact GitHub org.
- **Carlos / Silvio** (`@MiamiSilvio`) — Logos Capital; Saturday 2–5pm ET sync ask outstanding.
- **Mina** (`@marshmallow_mina`) — accepted Claude/GitHub invite, wrapping up semester, willing to build LHRF/LHRT portal tasks.
- **Ather** (`@ather.techie`) — chiming in on the channel.

## Path forward (suggested order, none of this is committed)

1. Get sandbox access to `grantkurz/impact-lab-backend` (Grant to invite).
2. Diff Neon migrations vs `OpenMiami_OSS/db/schema.sql`. File the additive migration set.
3. Decide on a single repo for the next deploy (lean: Grant's, since it has the live Vercel + Neon).
4. Pull the OSS modules — verses, link-health, audit, language packs, MiaGPT, privacy docs — into that repo as a single PR.
5. Run the mobile-first acceptance test on every primary view at 320px width.
6. Share with MLHT for feedback before any further expansion.
