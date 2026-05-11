#!/usr/bin/env bash
# Reset local Postgres+PostGIS and re-apply schema + seed.
# Run from repo root: `npm run db:reset` or `bash scripts/dev-bootstrap.sh`.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Stopping any running db container and removing its volume…"
docker compose down -v

echo "==> Starting fresh db container (schema + seed run automatically)…"
docker compose up -d db

echo "==> Waiting for Postgres to accept connections…"
ATTEMPTS=0
until docker compose exec -T db pg_isready -U openmiami -d openmiami >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -gt 60 ]; then
    echo "Postgres did not become ready after 60s. Check: docker compose logs db"
    exit 1
  fi
  sleep 1
done

echo "==> Verifying seed (counts):"
docker compose exec -T db psql -U openmiami -d openmiami -c \
  "select count(*) as resources, (select count(*) from verses) as verses from public.resources;"

echo "==> Done. Connect with: psql postgres://openmiami:openmiami@localhost:5432/openmiami"
