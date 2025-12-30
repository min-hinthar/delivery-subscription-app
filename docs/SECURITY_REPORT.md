# Security Report — Audit Findings (S0)

**Project:** Morning Star Weekly Delivery App  
**Date:** 2025-12-30  
**Audited commit/branch:** `2abfd7de1f0b1ae8d90a4e8dd1b65d74952a1316` / `codex/security-s0`  
**Auditor:** Codex  

## Executive Summary
- Overall risk: **Medium**
- P0 findings: **1** (resolved in `security-s1`)
- P1 findings: **2** (P1-1 resolved in `security-s1`)
- P2 findings: **1**
- Biggest risk area(s):
  - Stripe webhook idempotency not implemented (replay events can cause inconsistent state).
  - Maps endpoints lack rate limiting (potential abuse / cost exposure).

## Scope Inventory
### Frontend routes (customer)
- `/` (marketing)
- `/pricing`
- `/login`
- `/signup`
- `/subscribe/success`
- `/onboarding`
- `/account`
- `/account/profile`
- `/appointment/[id]`
- `/billing`
- `/schedule`
- `/track`

### Frontend routes (admin)
- `/admin`
- `/admin/login`
- `/admin/deliveries`
- `/admin/meals`
- `/admin/routes`
- `/admin/subscriptions`

### API routes (Route Handlers)
| Route | Purpose | Auth/Admin | Validation | Rate limit |
| --- | --- | --- | --- | --- |
| `src/app/(auth)/auth/callback/route.ts` | Supabase auth callback + safe redirect | Public | Query parsing only | No |
| `src/app/api/account/profile/route.ts` | Profile + primary address update | Auth | Zod | No |
| `src/app/api/delivery/appointment/route.ts` | Create/update appointment with cutoff guard | Auth | Zod | No |
| `src/app/api/maps/verify/route.ts` | Verify address via geocode | Auth | Zod | No |
| `src/app/api/maps/geocode/route.ts` | Geocode + update address | Auth | Zod | Yes (per-user/IP) |
| `src/app/api/maps/directions/route.ts` | Build directions route | Auth | Zod | Yes (per-user/IP) |
| `src/app/api/subscriptions/checkout/route.ts` | Stripe Checkout session | Auth | Zod | No |
| `src/app/api/subscriptions/portal/route.ts` | Stripe Billing Portal session | Auth | Zod | No |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook processing | Public (signature verified) | Stripe signature | No |
| `src/app/api/cron/generate-week/route.ts` | Weekly order generation | CRON_SECRET | Header/query secret | No |
| `src/app/api/admin/routes/build/route.ts` | Admin route planning (maps) | Admin | Zod | No |
| `src/app/api/admin/routes/delete/route.ts` | Admin route deletion | Admin | Zod | No |
| `src/app/api/admin/routes/summary/route.ts` | Admin route summary | Admin | Query params | No |
| `src/app/api/admin/routes/stops/route.ts` | Admin stops list | Admin | Query params | No |
| `src/app/api/admin/manifest.csv/route.ts` | Admin manifest export | Admin | Query params | No |

### External integrations
- Supabase Auth + Postgres + RLS
- Stripe: Checkout, Billing Portal, Webhooks
- Google Maps: Geocode, Directions

---

## Findings (Ranked)

### P0 — Must Fix Before Production
> Any item that enables data breach, auth bypass, payment spoofing, or key leakage.

| ID | Area | Finding | Risk | Location | Exploit scenario | Fix summary | Acceptance test |
|---:|------|---------|------|----------|------------------|-------------|-----------------|
| P0-1 | Webhook | Stripe webhook is verified but **not idempotent** (no event replay guard). | High | `src/app/api/stripe/webhook/route.ts` | Replayed event updates subscriptions/payments multiple times, causing incorrect billing state. | Add `stripe_events` table + store processed event IDs; short-circuit when already handled. | Replay a valid event ID and confirm only first attempt mutates DB (SECURITY_QA: Stripe section). |

### P1 — Should Fix Soon
> Weaknesses that can become critical under abuse or increase likelihood of incident.

| ID | Area | Finding | Risk | Location | Fix summary | Acceptance test |
|---:|------|---------|------|----------|-------------|-----------------|
| P1-1 | Maps | No rate limiting or abuse control on geocode/directions endpoints. | Med | `src/app/api/maps/*/route.ts` | Add per-user/IP throttling + optional caching; keep pragmatic thresholds. | Flood test: repeated calls return 429 (SECURITY_QA: Maps section). |
| P1-2 | Headers/CSP | No baseline security headers or CSP report-only configured. | Med | `next.config.ts` | Add baseline headers + CSP report-only starting policy. | Verify headers on `/` and `/account` (SECURITY_QA: Headers/CSP). |

### P2 — Nice to Have
> Defense-in-depth, polish, or operational improvements.

| ID | Area | Finding | Risk | Location | Fix summary | Acceptance test |
|---:|------|---------|------|----------|-------------|-----------------|
| P2-1 | Auditability | No explicit audit log for admin route changes (build/delete). | Low | `src/app/api/admin/routes/*` | Add lightweight admin action logging table/event. | Admin actions produce log entries. |

---

## Positive Controls (What’s Already Good)
- [x] Stripe signature verification present (`src/app/api/stripe/webhook/route.ts`).
- [x] Open-redirect prevention implemented (`src/lib/navigation.ts` and return URL normalization in Stripe routes).
- [x] RLS enabled with ownership/admin policies (`supabase/migrations/002_rls.sql`).
- [x] Admin gating enforced server-side (`src/components/auth/admin-guard.tsx`, `src/lib/auth/admin.ts`).
- [x] Input validation present on mutating endpoints (zod in API routes).
- [x] Secrets not committed; `.env.local` not tracked.

---

## Recommended Remediations (Plan)
### Phase S1 (Hardening)
- P0: Implement webhook idempotency with a `stripe_events` table + replay guard. **Resolved in `security-s1`.**
- P1: Add lightweight rate limiting for maps/directions and admin route building. **Resolved in `security-s1` for maps endpoints.**

### Phase S2 (Headers/CSP)
- Add baseline security headers in `next.config.ts`.
- Start CSP in Report-Only, iterate to enforcement.

---

## Verification Checklist (Post-fix)
- [ ] `bash scripts/codex/verify.sh`
- [ ] Run `docs/SECURITY_QA.md` checks relevant to fixes
- [ ] Confirm no new public data exposures
- [ ] Confirm Stripe/Maps flows still work

---

## Remediation Status (security-s1)
- ✅ P0-1: Stripe webhook idempotency guard added with `stripe_events` table + replay short-circuit.
- ✅ P1-1: Rate limiting added to `/api/maps/geocode` and `/api/maps/directions` (per-user/IP, 10/min).

---

## Notes / Open Questions
- Rate limiting and CSP policies should be implemented pragmatically to avoid breaking Stripe Checkout or Maps integrations.
- Cron secret is accepted via header or query param; consider restricting to headers only in a future hardening pass.
