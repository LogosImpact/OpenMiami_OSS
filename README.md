# OpenMiami_OSS

**Open civic technology for Miami — multilingual from day one.**

OpenMiami_OSS is the consolidated home for the OpenMiami / MiamiVerse stack: a moderated directory of civic resources, a multilingual chat assistant (MiaGPT), and the front ends that consume both. It is operated under the [LogosImpact](https://github.com/LogosImpact) GitHub organization.

> _Status: scaffolding. The backend, API, MiaGPT package, and language packs are in place. The two front-end apps (`apps/miamiverse`, `apps/lhrt-finder`) are placeholders awaiting consolidation from their original hackathon repos._

## What's here

| Path                  | What it is                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| `api/`                | Vercel-style serverless functions for `api.openmiami.org`.                  |
| `db/schema.sql`       | Supabase Postgres + PostGIS schema (RLS, audit log).                        |
| `db/seed.sql`         | 30 starter resources with verified `source_url` provenance.                 |
| `packages/miagpt/`    | Claude wrapper + multilingual system prompts (EN / HT / ES / FR).           |
| `packages/languages/` | Shared UI strings for every front end.                                      |
| `apps/miamiverse/`    | MiamiVerse front end (Vercel target).                                       |
| `apps/lhrt-finder/`   | LHRT resource finder (Netlify target).                                      |
| `docs/`               | Architecture, API contract, language pack guide.                            |

## Project principles

1. **MIT-licensed, open by default.** All code in this repo is permissively licensed.
2. **Provenance over polish.** Every published resource has a real `source_url`. We do not invent phone numbers or addresses.
3. **Multilingual from day one.** English, Kreyòl Ayisyen, Spanish, and French ship together — no "we'll add that later."
4. **Privacy first.** No PII columns in the database. No surveillance use cases. MiaGPT does not log user messages.
5. **No `localStorage`.** React state only — the front ends should not persist user state in the browser without explicit opt-in.
6. **CORS open to community front ends.** `*.netlify.app`, `*.vercel.app`, `localhost:*`, and the `miamiverse.world` family are allowed by default.

## Quickstart (developers)

```bash
# 1. Database
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql

# 2. API (Vercel-style functions)
cd api && npm install
SUPABASE_URL=... SUPABASE_ANON_KEY=... vercel dev

# 3. MiaGPT package (used inside front ends)
cd packages/miagpt && npm install
```

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api-contract.md)
- [Language pack guide](docs/language-pack-guide.md)
- [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [History](HISTORY.md)
- [Seed issues](SEED-ISSUES.md)

## License

[MIT](LICENSE) © 2026 LogosImpact and OpenMiami contributors.
