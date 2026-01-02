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

**Planned PR:** `codex/platform-p0-devex`

### P0 — Best-effort sync to latest main in Codex
**Problem:** Codex environments may not have `origin/main`.  
**Acceptance:**
- Provide `scripts/codex/git-sync-main.sh`
- AGENTS.md requires best-effort sync
- PRs note base if origin unavailable

**Planned PR:** `codex/platform-p0-devex`

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

**Planned PR:** `codex/auth-p0-admin-login-fix`

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
- Use message: “No active account found or credentials are incorrect. Please sign up.”
- Same message for invalid vs no user (avoid enumeration)

**Planned PR:** `codex/auth-p0-admin-login-fix`

---

## Workstream: UI / UX

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
