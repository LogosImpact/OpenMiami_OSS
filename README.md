# OpenMiami_OSS

**Open civic technology for Miami — multilingual from day one.**

OpenMiami_OSS is the consolidated home for the OpenMiami / MiamiVerse stack: a moderated directory of civic resources, a multilingual chat assistant (MiaGPT), and the front ends that consume both. It is operated under the [LogosImpact](https://github.com/LogosImpact) GitHub organization.

> _Status: the backend, API (`/resources`, `/categories`, `/suggest`, `/chat`), MiaGPT package, language packs, multi-CityVerse schema, link-health, and a mobile-first stub front end are in place. A live production demo of the broader team's work runs at https://impact-lab-miami.vercel.app/ — see [`docs/handoff.md`](docs/handoff.md) for the consolidation conversation._

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
cp .env.example .env       # edit if you want to point at a real Supabase project
docker compose up -d db    # local Postgres + PostGIS, auto-seeded
npm install                # installs all workspaces
cd apps/miamiverse && npm run dev   # mobile-first stub on :5173
# In another terminal, from api/:
cd api && npx vercel dev   # API on :3000
```

See [`docs/quickstart.md`](docs/quickstart.md) for the full 10-minute path, including the chat view and link-health.

## Documentation

- [Quickstart](docs/quickstart.md)
- [Architecture](docs/architecture.md)
- [API contract](docs/api-contract.md)
- [Handoff to `impact-lab-backend`](docs/handoff.md)
- [Language pack guide](docs/language-pack-guide.md)
- [Privacy](docs/privacy.md)
- [Web3 considerations](docs/web3-considerations.md)
- [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [History](HISTORY.md)
- [Seed issues](SEED-ISSUES.md)

## License

[MIT](LICENSE) © 2026 LogosImpact and OpenMiami contributors.
