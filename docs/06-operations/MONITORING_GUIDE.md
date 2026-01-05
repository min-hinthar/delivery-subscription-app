# Database Monitoring Guide

**Status**: Production Ready ✅
**Last Updated**: 2026-01-05
**Maintenance**: Weekly review recommended

---

## Overview

This guide covers database health monitoring, performance tracking, and alerting for the Morning Star delivery app. These tools help prevent outages, identify bottlenecks, and optimize query performance.

**Key Metrics**:
- Database connection usage (prevent exhaustion)
- Query performance (identify slow queries)
- Table growth (capacity planning)
- Index usage (optimize storage)

---

## Quick Start

### Prerequisites

1. **Install PostgreSQL client** (for monitoring scripts):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # macOS
   brew install postgresql
   ```

2. **Set up environment variables**:
   ```bash
   # Copy from Supabase Dashboard > Settings > Database > Connection string
   export SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@...supabase.com:5432/postgres"
   ```

3. **Apply monitoring migration**:
   ```bash
   # This creates monitoring functions in your database
   psql "$SUPABASE_DB_URL" -f supabase/migrations/019_monitoring_functions.sql
   ```

### Run Your First Health Check

```bash
# Check database connection health
bash scripts/monitoring/check-db-connections.sh

# Check query performance
bash scripts/monitoring/check-query-performance.sh
```

---

## Monitoring Tools

### 1. Connection Health Monitoring

**Script**: `scripts/monitoring/check-db-connections.sh`

**What it checks**:
- Active database connections vs. max connections
- Connection usage percentage
- Connections by state (active, idle, idle in transaction)
- Long-running connections

**When to run**:
- ✅ After deployments
- ✅ During traffic spikes
- ✅ When experiencing slow responses
- ✅ Daily via cron (recommended)

**Example output**:
```
📊 Connection Statistics:
   Active connections: 12
   Max connections:    60
   Usage:              20%

✅ Connection health OK (20% < 80%)

==> Connections by state:
idle        8
active      3
idle in transaction  1
```

**Alert thresholds**:
- ⚠️ Warning: >60% usage
- 🚨 Critical: >80% usage

**Setup cron** (check every 5 minutes):
```bash
# Add to crontab
*/5 * * * * cd /path/to/app && bash scripts/monitoring/check-db-connections.sh >> /var/log/db-health.log 2>&1
```

---

### 2. Query Performance Monitoring

**Script**: `scripts/monitoring/check-query-performance.sh`

**What it checks**:
- Top 10 slowest queries (by mean execution time)
- Queries consuming most total time (highest impact)
- Most frequently called queries (hot paths)
- Queries exceeding slow threshold (default: 1000ms)

**When to run**:
- ✅ Weekly performance reviews
- ✅ After adding new features
- ✅ When investigating slow pages
- ✅ Before/after query optimizations

**Example output**:
```
==> Top 10 slowest queries (by mean execution time):
 mean_ms | total_ms | calls |  pct_total | query_preview
---------+----------+-------+------------+------------------
 2341.23 | 46824.60 |    20 |      15.23 | SELECT * FROM delivery_appointments WHERE...
  987.45 |  9874.50 |    10 |       3.21 | UPDATE delivery_stops SET eta = ...
```

**What to look for**:
- Queries with `mean_ms > 1000` (slow individual queries)
- Queries with `pct_total > 10` (highest impact on DB load)
- High `calls` count with moderate `mean_ms` (optimization opportunity)

**Action items**:
1. Add indexes for frequently filtered columns
2. Reduce SELECT * to specific columns
3. Add pagination for unbounded queries
4. Consider caching for read-heavy queries

---

### 3. Health Check API

**Endpoint**: `/api/health/db`

**Purpose**: Programmatic health checks for monitoring services (Datadog, New Relic, uptime monitors)

**Usage**:
```bash
# Public health check (if no secret configured)
curl https://your-domain.com/api/health/db

# Protected health check (with secret)
curl "https://your-domain.com/api/health/db?secret=your-health-check-secret"
```

**Response** (healthy):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "response_time_ms": 45,
      "connections": {
        "active_connections": 12,
        "max_connections": 60,
        "percent_used": 20
      }
    }
  }
}
```

**Status codes**:
- `200`: Healthy or degraded (but functional)
- `503`: Unhealthy (database down or unresponsive)

**Integration examples**:

**Uptime Robot**:
1. Create new monitor: HTTP(s)
2. URL: `https://your-domain.com/api/health/db?secret=...`
3. Keyword to expect: `"status":"healthy"`
4. Interval: 5 minutes

**Datadog**:
```yaml
# datadog.yaml
init_config:

instances:
  - url: https://your-domain.com/api/health/db?secret=YOUR_SECRET
    method: GET
    timeout: 10
    expected_status_code: 200
```

---

### 4. Database Functions (SQL)

These functions are created by `019_monitoring_functions.sql` and can be called from SQL or your application.

#### `get_connection_stats()`

Returns current connection statistics.

```sql
SELECT * FROM get_connection_stats();

-- Returns:
-- {
--   "active_connections": 12,
--   "max_connections": 60,
--   "percent_used": 20.00
-- }
```

**Use in app**:
```typescript
const { data } = await supabase.rpc('get_connection_stats');
console.log(`Connection usage: ${data.percent_used}%`);
```

#### `get_long_running_queries(threshold_seconds)`

Identifies queries running longer than threshold.

```sql
-- Find queries running > 30 seconds
SELECT * FROM get_long_running_queries(30);

-- Returns:
--  pid  | duration_seconds |      query_preview       | state
-- ------+------------------+--------------------------+--------
--  1234 |              45  | SELECT * FROM orders...  | active
```

**Use cases**:
- Identify stuck queries
- Find candidates for optimization
- Debug slow API endpoints

#### `get_table_sizes()`

Shows table sizes for capacity planning.

```sql
SELECT * FROM get_table_sizes();

-- Returns:
--      table_name       | row_count | total_size_mb | index_size_mb
-- ----------------------+-----------+---------------+---------------
-- public.order_items    |     5243  |         12.34 |          4.56
-- public.orders         |     1829  |          8.91 |          3.21
```

**Use for**:
- Capacity planning
- Identifying growth patterns
- Archive/cleanup decisions

#### `get_index_usage()`

Shows index usage to identify unused indexes.

```sql
SELECT * FROM get_index_usage()
WHERE index_scans = 0
ORDER BY index_size_mb DESC;

-- Returns unused indexes sorted by size
```

**Action**: Consider dropping unused indexes to save storage and improve write performance.

---

## Monitoring Dashboard

Use the `monitoring_summary` view for a high-level overview:

```sql
SELECT * FROM monitoring_summary;

-- Returns:
--  active_connections | max_connections | active_queries | idle_in_transaction |
-- --------------------+-----------------+----------------+---------------------+
--                  12 |              60 |              3 |                   1 |
--
--  total_users | active_subscriptions | recent_appointments
-- -------------+----------------------+---------------------
--          145 |                   87 |                  42
```

**Create admin dashboard** showing these metrics in real-time.

---

## Alert Configuration

### Recommended Alerts

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Connection usage | >60% | >80% | Review long-running queries, check for connection leaks |
| Query mean time | >1000ms | >5000ms | Optimize query, add indexes |
| Response time (health check) | >1000ms | >5000ms | Investigate database load, scale if needed |
| Idle in transaction | >5 | >10 | Find and fix transaction leaks |
| Table growth | >10GB | >50GB | Plan for archiving/partitioning |

### Example: Slack Webhook Alert

```bash
#!/bin/bash
# scripts/monitoring/alert-connections.sh

THRESHOLD=80
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

USAGE=$(bash scripts/monitoring/check-db-connections.sh | grep "Usage:" | awk '{print $2}' | tr -d '%')

if (( $(echo "$USAGE > $THRESHOLD" | bc -l) )); then
  curl -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"🚨 Database connections at ${USAGE}% (threshold: ${THRESHOLD}%)\"}"
fi
```

**Setup cron**:
```bash
*/5 * * * * bash scripts/monitoring/alert-connections.sh
```

---

## Performance Optimization Workflow

### Step 1: Identify Slow Queries

```bash
# Run performance check
bash scripts/monitoring/check-query-performance.sh > performance-report.txt

# Review queries with mean_ms > 1000
grep "mean_ms" performance-report.txt | awk '$1 > 1000'
```

### Step 2: Analyze Query

```sql
-- Enable query plan analysis
EXPLAIN ANALYZE
SELECT * FROM delivery_appointments
WHERE week_of = '2026-01-12'
  AND status = 'confirmed';
```

**Look for**:
- Seq Scan (bad) → add index
- High cost numbers → optimize joins
- Many rows filtered → tighten WHERE clause

### Step 3: Add Index

```sql
-- Create index for common filters
CREATE INDEX idx_appointments_week_status
  ON delivery_appointments(week_of, status);
```

### Step 4: Verify Improvement

```bash
# Run performance check again
bash scripts/monitoring/check-query-performance.sh

# Compare before/after mean_ms
```

### Step 5: Monitor Index Usage

```sql
-- After 1 week, check if index is used
SELECT * FROM get_index_usage()
WHERE index_name = 'idx_appointments_week_status';

-- If index_scans = 0, consider dropping it
```

---

## Troubleshooting

### High Connection Usage

**Symptoms**: Connection usage >80%, requests timing out

**Diagnosis**:
```bash
bash scripts/monitoring/check-db-connections.sh
```

**Common causes**:
1. Connection leaks (connections not closed)
2. Traffic spike
3. Serverless functions creating too many connections

**Solutions**:
- Verify Supabase JS SDK is using PostgREST (automatic pooling) ✅
- Review long-running connections
- Add connection timeout
- Scale up Supabase plan for more connections

### Slow Queries

**Symptoms**: Pages loading slowly, API timeouts

**Diagnosis**:
```bash
bash scripts/monitoring/check-query-performance.sh
```

**Solutions**:
- Add indexes for frequently filtered columns
- Reduce SELECT * to specific columns
- Add pagination (`.range(0, 49)`)
- Cache read-heavy queries

### Connection Leaks

**Symptoms**: Connections grow over time, don't release

**Diagnosis**:
```sql
SELECT * FROM get_long_running_queries(300); -- 5+ minutes
```

**Solutions**:
- Check for missing `await` on Supabase queries
- Ensure error handlers don't prevent connection cleanup
- Add statement_timeout to prevent runaway queries

### Idle in Transaction

**Symptoms**: Many "idle in transaction" connections

**Diagnosis**:
```sql
SELECT count(*) FROM pg_stat_activity
WHERE state = 'idle in transaction';
```

**Solutions**:
- Check for unclosed transactions
- Add `idle_in_transaction_session_timeout`
- Review async code for missing commits

---

## Best Practices

### ✅ Do

- Run connection health checks daily
- Review query performance weekly
- Add indexes for common filters
- Use pagination for large result sets
- Specify columns instead of SELECT *
- Monitor table growth trends
- Set up automated alerts

### ❌ Don't

- Create direct PostgreSQL connections from serverless functions (use Supabase SDK)
- Ignore queries with >1000ms mean time
- Add indexes without monitoring usage
- SELECT * in production queries
- Run unbounded queries (always add `.limit()` or `.range()`)
- Deploy without checking migration performance

---

## Monitoring Checklist

### Daily
- [ ] Check `/api/health/db` endpoint (automated)
- [ ] Review connection usage (automated alert if >80%)

### Weekly
- [ ] Run `check-query-performance.sh`
- [ ] Review top 10 slowest queries
- [ ] Check for queries >1000ms mean time
- [ ] Review table growth trends

### Monthly
- [ ] Audit index usage (drop unused indexes)
- [ ] Review capacity planning (table sizes)
- [ ] Check for slow query trends (getting worse?)
- [ ] Update monitoring documentation

### After Deployments
- [ ] Run connection health check
- [ ] Run query performance check
- [ ] Verify no new slow queries introduced
- [ ] Monitor for 24 hours

---

## Resources

**Scripts**:
- `scripts/monitoring/check-db-connections.sh`
- `scripts/monitoring/check-query-performance.sh`
- `scripts/codex/verify-supabase-stats.sh`

**Database Functions**:
- `get_connection_stats()`
- `get_long_running_queries(threshold_seconds)`
- `get_table_sizes()`
- `get_index_usage()`
- View: `monitoring_summary`

**API Endpoints**:
- `/api/health/db` - Health check endpoint

**Documentation**:
- [Supabase Performance Tips](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [Connection Pooling Best Practices](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**Maintained by**: Operations Team
**Last Review**: 2026-01-05
**Next Review**: Weekly during standup
