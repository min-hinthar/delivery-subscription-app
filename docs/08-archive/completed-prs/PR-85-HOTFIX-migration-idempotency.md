# HOTFIX: PR #85 Migration Idempotency Bug

**Issue:** Critical SQL Migration Failure (Postgres Error 42710)
**Severity:** P0 - Production Breaking
**Fixed:** 2026-01-05
**Discovered By:** Human reviewer (min-hinthar)

---

## Problem Description

The weekly menu system migration (`20260104000001_weekly_menu_system.sql`) **fails on re-run** with:

```
ERROR: policy named "weekly_menus_admin_access" already exists on table public.weekly_menus
SQL state: 42710
```

### Root Cause

Migration script inconsistently used `DROP POLICY IF EXISTS`:
- ✅ 2 policies had `DROP POLICY IF EXISTS`
- ❌ 14 policies did NOT have `DROP POLICY IF EXISTS`
- ❌ 0 triggers had `DROP TRIGGER IF EXISTS`

This makes the migration **non-idempotent**, breaking:
- Production deployments (if migration runs twice)
- Local dev environments (partial migration runs)
- Rollback/rollforward scenarios
- CI/CD pipelines

### Code Example (BEFORE - BROKEN)

```sql
-- This works the first time...
create policy "weekly_menus_admin_access"
  on public.weekly_menus for all
  using (public.is_admin())
  with check (public.is_admin());

-- But FAILS on second run with error 42710
```

---

## Fix Applied

Added `DROP POLICY IF EXISTS` and `DROP TRIGGER IF EXISTS` for **ALL** policies and triggers.

### Fixed Code (AFTER)

```sql
-- Now idempotent - safe to run multiple times
drop policy if exists "weekly_menus_admin_access" on public.weekly_menus;

create policy "weekly_menus_admin_access"
  on public.weekly_menus for all
  using (public.is_admin())
  with check (public.is_admin());
```

### Statistics

| Type | Before | After |
|------|--------|-------|
| DROP POLICY IF EXISTS | 2 | 16 ✅ |
| DROP TRIGGER IF EXISTS | 0 | 5 ✅ |
| Total DROP statements | 2 | 21 ✅ |

---

## All Policies Fixed

1. `menu_templates_public_select_active`
2. `menu_templates_admin_access`
3. `template_dishes_public_select_active`
4. `template_dishes_admin_access`
5. `weekly_menus_public_select_published`
6. `weekly_menus_admin_access` ⚠️ (reported failure)
7. `weekly_menu_items_public_select_published`
8. `weekly_menu_items_admin_access`
9. `meal_packages_public_select_active`
10. `meal_packages_admin_access`
11. `weekly_orders_customer_select`
12. `weekly_orders_customer_insert`
13. `weekly_orders_customer_update_pending`
14. `weekly_orders_driver_select`
15. `weekly_orders_driver_update`
16. `weekly_orders_admin_access`

## All Triggers Fixed

1. `trigger_auto_close_menu`
2. `trigger_increment_orders`
3. `menu_templates_set_updated_at`
4. `meal_packages_set_updated_at`
5. `weekly_orders_set_updated_at`

---

## Impact Assessment

### Before Fix
- 🔴 **CRITICAL:** Production deployment would fail
- 🔴 Local dev broken for anyone with partial migration
- 🔴 Cannot safely re-run migrations
- 🔴 CI/CD pipeline would fail on re-deploy

### After Fix
- ✅ Migration is fully idempotent
- ✅ Safe to run multiple times
- ✅ Works in all environments
- ✅ CI/CD safe

---

## Testing Verification

The migration can now be run multiple times without errors:

```bash
# First run - creates everything
psql -f supabase/migrations/20260104000001_weekly_menu_system.sql

# Second run - drops and recreates (no errors)
psql -f supabase/migrations/20260104000001_weekly_menu_system.sql

# Result: SUCCESS ✅
```

---

## Lessons Learned

### For Codex/AI Agents

When writing Supabase migrations:

1. **Always use DROP IF EXISTS for policies:**
   ```sql
   drop policy if exists "policy_name" on public.table_name;
   ```

2. **Always use DROP IF EXISTS for triggers:**
   ```sql
   drop trigger if exists trigger_name on public.table_name;
   ```

3. **Use CREATE OR REPLACE for functions:**
   ```sql
   create or replace function public.function_name()
   ```

4. **Test migration idempotency:**
   - Run migration twice locally
   - Verify no errors on second run

5. **Pattern to follow:**
   ```sql
   -- 1. Create/alter tables (with IF NOT EXISTS)
   create table if not exists public.my_table (...);

   -- 2. Create indexes (with IF NOT EXISTS)
   create index if not exists idx_name on public.my_table(col);

   -- 3. Drop and recreate policies
   drop policy if exists "policy_name" on public.my_table;
   create policy "policy_name" on public.my_table ...;

   -- 4. Create or replace functions
   create or replace function public.my_func() ...;

   -- 5. Drop and recreate triggers
   drop trigger if exists trigger_name on public.my_table;
   create trigger trigger_name ...;
   ```

### For Human Reviewers

Add to review checklist:
- [ ] Migration uses `DROP POLICY IF EXISTS` for all policies
- [ ] Migration uses `DROP TRIGGER IF EXISTS` for all triggers
- [ ] Migration uses `CREATE OR REPLACE` for functions
- [ ] Migration uses `IF NOT EXISTS` for tables/indexes
- [ ] Test: Run migration twice locally

---

## Related Files

- Migration: `supabase/migrations/20260104000001_weekly_menu_system.sql`
- Review: `docs/08-archive/completed-prs/PR-85-weekly-menu-system-review.md`
- PR: #85 (codex/implement-next-priority-feature-from-backlog-089m6o)

---

## Commit Message

```
fix: make weekly menu migration fully idempotent

Critical bug fix for migration 20260104000001_weekly_menu_system.sql
that was failing on re-runs with Postgres error 42710.

Changes:
- Added DROP POLICY IF EXISTS for all 16 RLS policies
- Added DROP TRIGGER IF EXISTS for all 5 triggers
- Migration now safe to run multiple times in all environments

Impact: Fixes production deployment failures and local dev issues

Discovered by: min-hinthar during production readiness review
```

---

**Status:** ✅ FIXED
**Tested:** Migration runs successfully multiple times
**Deployed:** Ready for production
