# SECURITY_QA — Security Regression & Verification (2025/2026)

This is a pragmatic yet strict security QA suite. Run it:
- after security PRs
- before releases
- after major dependency bumps

## 0) Preconditions
- Hosted Supabase Dev configured
- Stripe Test mode configured
- `.env.local` contains:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server-only)
  - STRIPE_SECRET_KEY (server-only)
  - STRIPE_WEBHOOK_SECRET (server-only)
  - NEXT_PUBLIC_STRIPE_PRICE_WEEKLY
  - GOOGLE_MAPS_API_KEY (server-only)
  - CRON_SECRET

## 1) Build & Static Gates
- [ ] `bash scripts/codex/verify.sh` passes
- [ ] App boots: `pnpm dev` (no import-time crash, no secret printed)

## 2) Auth & Session
### 2.1 Protected routes
- [ ] Logged out → open `/account` → redirected to `/login` with friendly message
- [ ] Logged out → open `/schedule` → redirected to `/login`
- [ ] Logged out → open `/track` → redirected to `/login`

### 2.2 Open redirect defense
If app supports `returnTo` / `redirect` params:
- [ ] `returnTo=/account` works
- [ ] `returnTo=https://evil.com` is rejected or ignored
- [ ] `returnTo=//evil.com` is rejected or ignored

## 3) Authorization & IDOR (Two-user test)
Create two customer accounts: User A and User B.

### 3.1 Data isolation (RLS)
As User A:
- [ ] Create address + appointment
- [ ] Attempt to fetch User B’s address/appointment via API (by guessing ID) → must fail (403) or return empty
- [ ] Attempt to fetch User B’s orders/payments → must fail or return empty

### 3.2 Server checks (don’t rely on RLS alone)
- [ ] Any route handler that accepts an ID parameter confirms ownership server-side OR relies on RLS-only queries without service role
- [ ] Service-role usage is only in trusted contexts (webhook/cron/admin)

## 4) Admin Authorization
Set User A as admin: `profiles.is_admin = true`.

As non-admin (User B):
- [ ] `/admin/*` routes blocked (redirect or 403)
- [ ] admin APIs blocked (403)

As admin:
- [ ] Can access `/admin/*`
- [ ] Can view deliveries/routes (no client-side bypass needed)
- [ ] No admin tokens exposed to client

## 5) Stripe Webhook Security
### 5.1 Signature verification
- [ ] Send request to webhook with invalid signature → must return 400
- [ ] With Stripe CLI forwarding and correct secret → events accepted

### 5.2 Idempotency (replay)
- [ ] Replay the same Stripe event id twice → second run should be no-op (still 200, no duplicate rows)

### 5.3 Source of truth
- [ ] Client cannot set subscription status directly (no endpoint accepts status updates from client)
- [ ] Subscription status in DB matches Stripe after webhook (eventual consistency ok)

## 6) Cron Endpoint Protection
- [ ] Call cron endpoint without secret → 401/403
- [ ] Call cron with wrong secret → 401/403
- [ ] Call cron with correct secret → 200
- [ ] Idempotency: call cron twice → no duplicate weekly orders for same week

## 7) Maps / Expensive Endpoint Abuse Controls
### 7.1 Server-side only keys
- [ ] Google Maps server key never appears in client bundle
- [ ] Client only uses allowed public keys (if any) or map ID; geocode/directions happen server-side

### 7.2 Rate limiting (if implemented)
- [ ] Hammer `/api/maps/geocode` quickly → rate limited after threshold
- [ ] Hammer `/api/maps/directions` quickly → rate limited after threshold
- [ ] Rate-limit errors are user-friendly and retryable

## 8) Logging & PII
- [ ] No logs print full address/phone
- [ ] Webhook logs do not print raw payload or customer email in full
- [ ] Errors shown to client are sanitized (no stack traces, no keys)

## 9) Headers & CSP (if enabled)
### 9.1 Baseline headers present
- [ ] nosniff, referrer policy, frame protection, permissions policy present

### 9.2 CSP Report-Only (pragmatic rollout)
- [ ] App functions (Stripe + Maps) with CSP-RO enabled
- [ ] Any CSP violations are reviewed and documented for tightening

## 10) Dependency & Supply Chain (pragmatic)
- [ ] Lockfile committed and consistent
- [ ] No new unreviewed dependencies added in security PRs
- [ ] Critical updates applied quickly (document policy if present)

---

## Quick Command Snippets (optional)

### Cron test
curl -X POST http://localhost:3000/api/cron/generate-week \
  -H "Authorization: Bearer $CRON_SECRET"

### Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

---

## Admin service-role CRUD
All admin writes must:
- validate session
- enforce profiles.is_admin
- validate input (zod)
- use service-role client (server-only)

