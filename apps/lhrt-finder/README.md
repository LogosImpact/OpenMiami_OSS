# LHRT Finder — frontend (placeholder)

This directory is the consolidation target for the **LHRT Finder** hackathon repo (the Netlify-targeted resource finder for the Little Haiti Revitalization Trust). At this point in the OSS consolidation, no source has been imported here yet — see `HISTORY.md`.

## Import steps (once a source repo is identified)

1. Copy the production source in **without** `.git/`, `.env*`, `node_modules/`, or vendored credentials.
2. Update `package.json`:
   - `"name": "@openmiami/lhrt-finder"`
   - Move `@openmiami/miagpt`, `@openmiami/languages` to workspace deps.
3. Set the API base via env (`VITE_API_BASE` or framework equivalent). Default to `https://api.openmiami.org`.
4. Replace hard-coded copy with `@openmiami/languages` lookups. Default the UI to **Kreyòl** (`ht`); fall back to `en` and `es` based on `navigator.language`.
5. Audit for `localStorage` — remove it. React state only, per project policy.
6. Add a top-level `README.md` (replacing this file) with: dev quickstart, env vars, deploy target (Netlify).

## Deploy target

Netlify — domain TBD by LHRT team.
