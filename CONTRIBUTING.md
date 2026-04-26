# Contributing to OpenMiami_OSS

Welcome! This is civic technology built in the open. Whether you're submitting code, translations, resource data, or feedback — thank you.

## Ground rules

1. **MIT license.** By contributing, you agree your contribution is licensed under the [MIT License](LICENSE).
2. **No PII.** Do not commit personally identifying information about residents, beneficiaries, or contributors. Org-level public contact info only.
3. **Real sources, real names.** Every resource record needs a real `source_url`. Don't invent phone numbers, addresses, or organization names. If you don't know, leave the field empty.
4. **Multilingual by default.** New user-facing strings need entries in all four language packs (`en`, `ht`, `es`, `fr`). If you can't translate, mark the key with a `_TODO_<lang>` value and note it in the PR.
5. **No `localStorage`.** Use React state. Persistent state belongs in the database, behind an authenticated, audited path.
6. **No surveillance.** We do not build features that track residents, scrape protests, fingerprint browsers, or correlate identities across services. PRs that add such features will be closed.

## Workflow

1. Open or claim an issue first. We use issues to discuss scope.
2. Fork or create a feature branch under `feat/<short-name>` or `fix/<short-name>`.
3. Run the relevant checks locally (lint, schema verify, seed dry-run).
4. Open a PR against `main`. Reference the issue. Include screenshots for UI changes.
5. A maintainer will review. Two approvals required for changes touching `db/schema.sql`, `db/seed.sql`, or RLS policies.

## Adding a resource

If you're contributing data rather than code, the easiest path is `POST /suggest` against the live API. Each suggestion is reviewed by a moderator before it appears publicly.

If you'd like to bulk-add records, open an issue with the proposed CSV and a one-line provenance for each row.

## Adding a language

See [`docs/language-pack-guide.md`](docs/language-pack-guide.md). At minimum:

- Copy `packages/languages/en.json` to `<code>.json` and translate every value.
- Add a corresponding system prompt under `packages/miagpt/prompts/<code>.md` (or it falls back to English).
- Update the supported-language list in `packages/miagpt/index.js`, `packages/miagpt/tools.js`, and the API validators.

## Reporting a security issue

Please **do not** open a public issue for security concerns. Email `security@logosimpact.org` (or reach a maintainer privately) with the details. We will acknowledge within 72 hours.

## Code style

- JavaScript/TypeScript: 2-space indent, double quotes for JSX, single quotes elsewhere, semicolons on.
- SQL: lowercase keywords, snake_case identifiers.
- No emojis in source files unless they are part of localized user-facing copy.
- Comments explain *why*, not *what*. Don't narrate code that names itself.

## Maintainers

The repository is maintained by the LogosImpact OpenMiami team. Decisions are made by rough consensus; tied or contentious calls go to a maintainer vote.
