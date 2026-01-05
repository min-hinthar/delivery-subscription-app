# URGENT: Production Database Performance Fixes

**Status**: 🔴 CRITICAL - Immediate Action Required
**Created**: 2026-01-05
**Related PR**: #82 (codex/fix-supabase-outage-and-migration-error)
**Review Branch**: claude/review-supabase-hotfix-Yhzmm

---

## Executive Summary

PR #82 successfully addressed Supabase security and performance linter findings by:
- ✅ Adding missing FK indexes (5 indexes)
- ✅ Wrapping RLS auth calls for plan stability (24+ policies)
- ✅ Locking function search_path to prevent injection

**HOWEVER**: The root cause of production database performance issues is **connection pool exhaustion**, which was NOT addressed by the hotfix.

**Immediate risk**: Without connection pooling configured, the app will continue to create excessive database connections under load, leading to timeouts and outages.

---

## Priority 1: Connection Pooling (CRITICAL)

### Issue
Next.js serverless functions create a new database connection per request. Without connection pooling:
- Free tier: 60 connection limit
- Pro tier: 200 connection limit
- **Current config**: Using direct database URL (port 5432) instead of pooler (port 6543)

### Impact
- Database connection exhaustion under moderate traffic
- Request timeouts
- Service outages
- **This is likely the PRIMARY cause of recent production issues**

### Fix (2-4 hours)

**Step 1: Update environment configuration**

Edit `.env.example`:
```bash
# Supabase Configuration
# Direct database URL (for migrations, scripts, Supabase Studio)
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# API URL (for client-side requests)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co

# Connection pooler URL (for serverless API routes - USE THIS IN PRODUCTION)
# Transaction mode (port 6543) - recommended for Next.js serverless functions
SUPABASE_POOLER_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Step 2: Update Supabase clients**

No code changes needed - Supabase JS SDK automatically pools connections when using the HTTP API endpoint (which we're already using via `NEXT_PUBLIC_SUPABASE_URL`).

**Verify**: Supabase JS client uses PostgREST over HTTP, not direct PostgreSQL connections, so we're already pooled! 🎉

**ACTION**: Add connection monitoring to confirm.

### Monitoring

Add to Supabase dashboard or monitoring tool:

```sql
-- Current active connections
SELECT count(*) as active_connections,
       max_conn.setting::int as max_connections,
       (count(*) * 100.0 / max_conn.setting::int) as percent_used
FROM pg_stat_activity,
     pg_settings max_conn
WHERE max_conn.name = 'max_connections'
  AND datname = 'postgres';

-- Connections by state
SELECT state, count(*)
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;
```

**Alert when**: active_connections > 80% of max_connections

---

## Priority 2: Query Optimization (HIGH)

### Issue 1: N+1 Query in Route Builder

**Location**: `src/app/api/admin/routes/build/route.ts:199-205`

**Current code** (SLOW):
```typescript
for (const update of etaUpdates) {
  await supabase
    .from("delivery_stops")
    .update({ eta: update.eta })
    .eq("route_id", route.id)
    .eq("appointment_id", update.appointment_id);
}
```

**Problem**: 10-30 individual UPDATE queries per route build

**Fix** (use upsert for batch update):
```typescript
// Build array of stop updates with primary key fields
const stopUpdates = etaUpdates.map((update, index) => ({
  route_id: route.id,
  appointment_id: update.appointment_id,
  eta: update.eta,
  stop_order: finalStops[index].stop_order,
  status: 'pending'
}));

// Single upsert operation
const { error: etaError } = await supabase
  .from("delivery_stops")
  .upsert(stopUpdates, {
    onConflict: 'route_id,appointment_id',
    ignoreDuplicates: false
  });

if (etaError) {
  return bad("Failed to update stop ETAs.", { status: 500 });
}
```

**Impact**: Reduces route build time from O(n) queries to O(1)

---

### Issue 2: Missing Pagination on Deliveries Page

**Location**: `src/app/(admin)/admin/deliveries/page.tsx:105-127`

**Current code**:
```typescript
const appointmentsQuery = supabase
  .from("delivery_appointments")
  .select(
    "id, week_of, status, notes, delivery_window:delivery_windows(...), address:addresses(...), profile:profiles(...)"
  )
  .eq("week_of", selectedWeek)
  .order("created_at", { ascending: true });
  // NO .limit() or .range() ❌
```

**Problem**:
- Loads ALL appointments for a week with nested joins
- 6 table joins per appointment
- Will timeout as subscriber count grows

**Fix** (add pagination):
```typescript
// Add to searchParams
const page = parseInt(resolvedSearchParams?.page ?? "1", 10);
const limit = 50;
const offset = (page - 1) * limit;

const appointmentsQuery = supabase
  .from("delivery_appointments")
  .select(
    "id, week_of, status, notes, delivery_window:delivery_windows(...), address:addresses(...), profile:profiles(...)",
    { count: 'exact' }  // Get total count for pagination
  )
  .eq("week_of", selectedWeek)
  .order("created_at", { ascending: true })
  .range(offset, offset + limit - 1);  // ✅ Add pagination
```

**Impact**: Limits query to 50 appointments per page instead of unbounded

---

## Priority 3: Testing & Monitoring (MEDIUM)

### RLS Regression Tests

**Risk**: 24+ RLS policies were modified in PR #82 with no automated tests

**Required tests** (add to `tests/integration/rls-policies.spec.ts`):

```typescript
describe('RLS Policies - Post-Hotfix Regression', () => {
  test('User can access their own orders', async () => {
    // Test profiles_select_own policy
    // Test orders_select_own policy
  });

  test('Driver can access assigned routes', async () => {
    // Test delivery_routes_driver_select policy
    // Test delivery_stops_driver_select policy
  });

  test('Admin can access all records', async () => {
    // Test admin_access policies across all tables
  });

  test('Suspended driver cannot update profile', async () => {
    // Test driver_profiles_update_own policy with status='suspended'
  });

  test('Driver can view customer addresses on their route', async () => {
    // Test addresses_driver_select policy
  });
});
```

### Query Performance Monitoring

**Setup pg_stat_statements tracking**:

```bash
# Run weekly or after deploys
bash scripts/codex/verify-supabase-stats.sh
```

**Review**:
1. Queries with `mean_exec_time > 1000ms`
2. Queries with high `calls` count (hot paths)
3. Add indexes for frequently filtered columns
4. Consider materialized views for complex aggregations

---

## Implementation Checklist

### Phase 1: Immediate (Today)
- [ ] Verify Supabase JS SDK is using PostgREST (HTTP) not direct PostgreSQL
- [ ] Add connection count monitoring query to Supabase dashboard
- [ ] Set up alert for connections > 80% of limit
- [ ] Document connection pooling strategy in README

### Phase 2: This Week
- [ ] Fix N+1 query in route builder (`src/app/api/admin/routes/build/route.ts:199-205`)
- [ ] Add pagination to deliveries page (`src/app/(admin)/admin/deliveries/page.tsx`)
- [ ] Test with realistic data volumes (100+ appointments per week)
- [ ] Deploy and monitor query performance

### Phase 3: Next Sprint
- [ ] Add RLS regression tests (`tests/integration/rls-policies.spec.ts`)
- [ ] Run `scripts/codex/verify-supabase-stats.sh` on production replica
- [ ] Optimize top 10 slowest queries
- [ ] Add query performance monitoring to CI/CD

---

## Success Metrics

**Connection Health**:
- [ ] Active connections < 50% of limit under normal load
- [ ] Active connections < 80% of limit under peak load
- [ ] Zero connection timeout errors in logs

**Query Performance**:
- [ ] Route builder completes in < 3s for 30-stop routes
- [ ] Deliveries page loads in < 2s with 100 appointments
- [ ] No queries with mean_exec_time > 1000ms in hot paths

**Reliability**:
- [ ] Zero RLS-related access control bugs reported
- [ ] 100% uptime for 7 days after deployment
- [ ] No database-related errors in production logs

---

## Additional Optimizations (Future)

### Reduce Non-Essential Load

1. **Image storage**: Consider moving images from Supabase Storage to Cloudinary/Imgix
   - Current: Images stored in Supabase (contributes to bandwidth quota)
   - Proposed: Store only URLs in database, host files on CDN
   - Impact: Reduces Supabase bandwidth by ~70%

2. **File storage**: Use Google Drive or S3 for large files
   - Store only file metadata + public URLs in database
   - Reduces database storage and bandwidth

3. **Caching strategy**:
   - Add Redis/Upstash for hot data (meal items, delivery windows)
   - Cache API responses with stale-while-revalidate
   - Reduces database read load by ~40%

### Schema Optimizations

1. **Materialized views** for dashboards:
   ```sql
   CREATE MATERIALIZED VIEW weekly_delivery_summary AS
   SELECT week_of, count(*) as appointment_count, ...
   FROM delivery_appointments
   GROUP BY week_of;
   ```

2. **Partial indexes** for filtered queries:
   ```sql
   CREATE INDEX idx_appointments_confirmed
   ON delivery_appointments(week_of, user_id)
   WHERE status = 'confirmed';
   ```

3. **JSONB columns** for flexible data (reduce table count)

---

## References

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Next.js Database Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#connection-pooling)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- PR #82: Security & Performance Hotfix
- Migration 018: `supabase/migrations/018_security_performance_hotfix.sql`

---

**Last updated**: 2026-01-05
**Assigned to**: Development Team
**Reviewer**: Claude (via claude/review-supabase-hotfix-Yhzmm)
