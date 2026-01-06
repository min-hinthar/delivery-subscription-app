# i18n Removal Summary

**Date:** 2026-01-06
**Status:** ✅ Completed
**Impact:** High - Architecture Change

---

## Why i18n Was Removed

The application encountered a critical error with Next.js 16's static rendering requirements:

```
Failed to create Supabase client: Error: Dynamic server usage: Route /[locale] couldn't be rendered statically because it used `cookies`.
```

### Root Cause

- The `[locale]` dynamic route segment conflicted with Next.js 16's static generation
- Supabase client creation requires `cookies()` which marks routes as dynamic
- The middleware and locale handling prevented proper static optimization
- Myanmar/Burmese language support was still experimental and not production-critical

### Decision

Remove i18n implementation entirely and operate in English-only mode. Myanmar language support is **on hold indefinitely** until:
1. Business validates actual demand from Myanmar-speaking users
2. Technical solution found that doesn't conflict with static rendering
3. Alternative approaches (e.g., client-side only translations) are evaluated

---

## What Was Removed

### Files Deleted
- `/src/app/[locale]/` - Entire locale directory structure
- `/src/middleware.ts` - next-intl middleware
- `/src/i18n.ts` - i18n configuration
- `/src/lib/i18n-helpers.ts` - Locale helper functions
- `/src/lib/i18n-helpers.test.ts` - Helper tests
- `/src/components/language-switcher.tsx` - Language toggle component
- `/src/app/api/locale/` - Locale API endpoint
- `/messages/en.json` - English translations
- `/messages/my.json` - Myanmar translations
- `/tests/e2e/i18n.spec.ts` - i18n E2E tests

### Dependencies Removed
- `next-intl` package (v4.7.0)

### Code Changes
1. **App Structure**: Moved all routes from `/src/app/[locale]/*` to `/src/app/*`
2. **Root Layout**: Removed `cookies()` import and locale detection
3. **Components**: Replaced `useTranslations()` with hardcoded English strings
4. **Navigation**: Removed locale-aware routing and `LanguageSwitcher`
5. **Admin Pages**: Removed `getLocale()` and `getLocalizedPathname()` calls
6. **Configuration**: Removed `next-intl` plugin from `next.config.ts`

---

## Files Modified

### Core Application Files
- `/src/app/layout.tsx` - Removed locale cookie reading, hardcoded lang="en"
- `/src/components/navigation/site-header.tsx` - Replaced translations with English strings
- `/src/components/navigation/mobile-bottom-nav.tsx` - Replaced translations with English strings
- `/next.config.ts` - Removed `createNextIntlPlugin` wrapper
- `/package.json` - Removed `next-intl` dependency

### Admin Pages
- `/src/app/(admin)/admin/menus/page.tsx`
- `/src/app/(admin)/admin/meals/page.tsx`
- `/src/app/(admin)/admin/menus/generate/page.tsx`
- `/src/app/(admin)/admin/menus/templates/page.tsx`
- `/src/app/(admin)/admin/menus/templates/new/page.tsx`

### Components
- `/src/components/admin/weekly-menu-list.tsx`
- `/src/components/menu/weekly-menu-view.tsx`
- `/src/components/menu/package-selector.tsx`

---

## Migration Path

### Before (with i18n)
```typescript
// Route structure
/src/app/[locale]/
  ├── (marketing)/
  │   └── page.tsx
  ├── (auth)/
  │   └── login/page.tsx
  └── layout.tsx

// Component usage
const t = useTranslations();
<h1>{t("branding.appName")}</h1>
```

### After (English-only)
```typescript
// Route structure
/src/app/
  ├── (marketing)/
  │   └── page.tsx
  ├── (auth)/
  │   └── login/page.tsx
  └── layout.tsx

// Component usage
<h1>Morning Star Weekly Delivery</h1>
```

---

## Testing Recommendations

After this change, verify:

1. **Routing**
   - [ ] All pages load without locale prefix
   - [ ] No 404s from old `/en/` or `/my/` routes
   - [ ] Internal links work correctly

2. **Supabase Integration**
   - [ ] Client creation succeeds without cookies error
   - [ ] Auth flows work correctly
   - [ ] RLS policies enforce correctly

3. **Build Process**
   - [ ] `pnpm build` succeeds
   - [ ] Static pages generate correctly
   - [ ] No dynamic server errors

4. **Components**
   - [ ] Site header renders with English text
   - [ ] Mobile bottom nav shows English labels
   - [ ] Admin pages display correctly
   - [ ] No console errors about missing translations

---

## Future Considerations

If Myanmar language support is needed in the future:

### Option 1: Client-Side Only i18n
- Use `next-intl` without middleware
- Store locale in localStorage/cookies client-side
- No server-side locale detection
- **Pros**: No SSR issues, simpler architecture
- **Cons**: SEO limitations, no `/my/` URLs

### Option 2: Separate Deployment
- Deploy separate instance for Myanmar language
- Different domain or subdomain (my.mandalaymorningstar.com)
- Fully translated codebase
- **Pros**: Clean separation, no routing complexity
- **Cons**: More infrastructure, harder to maintain

### Option 3: Database-Driven Content
- Store all UI strings in database
- Fetch translations at runtime
- Use React Context for language switching
- **Pros**: Dynamic, manageable by non-developers
- **Cons**: Performance overhead, more complex

### Option 4: Wait for Next.js Updates
- Monitor Next.js improvements to dynamic routes + cookies
- Re-evaluate when Next.js 17+ stabilizes
- **Pros**: Cleanest solution if supported
- **Cons**: Uncertain timeline

---

## Documentation Updates

The following documentation was updated to reflect i18n removal:

- `docs/02-planning/feature-specs/burmese-i18n.md` - Marked as DEPRECATED
- This file (`docs/01-active/I18N_REMOVAL_SUMMARY.md`) - Created
- README.md - No changes needed (no i18n mentioned)

---

## Rollback Procedure

If needed to restore i18n (not recommended):

1. Restore from git: `git checkout <commit-before-removal>`
2. Review changes in this PR
3. Consider alternative middleware approach
4. Test thoroughly with Next.js 16

**Note**: Before rolling back, review why it was removed and ensure the technical issues are resolved.

---

**Status**: Application now operates in English-only mode. Myanmar language support is on hold pending business validation and technical solution.
