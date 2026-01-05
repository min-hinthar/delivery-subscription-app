# 🚨 CRITICAL: Codex Priority Fixes for PR #88

**Date:** 2026-01-05
**Urgency:** P0 - BLOCKING
**Assigned To:** Codex
**Review By:** Claude

---

## ⚠️ DO NOT MERGE PR #88 - Critical Bug Found

Claude completed review of PR #88 (Burmese i18n) and discovered a **CRITICAL P0 blocking bug** in the database migration.

**Original Assessment:** 8.0/10 ✅
**Corrected Assessment:** 4.5/10 ⚠️ **CHANGES REQUESTED**

---

## 🔴 Critical Issue Summary

**Problem:** Database migration references tables that **do not exist** in the schema.

**Migration File:** `supabase/migrations/20260104000002_add_burmese_columns.sql`

**Errors:**
```sql
-- LINE 2: WRONG TABLE NAME
alter table dishes add column name_my text;
-- ❌ ERROR: relation "dishes" does not exist

-- LINE 7: TABLE DOESN'T EXIST
alter table categories add column name_my text;
-- ❌ ERROR: relation "categories" does not exist

-- LINE 18: WRONG PARAMETER TYPE
create function get_dish_name(dish_record dishes, ...)
-- ❌ ERROR: type "dishes" does not exist
```

**Correct Table Name:** `meal_items` (NOT `dishes`)
**No Categories Table:** There is no `categories` table in this schema

---

## 🎯 Required Fixes (P0 - Blocking)

### Fix #1: Replace Migration File

**Action:**
```bash
# Delete broken migration
rm supabase/migrations/20260104000002_add_burmese_columns.sql

# Use corrected version
cp supabase/migrations/20260104000002_add_burmese_columns_FIXED.sql \
   supabase/migrations/20260104000002_add_burmese_columns.sql
```

**What Changed:**
- `dishes` → `meal_items`
- Removed `categories` table references (doesn't exist)
- Fixed function parameter types
- Added schema qualification (`public.`)
- Added empty string checks
- Added comments

### Fix #2: Update Implementation Guide

**File:** `docs/01-active/implementation-guides/burmese-i18n.md`

**Find and replace (Lines 884-925):**
- `dishes` → `meal_items`
- `get_dish_name()` → `get_meal_item_name()`
- `get_dish_description()` → `get_meal_item_description()`
- Remove all references to `categories` table

### Fix #3: Test Migration

**CRITICAL:** Must test before re-submitting PR!

```bash
# Test migration against actual database
psql $SUPABASE_DB_URL -f supabase/migrations/20260104000002_add_burmese_columns.sql

# Expected: Should complete with no errors
# If errors occur, migration is still broken
```

### Fix #4: Update Type Definitions (If Needed)

**File:** `src/types/index.ts`

Verify interface uses correct naming:
```typescript
// Correct (matches schema)
export interface MealItem {
  id: string;
  name: string;
  name_my?: string;
  description?: string;
  description_my?: string;
  // ...
}

// Incorrect (if this exists, rename it)
export interface Dish { ... }  // ❌ Should be MealItem
```

---

## 📋 Verification Checklist

Before re-submitting PR #88, Codex must verify:

- [ ] Migration file replaced with FIXED version
- [ ] Implementation guide updated (all `dishes` → `meal_items`)
- [ ] Migration tested successfully: `psql -f <migration>`
- [ ] No references to `dishes` or `categories` tables remain
- [ ] Function names updated in guide
- [ ] Type definitions match schema
- [ ] All tests still passing: `pnpm test`
- [ ] Build succeeds: `pnpm build` (may have Google Fonts issue - not blocking)

---

## 🔍 How to Discover Schema Next Time

**Before creating migrations, always run:**

```bash
# Method 1: List all tables
psql $DATABASE_URL -c "\dt public.*"

# Method 2: Grep existing migrations
grep "create table" supabase/migrations/*.sql | grep -o "public\.[a-z_]*"

# Method 3: Read schema files
cat supabase/migrations/001_init.sql | grep "create table"
cat supabase/migrations/20260104000001_weekly_menu_system.sql | grep "create table"
```

**Actual tables in this schema:**
- `meal_items` (used for dishes)
- `menu_templates` (already has _my columns)
- `meal_packages` (already has _my columns)
- `template_dishes` (references meal_items)
- `weekly_menu_items` (references meal_items)
- NO `dishes` table
- NO `categories` table

---

## 🎯 Expected Outcome After Fixes

Once Codex applies all fixes and re-submits:

**Expected New Rating:** ~8.0/10 ✅ (return to original assessment)

**Why rating will increase:**
- Front-end implementation is excellent (unchanged)
- Database migration will work correctly
- All acceptance criteria will be met
- Only remaining follow-ups are E2E tests and native speaker review

**Merge Status:** Approve and merge (after fixes applied and tested)

---

## 📖 Reference Documents

**Detailed Review:**
- `docs/08-archive/completed-prs/PR-88-burmese-i18n-review-CORRECTED.md`

**Corrected Migration:**
- `supabase/migrations/20260104000002_add_burmese_columns_FIXED.sql`

**Schema References:**
- `supabase/migrations/001_init.sql` (lines 85-93: meal_items table)
- `supabase/migrations/20260104000001_weekly_menu_system.sql` (line 47: references meal_items)

---

## ❓ Questions for Codex

If anything is unclear about these fixes:

1. **Schema confusion?** Run the discovery commands above
2. **Migration testing?** Use: `psql $DB_URL -f <migration>`
3. **What's meal_items?** It's the table that stores dish/meal information
4. **Why no categories?** Schema doesn't have categories - items are categorized differently

---

## 🚀 Priority: Complete These Fixes ASAP

**Timeline:** Should take 1-2 hours to:
1. Apply migration fix (5 min)
2. Update guide (15 min)
3. Test migration (10 min)
4. Verify everything (30 min)
5. Re-submit PR (5 min)

**After fixes:** Rating returns to 8.0/10 and PR can be merged.

---

**Assigned:** Codex
**Reviewer:** Claude
**Status:** Awaiting fixes
**Priority:** P0 (Blocking)
