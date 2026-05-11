# Importing the production MiamiVerse front end

This file is preserved from before the round-3 stub landed. It documents the steps for replacing `apps/miamiverse` with the real production source from `grantkurz/impact-lab-backend` (or wherever the canonical front end lives) when access is granted.

The current `apps/miamiverse/` is an intentional **throwaway stub** — a small Vite + React + TypeScript app exercising the multi-CityVerse, link-health, and language-switching surfaces that the live demo at https://impact-lab-miami.vercel.app/ doesn't show yet. Drop it when the real source comes in.

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
5. Confirm there is **no `localStorage` usage** — React state only, per project policy and the ESLint rule.
6. Re-add the multi-verse switcher, health-score badges, and BYOK chat input from the stub if the production source doesn't already have them.

## Deploy target

Vercel — `miamiverse.world`. The current stub has a `vercel.json` that configures the SPA-style static build; that file should survive the import.
