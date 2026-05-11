# Seed issues

Ten starter issues to bootstrap the contributor pipeline. Each is sized for one focused PR.

When opening these via the GitHub MCP, apply the labels listed for each.

---

## 1. Import MiamiVerse hackathon source into `apps/miamiverse/`

**Labels:** `consolidation`, `frontend`, `priority:high`

The `apps/miamiverse/` directory is a placeholder. Identify the canonical hackathon repo (URL TBD), then follow the import checklist in `apps/miamiverse/README.md`: copy source without `.git/`, `.env*`, `node_modules/`, or vendored secrets; rename the package to `@openmiami/miamiverse`; wire `NEXT_PUBLIC_API_BASE`; replace hard-coded copy with `@openmiami/languages`; remove any `localStorage` usage.

---

## 2. Import LHRT Finder hackathon source into `apps/lhrt-finder/`

**Labels:** `consolidation`, `frontend`, `priority:high`

Same as above, for the LHRT-side resource finder. Default UI language should be `ht` (Kreyòl), with fallback to `en`/`es` from `navigator.language`. Deploy target is Netlify.

---

## 3. Geocode all seeded resources

**Labels:** `data`, `backend`, `good first issue`

`db/seed.sql` ships with `location = NULL` for every row, by design. Write a one-shot migration (or a Node script under `scripts/`) that takes the verified street address for each seeded org and updates `location` via PostGIS `ST_GeogFromText('POINT(lon lat)')`. Address verification must be manual against each org's source_url before geocoding.

---

## 4. Add server-side proximity ranking to `GET /resources?zipcode=…`

**Labels:** `backend`, `api`, `enhancement`

`api/resources/index.js` currently accepts `?zipcode=` but returns `hint.zipcode_proximity: "not_yet_implemented_server_side"`. Implement: ZIP → centroid lookup, then PostGIS `ST_Distance(location, $1)` ORDER BY ascending. Resources with `location IS NULL` should sort last but still be returned.

---

## 5. Build moderator console for `resource_suggestions`

**Labels:** `backend`, `moderation`, `priority:medium`

Build a lightweight Supabase Studio + RLS-policy combo that lets moderators triage the suggestion queue: list pending, view detail, mark approved (and copy into `resources` with `verified_at = now()`), reject, mark duplicate. No PII is stored on the suggestions table; do not add any.

---

## 6. Add ESLint rule banning `localStorage` / `sessionStorage`

**Labels:** `tooling`, `frontend`, `good first issue`

Project policy is "no `localStorage`." Add a root `.eslintrc` with a `no-restricted-globals` rule blocking `localStorage` and `sessionStorage` for `apps/*`. Document in `CONTRIBUTING.md`.

---

## 7. Translation review for `packages/languages/ht.json`

**Labels:** `i18n`, `priority:medium`

The Kreyòl pack was drafted by a non-native speaker. Find a Kreyòl-fluent reviewer (a Sant La / LHRT collaborator is ideal) and refine wording to be natural and community-recognizable. Same review needed for `es.json` and `fr.json` — file follow-ups for those.

---

## 8. Wire MiaGPT chat into MiamiVerse with streaming + tool execution

**Labels:** `frontend`, `miagpt`, `priority:medium`

Once `apps/miamiverse/` is imported (issue #1), wire `@openmiami/miagpt` into a chat surface. Stream assistant tokens with `for await ... of mia.stream(...)`. When a `tool_use` event arrives, call `GET /resources` with the input, then send the result back as a `tool_result` content block in the next turn.

---

## 9. CSV export endpoint for verified resources

**Labels:** `backend`, `api`, `open-data`

Add `GET /resources.csv` returning the same rows as `GET /resources` but in RFC-4180 CSV. Must respect query filters. Add `text/csv` Content-Type and a `Content-Disposition: attachment; filename="openmiami_resources_<date>.csv"` header. Open data is a project value — make this easy.

---

## 10. Document privacy and threat model

**Labels:** `docs`, `security`

Write `docs/privacy.md` covering: what we store (org-level only), what we don't store (no PII, no logs of MiaGPT messages), how RLS protects the suggestion queue, what a malicious actor could and couldn't do via `POST /suggest`, and what the moderation review checks for. Cross-link from `README.md` and `CONTRIBUTING.md`.
