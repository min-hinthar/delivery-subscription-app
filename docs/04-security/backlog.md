# Security Backlog — Pragmatic yet Strict (S0)

This backlog is driven by `docs/SECURITY_REPORT.md`.  
Each item includes **scope**, **files**, **acceptance test**, and **owner**.

## P0 — Must Fix (Blocker)
### P0-1: Stripe webhook idempotency guard
- **Problem:** Webhook processing is not idempotent; replayed events can re-apply subscription/payment updates.
- **Risk:** High
- **Scope:** Stripe webhook processing + DB schema
- **Files likely touched:** `src/app/api/stripe/webhook/route.ts`, `supabase/migrations/*` (new `stripe_events` table)
- **Proposed fix:** Store Stripe event IDs on first processing; short-circuit subsequent deliveries.
- **Acceptance tests:** SECURITY_QA §5.2 (replay same Stripe event ID twice; second run is no-op)
- **Owner:** Backend
- **Target PR:** security-s1

## P1 — Should Fix (Next)
### P1-1: Rate limiting for Maps endpoints
- **Problem:** Geocode/directions endpoints lack abuse controls; risk of cost/DoS.
- **Risk:** Medium
- **Scope:** `/api/maps/*` and admin route building (uses directions)
- **Files likely touched:** `src/app/api/maps/*/route.ts`, `src/app/api/admin/routes/build/route.ts`, shared rate-limit utility
- **Proposed fix:** Add lightweight per-user/IP throttling with 429 responses; consider caching for repeated inputs.
- **Acceptance tests:** SECURITY_QA §7.2 (hammer endpoints; observe 429 + retryable message)
- **Owner:** Backend
- **Target PR:** security-s1

### P1-2: Baseline security headers + CSP report-only
- **Problem:** No baseline headers or CSP configured at the framework level.
- **Risk:** Medium
- **Scope:** All routes
- **Files likely touched:** `next.config.ts`
- **Proposed fix:** Add headers (nosniff, referrer policy, frame-ancestors) and CSP Report-Only starting policy.
- **Acceptance tests:** SECURITY_QA §9.1-9.2 (verify headers + Stripe/Maps still function)
- **Owner:** Platform
- **Target PR:** security-s2

## P2 — Nice to Have
### P2-1: Admin action audit log
- **Problem:** Admin route build/delete actions are not recorded in an audit log.
- **Risk:** Low
- **Scope:** Admin APIs
- **Files likely touched:** `src/app/api/admin/routes/*`, `supabase/migrations/*`
- **Proposed fix:** Add a simple `admin_audit_events` table and insert events on create/delete.
- **Acceptance tests:** Verify audit row inserted when admin builds/deletes a route.
- **Owner:** Backend
- **Target PR:** security-s2

---

## Done (Completed Items)
- [x] Baseline security docs present (overview, threat model, RLS, webhook security, headers/CSP, checklist) — S0 audit
