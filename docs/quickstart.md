# Quickstart

Goal: clone the repo and have a running stack — DB, API, mobile-first front end — in under 10 minutes.

## Prerequisites

- Node ≥ 18, npm ≥ 9
- Docker (for the local Postgres + PostGIS)
- Optional: an Anthropic API key for trying the chat view

## 1. Clone and install

```bash
git clone https://github.com/LogosImpact/OpenMiami_OSS.git
cd OpenMiami_OSS
cp .env.example .env
npm install
```

Edit `.env` if you want to point at a real Supabase project. For local dev you can leave it as-is — the defaults match the docker-compose Postgres.

## 2. Bring up the database

```bash
npm run db:up
```

This starts Postgres + PostGIS in Docker and auto-runs `db/schema.sql` and `db/seed.sql` on first boot. To wipe and re-seed:

```bash
npm run db:reset
```

Verify:

```bash
psql postgres://openmiami:openmiami@localhost:5432/openmiami -c \
  "select count(*) from resources;"
# → 30
```

## 3. Run the API

The API uses Vercel-style handlers under `api/`. Easiest local runner:

```bash
cd api
npx vercel dev    # or any handler-compatible runner
```

Sanity check:

```bash
curl 'http://localhost:3000/categories'
curl 'http://localhost:3000/resources?category=food&limit=5'
curl 'http://localhost:3000/resources?verse=lhrt'
```

## 4. Run the front-end stub

```bash
cd apps/miamiverse
npm run dev
```

Open http://localhost:5173. Try:

- **Search** — type "food", switch to the `LHRT` verse, switch language to HT.
- **Suggest** — submit a test row; verify it appears in `resource_suggestions`.
- **Chat** — paste an Anthropic API key (it stays in tab memory only, per policy).

## 5. Tests

```bash
npm test
```

CORS + validation tests run unconditionally. The DB-backed tests run when `DATABASE_URL` or `SUPABASE_URL+SUPABASE_ANON_KEY` is set.

## 6. Link health (optional)

```bash
npm run check-links -- --limit=10
```

Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Walks the seeded resources, fetches each `source_url`, and updates `resource_url_checks` + `health_score`.

## Troubleshooting

- **`docker compose` fails with port 5432 in use**: another Postgres is running. Stop it or change the port mapping in `docker-compose.yml`.
- **API can't reach DB**: check `DATABASE_URL` (or `SUPABASE_URL`) in `.env`; the API picks the first one set.
- **Front end says CORS blocked**: only `localhost:*`, `*.vercel.app`, `*.netlify.app`, and `miamiverse.world` are allowed. See `api/_lib/cors.js`.
- **Chat fails immediately**: confirm your Anthropic API key has credit and that `claude-sonnet-4-6` is enabled for your account.

## Next steps

- Read [`docs/architecture.md`](./architecture.md) for the data and hosting model.
- Read [`docs/handoff.md`](./handoff.md) if you're consolidating with `grantkurz/impact-lab-backend`.
- Read [`docs/api-contract.md`](./api-contract.md) for the request/response shapes.
