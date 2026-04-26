# MiamiVerse — frontend (placeholder)

This directory is the consolidation target for the **MiamiVerse** hackathon repo. At this point in the OSS consolidation, no source has been imported here yet — see `HISTORY.md`.

## Import steps (once a source repo is identified)

1. Copy the production source into this directory **without** copying any of the following:
   - `.git/`
   - `.env*`
   - `node_modules/`
   - any vendored secrets, deploy keys, or hosted credentials
2. Update `package.json`:
   - `"name": "@openmiami/miamiverse"`
   - Move shared dependencies (`@openmiami/miagpt`, `@openmiami/languages`) to relative workspace deps.
3. Wire the API base URL through an env var (`NEXT_PUBLIC_API_BASE` / `VITE_API_BASE`). Default to `https://api.openmiami.org`.
4. Replace any hard-coded English strings with lookups against `@openmiami/languages` (see `docs/language-pack-guide.md`).
5. Confirm there is **no `localStorage` usage** — React state only, per project policy.
6. Add a top-level `README.md` (replacing this file) with: dev quickstart, env vars, deploy target (Vercel).

## Deploy target

Vercel — `miamiverse.world`.
