# Remaining i18n Cleanup Tasks

## Status
Core i18n infrastructure has been removed. A few translation function calls remain that need hardcoding.

## Files Needing Manual Translation Replacement

### 1. `/src/components/menu/package-selector.tsx`
- **Lines to fix**: Still has a few `t()` calls in the details section
- **Action**: Replace with hardcoded English strings
- **Est. time**: 5 minutes

### 2. `/src/components/menu/weekly-menu-view.tsx`
- **Lines to fix**: Multiple `t()`, `tCommon()`, and `tDays()` calls throughout
- **Action**: Replace all translation function calls with English strings:
  - `t("errorMessage")` → `"An error occurred"`
  - `t("errorTitle")` → `"Error Loading Menu"`
  - `tCommon("retry")` → `"Retry"`
  - `t("noMenuAvailable")` → `"No Menu Available"`
  - `t("title")` → `"This Week's Menu"`
  - `t("orderBy")` → `"Order by"`
  - `tDays("monday")` → `"Monday"` (and other days)
  - etc.
- **Est. time**: 15 minutes

### 3. `/src/components/auth/driver-guard.tsx`
- **Action**: Verify no remaining i18n imports
- **Est. time**: 2 minutes

## How to Fix

For each file:
1. Open the file
2. Find all `t()`, `tCommon()`, `tDays()`, etc. calls
3. Replace with appropriate English strings
4. Remove any remaining i18n-related imports
5. Run `pnpm typecheck` to verify

## Quick Fix Script

```bash
# Search for remaining translation calls
grep -r "useTranslations\|getTranslations" src/components src/app
```

## After Cleanup

1. Run `pnpm typecheck` - should pass with 0 errors
2. Run `pnpm build` - should complete successfully
3. Delete this file
4. Commit final changes

---

**Note**: The main routing structure has been successfully migrated. These remaining items are only translation string replacements in a few components.
