# Security Overview (Pragmatic yet Strict) — 2025/2026

This document defines the security architecture, trust boundaries, and non-negotiable rules for the
Morning Star Weekly Delivery App (Next.js 16 + Supabase + Stripe + Google Maps).

## Goals
- Protect customer PII (name, phone, address)
- Prevent unauthorized access (IDOR, auth bypass)
- Ensure subscription state cannot be spoofed
- Prevent abuse (rate-limit expensive endpoints)
- Preserve UX: strict controls, but rolled out without breaking legitimate users

## Roles & Permissions
### Customer
- Owns: profile, addresses, appointments, orders, payment history
- Can: read/write only their own records (via Supabase RLS + server checks)

### Admin (profiles.is_admin = true)
- Can: view all upcoming deliveries, routes/stops, export manifests, manage windows/meals
- Must: be explicitly gated in UI and server routes

## Trust Boundaries (Non-negotiable)
### Client (browser) is untrusted
- Never trust client-provided user IDs, Stripe IDs, or pricing data
- All writes must be validated server-side
- Client may only use public keys (Supabase anon, NEXT_PUBLIC values)

### Server (Next.js Route Handlers) is trusted *only with least privilege*
- Service Role key is server-only
- Stripe secret key is server-only
- Google Maps server key is server-only (geocode/directions)

### Supabase RLS is mandatory
- Every user-owned table has RLS enabled
- Policies enforce ownership
- Admin-only tables enforce is_admin checks
- Server “admin client” can bypass RLS only for webhooks/cron/admin ops (and must remain server-only)

## Data Classification
### P0 — Highly sensitive
- Full addresses, phone numbers, lat/lng
- Stripe customer/subscription identifiers
- Session tokens/cookies

### P1 — Sensitive
- Delivery appointment window selection
- Order history

### P2 — Low sensitivity
- Public marketing content, pricing page copy

## Key Security Invariants (Must Always Hold)
1) Unauthenticated users cannot access protected routes or data.
2) Users cannot access other users’ rows, even if they guess IDs (RLS + server-side checks).
3) Stripe is the source of truth for subscription state; webhooks are verified and idempotent.
4) Maps geocode/directions only executed server-side; keys never exposed to the client.
5) No secrets committed; `.env.local` never committed; `.env.example` maintained.
6) PII is not logged (addresses/phones redacted or omitted).

## Entry Points (Attack Surface)
- Auth pages and callbacks
- Route Handlers under `src/app/api/**`
- Stripe webhook endpoint
- Cron endpoints (weekly generation)
- Maps endpoints (geocode/directions)

## Operational Expectations
- CSP is rolled out in Report-Only first, then enforced after violations are addressed.
- Rate limits start pragmatic (protect expensive endpoints), then tightened based on logs/abuse signals.
- Dependency updates follow a policy (see DEPENDENCY_POLICY if added later).
