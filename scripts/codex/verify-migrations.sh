#!/usr/bin/env bash
set -euo pipefail

DB_URL="${SUPABASE_MIGRATION_DB_URL:-${MIGRATION_DATABASE_URL:-}}"

if [[ -z "$DB_URL" ]]; then
  echo "==> Migration check skipped (SUPABASE_MIGRATION_DB_URL not set)"
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "==> Migration check skipped (psql not available)"
  exit 0
fi

echo "==> Applying Supabase migrations to verify SQL"

for migration in $(ls supabase/migrations/*.sql | sort); do
  echo "--> ${migration}"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "==> Migration check complete ✅"
