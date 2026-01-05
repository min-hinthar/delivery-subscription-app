#!/usr/bin/env bash
# Query Performance Monitoring
# Identifies slow queries and provides optimization recommendations

set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
SLOW_THRESHOLD="${SLOW_QUERY_MS:-1000}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Error: SUPABASE_DB_URL not set"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ Error: psql not available"
  exit 1
fi

echo "==> Query Performance Analysis"
echo "   Slow query threshold: ${SLOW_THRESHOLD}ms"
echo

# Enable pg_stat_statements if not already enabled
echo "==> Ensuring pg_stat_statements extension is available..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" 2>/dev/null || {
  echo "⚠️  Warning: Could not enable pg_stat_statements (may require superuser)"
  echo "   Some performance metrics will be unavailable"
  echo
}

# Top 10 slowest queries by mean execution time
echo "==> Top 10 slowest queries (by mean execution time):"
psql "$DB_URL" <<SQL
SELECT
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  calls,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as pct_total,
  left(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY mean_exec_time DESC
LIMIT 10;
SQL

echo

# Queries consuming most total time
echo "==> Top 10 queries by total time (highest impact):"
psql "$DB_URL" <<SQL
SELECT
  round(total_exec_time::numeric, 2) as total_ms,
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as pct_total,
  left(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY total_exec_time DESC
LIMIT 10;
SQL

echo

# Queries with high call frequency
echo "==> Most frequently called queries:"
psql "$DB_URL" <<SQL
SELECT
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  left(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY calls DESC
LIMIT 10;
SQL

echo

# Check for queries exceeding slow threshold
echo "==> Checking for slow queries (> ${SLOW_THRESHOLD}ms)..."
SLOW_COUNT=$(psql "$DB_URL" -t -A <<SQL
SELECT count(*)
FROM pg_stat_statements
WHERE mean_exec_time > $SLOW_THRESHOLD
  AND query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%';
SQL
)

if [[ "$SLOW_COUNT" -gt 0 ]]; then
  echo "⚠️  Found $SLOW_COUNT queries exceeding ${SLOW_THRESHOLD}ms threshold:"
  echo
  psql "$DB_URL" <<SQL
SELECT
  round(mean_exec_time::numeric, 2) as mean_ms,
  calls,
  left(query, 120) as query_preview
FROM pg_stat_statements
WHERE mean_exec_time > $SLOW_THRESHOLD
  AND query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY mean_exec_time DESC;
SQL
else
  echo "✅ No queries exceeding ${SLOW_THRESHOLD}ms threshold"
fi

echo
echo "==> Performance Recommendations:"
echo "   1. Add indexes for queries with high call frequency"
echo "   2. Optimize queries with mean_exec_time > 1000ms"
echo "   3. Review queries consuming >10% of total execution time"
echo "   4. Consider caching for frequently called queries"
echo
echo "==> Done! ✓"
