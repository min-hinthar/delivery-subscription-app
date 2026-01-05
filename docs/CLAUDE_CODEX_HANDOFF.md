# Claude/Codex Handoff Log

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
