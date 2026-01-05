# Security Checklist (Pre-merge / Pre-release) — 2025/2026

Use this checklist for PR review and before deployments.

## Auth / Session
- [ ] Protected pages require auth; logged-out users are redirected with a friendly message
- [ ] No open redirects (returnTo/redirect params allow internal paths only)
- [ ] Session cookies are secure and not exposed in client code

## Authorization / IDOR
- [ ] Users cannot access other users’ resources by guessing IDs
- [ ] Admin pages and APIs require `profiles.is_admin = true`
- [ ] Server-side checks exist for any cross-tenant access
- [ ] Driver pages and APIs require active driver profiles
- [ ] Driver routes are scoped to `delivery_routes.driver_id = auth.uid()` via RLS
- [ ] Weekly orders cannot be modified by customers after a driver is assigned

## Supabase RLS
- [ ] RLS enabled on all user-owned tables
- [ ] Ownership policies exist for SELECT/INSERT/UPDATE/DELETE as needed
- [ ] Admin-only tables restricted to admins
- [ ] Service role usage is server-only
- [ ] RLS policies wrap `auth.*()` calls with `(select auth.*())` for plan stability
- [ ] Security helper functions set `search_path` explicitly (no role-mutable defaults)

## Input Validation
- [ ] Every mutating API validates input (zod)
- [ ] Errors do not leak secrets or full PII
- [ ] Logs avoid PII (addresses, phones) or redact them
- [ ] Driver invite/login flows are rate limited (invite + magic link)

## Stripe
- [ ] Webhook signature verification is enforced
- [ ] Webhook processing is idempotent (store processed event IDs in `stripe_events`)
- [ ] Client never supplies trusted Stripe IDs
- [ ] Portal/Checkout sessions created server-side only

## Cron / Background
- [ ] Cron endpoint protected by `CRON_SECRET`
- [ ] Cron is idempotent and safe to rerun
- [ ] Cron does not leak data in responses/logs

## Maps / Expensive Endpoints
- [ ] Geocode/directions run server-side with server key
- [ ] Rate limit exists (by IP/user) or strong abuse prevention is in place (429 + Retry-After)
- [ ] Caching considered for repeated addresses/routes

## Media Uploads
- [ ] Signed photo URL endpoints are rate limited (429 + Retry-After)

## Headers & CSP
- [ ] Baseline security headers present
- [ ] CSP Report-Only rolled out; enforce only after violations resolved
- [ ] No unsafe script directives in production without justification
> Implementation note: baseline headers and CSP Report-Only are configured in `next.config.ts`
> (see `docs/HEADERS_AND_CSP.md` for the exact policy and rollout steps).

## Dependencies
- [ ] No new packages added without a reason
- [ ] Lockfile committed and consistent
- [ ] Critical CVEs addressed promptly (policy documented if present)
