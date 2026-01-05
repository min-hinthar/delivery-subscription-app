# Routing Backlog (Next.js 16 Advanced Patterns)

## Goals
- Strong boundaries: marketing/auth/app/admin
- Modern UX: modal overlays with deep links for appointment details/edit
- No URL breakage unless explicitly noted
- Segment loading/error boundaries for perceived performance
- (app) is auth-only; (app)/(protected) enforces onboarding + primary address requirements

## Planned PRs
### R1 — Route groups + segment boundaries
- Add (marketing) and (auth) groups
- Move /onboarding into (app)
- Add group-level loading.tsx + error.tsx
- Keep URLs unchanged
**Status:** ✅ Completed (route groups in place; added schedule segment loading + protected layout env guard).

### R2 — Appointment detail canonical page + Schedule modal overlay
- Canonical: /appointment/[id]
- Intercept from /schedule with @modal + (..)appointment/[id]
- Back button closes modal; deep link works
**Status:** ✅ Completed (appointment routes live under protected gating; modal overlay preserved).

## Follow-ups discovered
- Add per-route error boundaries for data-heavy customer pages (e.g., `/schedule`, `/track`) to enable localized retry without relying on the group error boundary.
