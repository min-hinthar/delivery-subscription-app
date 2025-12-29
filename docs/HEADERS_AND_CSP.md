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
