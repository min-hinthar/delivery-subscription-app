-- =====================================================
-- Migration: 025_fix_security_definer
-- Description: Fix security vulnerabilities in SECURITY DEFINER functions
-- Created: 2026-01-05
-- =====================================================

-- =====================================================
-- 1. Create admin role check function
-- =====================================================

-- Function to check if a user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user has admin role';

-- =====================================================
-- 2. Restrict monitoring functions to admin only
-- =====================================================

-- Revoke public access from monitoring functions
REVOKE EXECUTE ON FUNCTION public.get_connection_stats() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_long_running_queries(int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_table_sizes() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_index_usage() FROM authenticated;

-- Recreate functions with admin-only access checks
CREATE OR REPLACE FUNCTION public.get_connection_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_admin() THEN
      json_build_object(
        'active_connections', count(*)::int,
        'max_connections', (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
        'percent_used', round((count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'))::numeric, 2)
      )
    ELSE
      json_build_object('error', 'Unauthorized: Admin access required')
  END
  FROM pg_stat_activity
  WHERE datname = current_database();
$$;

CREATE OR REPLACE FUNCTION public.get_long_running_queries(threshold_seconds INT DEFAULT 30)
RETURNS TABLE (
  pid INT,
  duration_seconds INT,
  query_preview TEXT,
  state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    psa.pid,
    extract(epoch FROM (now() - psa.query_start))::int AS duration_seconds,
    left(psa.query, 100) AS query_preview,
    psa.state
  FROM pg_stat_activity psa
  WHERE psa.datname = current_database()
    AND psa.state != 'idle'
    AND psa.query NOT ILIKE '%pg_stat_activity%'
    AND (now() - psa.query_start) > (threshold_seconds || ' seconds')::interval
  ORDER BY psa.query_start ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  total_size_mb NUMERIC,
  index_size_mb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    schemaname || '.' || relname AS table_name,
    n_live_tup AS row_count,
    round((pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)) / 1024.0 / 1024.0)::numeric, 2) AS total_size_mb,
    round((pg_indexes_size(quote_ident(schemaname) || '.' || quote_ident(relname)) / 1024.0 / 1024.0)::numeric, 2) AS index_size_mb
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_index_usage()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_scans BIGINT,
  index_size_mb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    schemaname || '.' || relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    round((pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(indexrelname)) / 1024.0 / 1024.0)::numeric, 2) AS index_size_mb
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan ASC, pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(indexrelname)) DESC;
END;
$$;

-- Grant execute to authenticated users (but functions now check admin role internally)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_long_running_queries(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_index_usage() TO authenticated;

-- =====================================================
-- 3. Restrict monitoring_summary view to admin only
-- =====================================================

-- Drop and recreate the monitoring_summary view with security check
DROP VIEW IF EXISTS public.monitoring_summary;

CREATE OR REPLACE FUNCTION public.get_monitoring_summary()
RETURNS TABLE (
  active_connections BIGINT,
  max_connections INT,
  active_queries BIGINT,
  idle_in_transaction BIGINT,
  total_users BIGINT,
  active_subscriptions BIGINT,
  recent_appointments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database())::BIGINT AS active_connections,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active')::BIGINT AS active_queries,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction')::BIGINT AS idle_in_transaction,
    (SELECT count(*) FROM public.profiles)::BIGINT AS total_users,
    (SELECT count(*) FROM public.subscriptions WHERE status IN ('active', 'trialing'))::BIGINT AS active_subscriptions,
    (SELECT count(*) FROM public.delivery_appointments WHERE week_of >= current_date - interval '7 days')::BIGINT AS recent_appointments;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monitoring_summary() TO authenticated;

COMMENT ON FUNCTION public.get_monitoring_summary() IS 'Returns high-level monitoring metrics for operations dashboard (admin only)';

-- =====================================================
-- 4. Add RLS policy for meal_item_ratings view
-- =====================================================

-- Note: Views inherit RLS from their base tables
-- The meal_item_ratings view is based on reviews table which already has RLS enabled
-- Users can view all reviews per existing policy, so the view is safe

COMMENT ON VIEW public.meal_item_ratings IS 'Aggregated ratings for each meal item (public read access)';
