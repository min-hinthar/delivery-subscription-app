#!/usr/bin/env bash
# Database Connection Health Check
# Monitors active connections and alerts if threshold exceeded

set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
THRESHOLD="${CONNECTION_THRESHOLD:-80}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Error: SUPABASE_DB_URL not set"
  echo "Set SUPABASE_DB_URL to your Supabase database connection string"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ Error: psql not available"
  echo "Install PostgreSQL client: apt-get install postgresql-client"
  exit 1
fi

echo "==> Checking database connection health..."
echo

# Get connection statistics
RESULT=$(psql "$DB_URL" -t -A -F'|' <<'SQL'
SELECT
  count(*) as active_connections,
  max_conn.setting::int as max_connections,
  round((count(*) * 100.0 / max_conn.setting::int)::numeric, 2) as percent_used
FROM pg_stat_activity,
     pg_settings max_conn
WHERE max_conn.name = 'max_connections'
  AND datname = current_database();
SQL
)

IFS='|' read -r ACTIVE MAX PERCENT <<< "$RESULT"

echo "📊 Connection Statistics:"
echo "   Active connections: $ACTIVE"
echo "   Max connections:    $MAX"
echo "   Usage:              ${PERCENT}%"
echo

# Check threshold
if (( $(echo "$PERCENT > $THRESHOLD" | bc -l) )); then
  echo "⚠️  WARNING: Connection usage exceeds ${THRESHOLD}% threshold!"
  echo "   Consider:"
  echo "   - Reviewing long-running queries"
  echo "   - Checking for connection leaks"
  echo "   - Upgrading Supabase plan for more connections"
  echo
  exit 1
else
  echo "✅ Connection health OK (${PERCENT}% < ${THRESHOLD}%)"
  echo
fi

# Show connections by state
echo "==> Connections by state:"
psql "$DB_URL" -t -A -F'|' <<'SQL' | column -t -s '|'
SELECT
  COALESCE(state, 'unknown') as state,
  count(*) as count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY count DESC;
SQL

echo

# Show top 5 queries by connection time
echo "==> Top 5 longest-running connections:"
psql "$DB_URL" <<'SQL'
SELECT
  pid,
  usename,
  application_name,
  state,
  EXTRACT(EPOCH FROM (now() - state_change))::int as seconds,
  left(query, 60) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND state IS NOT NULL
ORDER BY state_change ASC
LIMIT 5;
SQL

echo "==> Done! ✓"
