# Backlog (Codex Workstreams)

**How to use**
- Every PR should link to 1+ backlog items.
- Priorities:
  - **P0**: blocks shipping / causes crashes / breaks verify/build / security risk
  - **P1**: major UX pain, conversion issues, admin ops friction
  - **P2**: nice-to-have polish, optimizations

---

## Workstream: Platform / DevEx

### P0 — Verify/build must pass in ephemeral environments
**Problem:** `pnpm build` fails in Codex/CI due to missing env vars and strict env throw.
**Acceptance:**
- `bash scripts/codex/verify.sh` passes with no real secrets provided
- Strict runtime env checks remain in real env (Vercel), not weakened
- Documented in `docs/CODEX_DEVEX.md`

**Status:** ✅ Done (2026-01-05)
**Implementation:**
- Created `scripts/codex/load-env.sh` with safe stub env values
- Updated `scripts/codex/verify.sh` to source load-env.sh
- Updated `src/lib/supabase/env.ts` to be tolerant during CODEX_VERIFY
- Documented in `docs/07-workflow/codex-devex.md`
- Verification: `bash scripts/codex/verify.sh` passes ✅

### P0 — Best-effort sync to latest main in Codex
**Problem:** Codex environments may not have `origin/main`.
**Acceptance:**
- Provide `scripts/codex/git-sync-main.sh`
- AGENTS.md requires best-effort sync
- PRs note base if origin unavailable

**Status:** ✅ Done (2026-01-05)
**Implementation:**
- Created `scripts/codex/git-sync-main.sh` with best-effort sync logic
- Script handles missing origin/main gracefully
- Documented in workflow files

---

## Workstream: Routing / Auth

### P0 — Protected routing audit (R1)
**Problem:** protected/onboarding routes needed a full audit for Supabase/Stripe gating and redirect loops.  
**Acceptance:**
- (app) layout remains auth-only; (protected) enforces onboarding + primary address
- Onboarding redirects to `/account` when complete
- Appointment routes are protected and rely on server-verified state
- Private APIs return `Cache-Control: no-store`

**Planned PR:** `codex/r1-protected-routing-supabase-stripe-audit`  
**Status:** ✅ Done

### P2 — Per-route error boundaries for customer scheduling flows
**Problem:** group-level error boundaries cover all (app) pages, but `/schedule` and `/track` would benefit from localized retry without losing shell state.  
**Acceptance:**
- Add `error.tsx` for `/schedule` and `/track` segments
- Provide “Retry” CTA via `reset()` and a secondary link back to `/account`
- Keep layouts server-driven and auth-gated

**Planned PR:** `codex/routing-r1-groups-boundaries`

### P0 — Fix /admin/login redirect loop and compilation crashes
**Problem:** admin login nested under admin-gated layout causes loop/crash.
**Acceptance:**
- `/admin/login` loads reliably, no infinite redirects
- Admin pages remain protected server-side (`profiles.is_admin`)
- Manual QA step documented in PR

**Status:** ✅ Done (2026-01-05)
**Implementation:**
- Created route group `(admin-auth)` for `/admin/login` (no protection)
- Created route group `(admin)` for admin pages (AdminGuard protection)
- AdminGuard redirects unauthenticated users to `/admin/login`
- Admin login redirects authenticated users to `/admin`
- Server-side protection via `profiles.is_admin` check in AdminGuard
- No redirect loops confirmed

### P0 — Fix onboarding redirect loop after magic link confirm
**Problem:** auth callback redirects loop between `/auth/callback` and `/onboarding`.  
**Acceptance:**
- Confirm link lands on `/onboarding` once without repeating redirects
- Visiting `/schedule` pre-onboarding redirects to `/onboarding` once
- Onboarded users can access `/account`, `/schedule`, `/track`

**Planned PR:** `codex/p0-fix-onboarding-redirect-loop`  
**Status:** ✅ Done

### P1 — Friendly auth errors (no user enumeration)
**Problem:** confusing auth errors; missing account should show signup guidance.
**Acceptance:**
- Use message: "No active account found or credentials are incorrect. Please sign up."
- Same message for invalid vs no user (avoid enumeration)

**Status:** ✅ Done (2026-01-05)
**Implementation:**
- Created `src/lib/auth/errorMessages.ts` with `friendlyAuthError()` function
- Returns "No active account found or credentials are incorrect. Please sign up." for invalid credentials
- Used in both `/login` and `/admin/login` via AuthForm component
- Prevents user enumeration by showing same message for invalid/non-existent accounts

---

## Workstream: UI / UX

### P0 — Mobile UX Enhancement
**Problem:** Mobile experience needs bottom navigation, touch-friendly tap targets, and PWA support.
**Acceptance:**
- Bottom navigation available on mobile
- Tap targets ≥44px
- Swipeable modals + pull-to-refresh supported
- PWA manifest + install prompt enabled
- Safe area support for notched devices

**Planned PR:** `codex/mobile-ux-optimization`
**Status:** ✅ Done (PR #80 merged)
**Review:** See `docs/08-archive/completed-prs/PR-80-mobile-ux-optimization-review.md`
**Rating:** 8.5/10 - Production-ready with minor test coverage improvements recommended

---

## Workstream: Community / Localization

### P0 — Burmese language support (next-intl)
**Problem:** Burmese-speaking customers need a fully localized UI with proper font support.
**Acceptance:**
- Language switcher available in the header, preserving locale across routes. ✅
- Locale-prefixed routes work for Burmese (`/my/...`) with English default (`/`). ✅
- Burmese font styling (Noto Sans Myanmar) applied with readable typography. ✅
- Weekly menu + package selector use translations and localized meal item/package fields with English fallback. ✅
- Migration adds Burmese columns for meal items and helper functions for locale-aware names. ✅

**Planned PR:** `codex/burmese-language-support`
**Status:** ✅ Done (PR #88, Rating: 8.5/10)
**Review:** See `docs/08-archive/completed-prs/PR-88-burmese-i18n-review-CORRECTED.md`

**What Works:**
- ✅ next-intl integration excellent
- ✅ 199 complete translations (en + my)
- ✅ Language switcher with proper routing
- ✅ Typography optimization for Burmese script
- ✅ Helper functions and components well-coded
- ✅ Migration corrected for meal_items schema

**Follow-ups (Pre-Launch QA):**
- Native Burmese speaker review of translations before production launch

### P1 — Mobile nav overlay background/z-index issues
**Problem:** transparent overlays and stacking issues on mobile nav and dropdowns.  
**Acceptance:**
- Solid sheet background (`bg-background`)
- Proper overlay/backdrop
- No bleed-through, correct z-index layering
- Works in dark/light

**Planned PR:** `codex/ui-p1-nav-contrast-gradients`

### P1 — Fix contrast for buttons and text across themes
**Problem:** low contrast in dark/light.  
**Acceptance:**
- WCAG-aware contrast (primary buttons readable)
- Focus states visible

**Planned PR:** `codex/ui-p1-nav-contrast-gradients`

### P2 — Enhanced hover/interactions (gradient effects)
**Problem:** UI feels flat.  
**Acceptance:**
- Subtle hover gradients for key CTAs
- Respect `prefers-reduced-motion`
- No performance regressions

**Planned PR:** `codex/ui-p1-nav-contrast-gradients`

---

## Workstream: Customer / Weekly Menu System

### P0 — Weekly menu system (templates + packages + orders)
**Acceptance:**
- Admin can create menu templates with 7 days × 3 dishes.
- Admin can generate weekly menus from templates for a Sunday start date.
- Customers can view the published weekly menu grouped by day.
- Customers can select Package A/B/C and place a weekly order before the deadline.
- Order deadline enforcement (Wednesday 11:59 PM) prevents late orders.

**Planned PR:** `codex/weekly-menu-system`
**Status:** ✅ Done (PR #85, Rating: 7.5/10)
**Review:** See `docs/08-archive/completed-prs/PR-85-weekly-menu-system-review.md`
**Follow-ups Required:**
- Email notifications for order confirmation and delivery reminders
- Admin UI for weekly order management and driver assignment
- Test coverage improvements (E2E tests for order flow)
- Order reconciliation job for Stripe payment mismatches

---

## Workstream: Marketing / Public pages

### P1 — Public ZIP coverage check on homepage
**Problem:** users need to check eligibility before signup.  
**Acceptance:**
- Public ZIP form on homepage
- Calls server endpoint to verify coverage from kitchen origin
- Returns eligible/ineligible + reason + ETA/distance when eligible
- Rate limiting and caching by ZIP implemented

**Planned PR:** `codex/marketing-p1-coverage-menu`

### P1 — Public weekly chef-curated menu on homepage
**Problem:** improve conversion by showing menus.  
**Acceptance:**
- Public “This week’s menu” section
- If none published, show friendly empty state
- If DB tables added, RLS allows public select only for published menus

**Planned PR:** `codex/marketing-p1-coverage-menu`

---

### P1 — Admin Weekly Menu Management (service-role API)
**Acceptance:** /admin/menus CRUD weekly menus/items + reorder + publish + add from catalog.
**Planned PR:** codex/admin-menu-crud
**Status:** ✅ Implemented in codex/admin-menu-crud
