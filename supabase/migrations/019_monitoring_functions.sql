-- =====================================================
-- Migration: 019_monitoring_functions
-- Description: Database monitoring functions for health checks
-- Created: 2026-01-05
-- =====================================================

-- =====================================================
-- 1. Connection statistics function
-- =====================================================

-- Function to get current connection statistics
-- Returns active connections, max connections, and usage percentage
create or replace function public.get_connection_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'active_connections', count(*)::int,
    'max_connections', (select setting::int from pg_settings where name = 'max_connections'),
    'percent_used', round((count(*) * 100.0 / (select setting::int from pg_settings where name = 'max_connections'))::numeric, 2)
  )
  from pg_stat_activity
  where datname = current_database();
$$;

-- Grant execute to authenticated users (health checks need this)
grant execute on function public.get_connection_stats() to authenticated;

comment on function public.get_connection_stats is 'Returns current database connection statistics for health monitoring';

-- =====================================================
-- 2. Slow query detection function
-- =====================================================

-- Function to identify queries running longer than threshold
create or replace function public.get_long_running_queries(threshold_seconds int default 30)
returns table (
  pid int,
  duration_seconds int,
  query_preview text,
  state text
)
language sql
security definer
set search_path = public
as $$
  select
    pid,
    extract(epoch from (now() - query_start))::int as duration_seconds,
    left(query, 100) as query_preview,
    state
  from pg_stat_activity
  where datname = current_database()
    and state != 'idle'
    and query not ilike '%pg_stat_activity%'
    and (now() - query_start) > (threshold_seconds || ' seconds')::interval
  order by query_start asc;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_long_running_queries(int) to authenticated;

comment on function public.get_long_running_queries is 'Returns queries running longer than specified threshold (default 30s)';

-- =====================================================
-- 3. Table size monitoring function
-- =====================================================

-- Function to get table sizes for capacity planning
create or replace function public.get_table_sizes()
returns table (
  table_name text,
  row_count bigint,
  total_size_mb numeric,
  index_size_mb numeric
)
language sql
security definer
set search_path = public
as $$
  select
    schemaname || '.' || tablename as table_name,
    n_live_tup as row_count,
    round((pg_total_relation_size(schemaname || '.' || tablename) / 1024.0 / 1024.0)::numeric, 2) as total_size_mb,
    round((pg_indexes_size(schemaname || '.' || tablename) / 1024.0 / 1024.0)::numeric, 2) as index_size_mb
  from pg_stat_user_tables
  where schemaname = 'public'
  order by pg_total_relation_size(schemaname || '.' || tablename) desc;
$$;

-- Grant execute to authenticated users with admin role
grant execute on function public.get_table_sizes() to authenticated;

comment on function public.get_table_sizes is 'Returns table sizes for capacity planning and monitoring';

-- =====================================================
-- 4. Index usage monitoring function
-- =====================================================

-- Function to identify unused or rarely used indexes
create or replace function public.get_index_usage()
returns table (
  table_name text,
  index_name text,
  index_scans bigint,
  index_size_mb numeric
)
language sql
security definer
set search_path = public
as $$
  select
    schemaname || '.' || tablename as table_name,
    indexname as index_name,
    idx_scan as index_scans,
    round((pg_relation_size(schemaname || '.' || indexname) / 1024.0 / 1024.0)::numeric, 2) as index_size_mb
  from pg_stat_user_indexes
  where schemaname = 'public'
  order by idx_scan asc, pg_relation_size(schemaname || '.' || indexname) desc;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_index_usage() to authenticated;

comment on function public.get_index_usage is 'Returns index usage statistics to identify unused indexes';

-- =====================================================
-- 5. Create monitoring view for dashboard
-- =====================================================

create or replace view public.monitoring_summary as
select
  (select count(*) from pg_stat_activity where datname = current_database()) as active_connections,
  (select setting::int from pg_settings where name = 'max_connections') as max_connections,
  (select count(*) from pg_stat_activity where datname = current_database() and state = 'active') as active_queries,
  (select count(*) from pg_stat_activity where datname = current_database() and state = 'idle in transaction') as idle_in_transaction,
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.subscriptions where status in ('active', 'trialing')) as active_subscriptions,
  (select count(*) from public.delivery_appointments where week_of >= current_date - interval '7 days') as recent_appointments;

grant select on public.monitoring_summary to authenticated;

comment on view public.monitoring_summary is 'High-level monitoring metrics for operations dashboard';
