# Claude/Codex Handoff Log

## Codex Session - Verify.sh stabilization
**Date:** 2026-01-07
**Branch:** work

### Implemented
- Added verify-only font optimization skip to avoid Google Fonts download failures.
- Cleaned lint warnings in tests and adjusted route handler typings for Next.js 16 params.
- Deferred Google font loading when `SKIP_FONT_OPTIMIZATION=1` to keep builds green in sandboxed environments.

### Tests
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- None.

### Status
- [x] Fixes implemented
- [x] Tests executed

## Codex Session - Lint/build cleanup
**Date:** 2026-01-05
**Branch:** codex/platform-p0-lint-build-fixes

### Implemented
- Removed unused imports/state and resolved lint warnings across analytics, orders, and driver pages.
- Replaced `any` usage with explicit types in driver dashboard and notifications APIs.
- Hardened performance monitor web-vitals typing and guard logging.
- Updated bundle analyzer config to use ESM import.

### Tests
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- `bash scripts/codex/verify.sh` fails in typecheck due to missing `next-intl`, `@react-email/components`, `resend`, and `web-vitals` modules in the sandbox.

### Status
- [x] Lint/build cleanup implemented
- [x] Tests executed

## Codex Session - A la carte orders migration fix
**Date:** 2026-01-05
**Branch:** codex/platform-p0-lint-build-fixes

### Implemented
- Made the à la carte orders policy creation idempotent using a `DO` block with `pg_policies` checks.
- Enabled RLS on `public.orders` and aligned policy to use `(SELECT auth.uid())` for stable query plans.

### Tests
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- `bash scripts/codex/verify.sh` fails in typecheck due to missing `next-intl`, `@react-email/components`, `resend`, and `web-vitals` modules in the sandbox.

### Status
- [x] Migration update implemented
- [x] Tests executed (typecheck blocked by missing deps)

## Codex Session - Mobile UX Enhancement
**Date:** 2026-01-05
**Branch:** codex/mobile-ux-optimization

### Implemented
- Added mobile bottom navigation with safe-area support and auto-hide on scroll.
- Added pull-to-refresh wrapper on tracking dashboard and swipeable modal utility.
- Added haptic feedback utilities and hooked into scheduling + appointment save actions.
- Added PWA manifest, install prompt, and SVG app icons.
- Updated mobile touch optimizations in global styles.

### Tests
- `pnpm test`
- `pnpm build`

### For Claude to Review
- Verify swipe-to-close UX in appointment modal and adjust layout if needed.
- Confirm PWA install prompt behavior on iOS/Android with SVG icons.

### Status
- [x] Feature implemented
- [x] Tests executed
- [ ] Claude review pending

## Codex Session - Weekly menu feedback follow-up
**Date:** 2026-01-06
**Branch:** codex/weekly-menu-feedback-followup

### Implemented
- Added admin weekly orders dashboard with assignment + status updates.
- Added customer weekly order history with reorder + cancel pending flow.
- Implemented transactional safety for menu generation/template creation and stricter weekly order policies.
- Added Stripe reconciliation + cleanup + delivery reminder cron routes.
- Added menu published + order confirmation + reminder email notifications.
- Added caching, loading skeletons, error states, and timezone-correct deadline calculation.
- Added API docs and QA checklist updates for weekly menu/order operations.

### Tests
- `pnpm test`
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- Ensure CRON_SECRET and RESEND_API_KEY are configured in production.

## Codex Session - PR #88 follow-up fixes
**Date:** 2026-01-06
**Branch:** work

### Implemented
- Replaced Burmese migration with meal_items-based columns and helper functions.
- Added locale persistence, E2E locale coverage, and QA/devex documentation updates.
- Added SKIP_FONT_OPTIMIZATION fallback to avoid Google Fonts download failures.
- Updated types to use MealItem naming aligned with schema.

### Tests
- `bash scripts/codex/verify.sh` (failed: missing next-intl/@react-email/resend deps in environment)

### Notes / Blockers
- Typecheck fails in Codex environment due to missing dependencies (see verify output).

### Status
- [x] Fixes implemented
- [ ] Tests fully green (dependency gaps in sandbox)

## Codex Session - Supabase migration hotfix
**Date:** 2026-01-06
**Branch:** hotfix/supabase-resource-exhaustion-and-017-migration

### Implemented
- Repaired `supabase/migrations/017_driver_authentication.sql` by removing truncated policy fragments, deduplicating policies, and restoring valid RLS blocks.
- Added migration validation script (`scripts/codex/verify-migrations.sh`) and wired it into `scripts/codex/verify.sh`.
- Documented migration validation env requirements in `docs/07-workflow/codex-devex.md`.

### Tests
- Not run (requires Supabase migration DB URL / environment setup).

### For Claude to Review
- Confirm policy naming conventions and admin scoping align with security expectations.
- Decide whether additional indexes or query optimizations are needed for driver-related queries.

### Notes / Blockers
- Unable to access Supabase Usage/Logs dashboards from this environment; production resource-exhaustion root cause requires operator review.

### Status
- [x] Hotfix implemented
- [ ] Tests executed
- [ ] Claude review pending

## Codex Session - Supabase stats workflow update
**Date:** 2026-01-06
**Branch:** hotfix/supabase-resource-exhaustion-and-017-migration

### Implemented
- Added `scripts/codex/verify-supabase-stats.sh` to query `pg_stat_statements` and invoke Supabase `splinter` when available.
- Wired Supabase stats check into `scripts/codex/verify.sh` and documented usage in `docs/07-workflow/codex-devex.md`.

### Tests
- Not run (requires `SUPABASE_STATS_DB_URL` and `psql`; splinter optional).

### For Claude to Review
- Confirm desired stats retention and whether we should add specific query budget checks.

### Status
- [x] Workflow updated
- [ ] Tests executed
- [ ] Claude review pending

## Codex Session - Security/performance advisor remediation
**Date:** 2026-01-06
**Branch:** hotfix/supabase-resource-exhaustion-and-017-migration

### Implemented
- Added migration `018_security_performance_hotfix.sql` to lock function search_path, add FK indexes, and wrap RLS auth calls with `select` for plan stability.
- Updated security checklist/report with Supabase linter remediations and open ops actions.

### Tests
- Not run (migration DB URL required for full SQL apply).

### For Claude to Review
- Confirm any remaining policy consolidations should be addressed in a follow-up security pass.

### Status
- [x] Remediations added
- [ ] Tests executed
- [ ] Claude review pending

## Codex Session - Weekly menu system foundation
**Date:** 2026-01-05
**Branch:** codex/weekly-menu-system

### Implemented
- Added weekly menu system schema/migration with templates, weekly menus/items, packages, and weekly orders.
- Built customer weekly menu UI, package selector, weekly checkout flow, and supporting API routes.
- Added admin template creation, weekly menu generation, and status publishing tooling.
- Updated marketing weekly menu query to new schema and added helper utilities + tests.
- Updated progress/backlog + admin operations/QA UX docs for the new flow.

### Tests
- `pnpm test` (failed: existing notification test expects browser permissions)
- `pnpm build` (passed)
- `bash scripts/codex/verify.sh` (passed with existing lint warnings)

### For Claude to Review
- Confirm weekly menu publish workflow + status copy are aligned with product expectations.
- Validate weekly menu ordering deadlines/timezone assumptions.

### Status
- [x] Weekly menu system implemented
- [x] Build + verify completed
- [ ] Tests fully green (browser-notifications.test.ts failure pre-existing)
- [ ] Claude review pending

## Codex Session - Burmese language support
**Date:** 2026-01-05
**Branch:** codex/burmese-language-support

### Implemented
- Added next-intl configuration, locale-aware routing under `/[locale]`, and middleware-driven locale detection.
- Added Burmese/English message catalogs, font setup (Noto Sans + Myanmar), and language switcher UI.
- Localized weekly menu + package selector with locale-aware dish/package fields and fallback handling.

## Codex Session - Admin meal management + locale fixes
**Date:** 2026-01-06
**Branch:** codex/ui-p1-admin-fixes

### Implemented
- Disabled locale auto-detection to keep English as the default entry point and added locale-aware path helpers for navigation links.
- Normalized driver guard locale handling to allow pending drivers to reach onboarding.
- Added admin meal and meal plan template toggles plus supporting API endpoints.
- Hid the mobile bottom nav on non-app marketing routes and localized navigation destinations.

### Tests
- `bash scripts/codex/verify.sh` (fails in sandbox due to missing `@vercel/analytics` and `@vercel/speed-insights` types)

### Notes / Blockers
- Typecheck blocked by missing Vercel analytics/speed-insights packages in the environment.
- Added Burmese columns migration for dishes/categories and localization helpers + tests.
- Added bilingual order confirmation email template + sending helper.

### Tests
- `pnpm test`
- `pnpm build`
- `bash scripts/codex/verify.sh`

### For Claude to Review
- Validate locale UX around redirects and nav behavior across auth/admin/driver routes.
- Confirm Burmese translation tone + terminology for community alignment.

### Notes / Blockers
- `bash scripts/codex/verify.sh` reported existing ESLint warnings (pre-existing unused vars + img lint).

### Status
- [x] Feature implemented
- [x] Tests executed
- [ ] Claude review pending

## Codex Session - PR #80 feedback follow-up
**Date:** 2026-01-05
**Branch:** codex/ui-p1-mobile-ux-feedback

### Implemented
- Added missing tests for SwipeableModal, MobileBottomNav, and InstallPrompt.
- Hardened install prompt storage handling, extracted timing constants, and tweaked pull-to-refresh scroll threshold.
- Updated haptics to respect reduced-motion and added default button haptic feedback.
- Cleaned up lint warnings across admin route builder, tracking map, and map tests.
- Documented new mobile QA check for reduced-motion haptics.

### Tests
- `bash scripts/codex/verify.sh` (lint passed; typecheck failed: missing next-intl/react-email/resend deps in this environment).

### Notes / Blockers
- `tsc --noEmit` fails locally due to missing `next-intl`, `@react-email/components`, and `resend` packages/types in this environment.

### Status
- [x] Feedback items implemented
- [x] Tests executed (lint)
- [ ] Typecheck clean (blocked by missing deps)

## Codex Session - Routing hardening and font fallback
**Date:** 2026-01-07
**Branch:** codex/routing-r1-locale-hardening

### Implemented
- Added locale validation in the locale layout to 404 on unsupported locales.
- Disabled Myanmar-specific font loading and body class toggles to avoid serverless font invocation errors.
- Updated QA UX checklist to reflect Myanmar fallback font expectations.

### Tests
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- None.

### Status
- [x] Feature implemented
- [x] Tests executed
- [ ] Claude review pending

## Codex Session - Locale proxy rewrites (no middleware)
**Date:** 2026-01-07
**Branch:** codex/routing-r1-locale-proxy

### Implemented
- Removed Next.js middleware for locale detection to avoid edge runtime errors.
- Added proxy rewrites that route locale-less URLs to `/en` or `/my` based on the `NEXT_LOCALE` cookie.
- Updated language switcher to set locale cookie and navigate without locale prefixes.
- Documented proxy-based locale routing in routing standards.

### Tests
- `bash scripts/codex/verify.sh`

### Notes / Blockers
- Locale-prefixed URLs still resolve, but the UI now links to locale-less paths by design.

### Status
- [x] Feature implemented
- [x] Tests executed
- [ ] Claude review pending
