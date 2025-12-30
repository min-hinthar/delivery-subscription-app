# Headers & CSP — Pragmatic yet Strict Rollout (2025/2026)

This app uses Next.js config headers to set security headers consistently.

## Baseline Headers (Recommended)
Apply to all routes unless noted.

- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Frame-Options: DENY (or use CSP frame-ancestors)
- Permissions-Policy: disable unused powerful APIs
- Strict-Transport-Security: (prod only) max-age=31536000; includeSubDomains; preload
- Cross-Origin-Opener-Policy: same-origin (may affect some integrations; validate)
- Cross-Origin-Resource-Policy: same-site (pragmatic default; verify for assets)

> NOTE: Some headers can break third-party if too strict. Keep “strict” but verify Stripe/Maps flows.

## CSP Rollout Strategy
We start with **Content-Security-Policy-Report-Only** (CSP-RO) to observe violations without breaking UX.
After 1–2 iterations of fixing/allowlisting, we switch to enforced CSP.

### Phase 1 — CSP Report-Only (default)
- Add `Content-Security-Policy-Report-Only` header.
- Collect violations (browser devtools; optionally a report endpoint later).
- Fix violations by removing inline scripts, minimizing unsafe directives, or allowlisting exact origins.

### Phase 2 — Enforce CSP
- Replace CSP-RO with `Content-Security-Policy`.
- Keep a tight allowlist for:
  - Stripe JS
  - Google Maps JS/resources
  - Supabase project URL for connect-src
- Avoid `unsafe-eval` in production.
- Avoid `unsafe-inline` for scripts; allow nonces only if you implement them.

## CSP Template (Starting Point, Report-Only)
Replace placeholders:
- SUPABASE_URL: your project URL (https://xxxx.supabase.co)
- Optional: analytics domains if you add them

Example (pragmatic baseline):
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com;
font-src 'self';
style-src 'self' 'unsafe-inline';
script-src 'self' https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
connect-src 'self' SUPABASE_URL https://api.stripe.com https://maps.googleapis.com;

## Current Policy (Implemented in `next.config.ts`)
As of `codex/security-s2`, the CSP Report-Only header is configured with the following directives
(Supabase URL is injected from `NEXT_PUBLIC_SUPABASE_URL` when present):

default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com;
font-src 'self';
style-src 'self' 'unsafe-inline';
script-src 'self' https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
connect-src 'self' SUPABASE_URL https://api.stripe.com https://maps.googleapis.com;

Dev-only: `script-src` adds `'unsafe-eval'` to keep Next.js dev tooling working. Production does **not**
include `unsafe-eval`.

> Notes:
- `style-src 'unsafe-inline'` is pragmatic for initial rollout. Tighten later if possible.
- If something breaks, add exact origins, not wildcards.

## Next.js Implementation (Example)
Add headers in `next.config.ts`:

- Set HSTS only in production.
- Set CSP as Report-Only initially.
- Ensure you do not add headers that break image optimization/route handlers.

## Verification Checklist
- Stripe Checkout loads and redirects correctly
- Billing Portal opens correctly
- Maps pages load and render
- No blocked critical requests in console
- CSP report-only shows violations you can triage

## Rollout Guidance (Report-Only → Enforced)
1. Monitor CSP violations:
   - Use browser devtools console/network to identify blocked requests.
   - If you add a report endpoint later, mirror the Report-Only policy into `report-to`/`report-uri`.
2. Tighten allowlists iteratively:
   - Remove unused sources.
   - Replace wildcard sources with exact origins when possible.
3. Enforce CSP when stable:
   - Replace `Content-Security-Policy-Report-Only` with `Content-Security-Policy`.
   - Re-verify Stripe Checkout, Billing Portal, and Maps rendering.
