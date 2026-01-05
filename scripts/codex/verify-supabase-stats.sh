#!/usr/bin/env bash
set -euo pipefail

DB_URL="${SUPABASE_STATS_DB_URL:-${SUPABASE_MIGRATION_DB_URL:-${MIGRATION_DATABASE_URL:-}}}"

if [[ -z "$DB_URL" ]]; then
  echo "==> Supabase stats check skipped (SUPABASE_STATS_DB_URL not set)"
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "==> Supabase stats check skipped (psql not available)"
  exit 0
fi

echo "==> Ensuring pg_stat_statements extension is available"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "create extension if not exists pg_stat_statements;"

echo "==> Top pg_stat_statements by total execution time"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "select query, calls, mean_exec_time, total_exec_time from pg_stat_statements order by total_exec_time desc limit 20;"

if command -v splinter >/dev/null 2>&1; then
  echo "==> Running Supabase splinter report"
  splinter report --db-url "$DB_URL"
else
  echo "==> Supabase splinter not available (install from https://github.com/supabase/splinter)"
fi
