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

## Supabase RLS
- [ ] RLS enabled on all user-owned tables
- [ ] Ownership policies exist for SELECT/INSERT/UPDATE/DELETE as needed
- [ ] Admin-only tables restricted to admins
- [ ] Service role usage is server-only

## Input Validation
- [ ] Every mutating API validates input (zod)
- [ ] Errors do not leak secrets or full PII
- [ ] Logs avoid PII (addresses, phones) or redact them

## Stripe
- [ ] Webhook signature verification is enforced
- [ ] Webhook processing is idempotent (store processed event IDs)
- [ ] Client never supplies trusted Stripe IDs
- [ ] Portal/Checkout sessions created server-side only

## Cron / Background
- [ ] Cron endpoint protected by `CRON_SECRET`
- [ ] Cron is idempotent and safe to rerun
- [ ] Cron does not leak data in responses/logs

## Maps / Expensive Endpoints
- [ ] Geocode/directions run server-side with server key
- [ ] Rate limit exists (by IP/user) or strong abuse prevention is in place
- [ ] Caching considered for repeated addresses/routes

## Headers & CSP
- [ ] Baseline security headers present
- [ ] CSP Report-Only rolled out; enforce only after violations resolved
- [ ] No unsafe script directives in production without justification

## Dependencies
- [ ] No new packages added without a reason
- [ ] Lockfile committed and consistent
- [ ] Critical CVEs addressed promptly (policy documented if present)
