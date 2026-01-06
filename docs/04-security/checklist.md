# Security Checklist (Pre-merge / Pre-release) — 2025/2026

Use this checklist for PR review and before deployments.

## Auth / Session
- [x] Protected pages require auth; logged-out users are redirected with a friendly message
- [x] No open redirects (returnTo/redirect params allow internal paths only)
- [x] Session cookies are secure and not exposed in client code

## Authorization / IDOR
- [x] Users cannot access other users' resources by guessing IDs
- [x] Admin pages and APIs require `profiles.is_admin = true`
- [x] Server-side checks exist for any cross-tenant access
- [x] Driver pages and APIs require active driver profiles
- [x] Driver routes are scoped to `delivery_routes.driver_id = auth.uid()` via RLS
- [x] Weekly orders cannot be modified by customers after a driver is assigned

## Supabase RLS
- [x] RLS enabled on all user-owned tables
- [x] Ownership policies exist for SELECT/INSERT/UPDATE/DELETE as needed
- [x] Admin-only tables restricted to admins
- [x] Service role usage is server-only
- [x] RLS policies wrap `auth.*()` calls with `(select auth.*())` for plan stability
- [x] Security helper functions set `search_path` explicitly (no role-mutable defaults)

## Input Validation
- [x] Every mutating API validates input (zod)
- [x] Errors do not leak secrets or full PII (improved in driver invite API)
- [x] Logs avoid PII (addresses, phones) or redact them
- [x] Driver invite/login flows are rate limited (invite + magic link)

## Stripe
- [x] Webhook signature verification is enforced
- [x] Webhook processing is idempotent (store processed event IDs in `stripe_events`)
- [x] Client never supplies trusted Stripe IDs
- [x] Portal/Checkout sessions created server-side only

## Cron / Background
- [x] Cron endpoint protected by `CRON_SECRET`
- [x] Cron is idempotent and safe to rerun
- [x] Cron does not leak data in responses/logs

## Maps / Expensive Endpoints
- [x] Geocode/directions run server-side with server key
- [x] Rate limit exists (by IP/user) or strong abuse prevention is in place (429 + Retry-After)
- [x] Caching considered for repeated addresses/routes

## Media Uploads
- [x] Signed photo URL endpoints are rate limited (429 + Retry-After)

## Headers & CSP
- [x] Baseline security headers present
- [x] CSP Report-Only rolled out; enforce only after violations resolved
- [x] No unsafe script directives in production without justification
> Implementation note: baseline headers and CSP Report-Only are configured in `next.config.ts`
> (see `docs/HEADERS_AND_CSP.md` for the exact policy and rollout steps).

## Dependencies
- [x] No new packages added without a reason
- [x] Lockfile committed and consistent
- [x] Critical CVEs addressed promptly (policy documented if present)

## Performance & Build Optimization (Added 2026-01-06)
- [x] React components memoized where appropriate (driver cards, list items)
- [x] Lazy loading implemented for heavy components
- [x] Vercel build configuration optimized (compression, caching, package imports)
- [x] Next.js Image optimization configured
- [x] Static assets cached with appropriate headers
