# Security Report — Audit Findings (Template)

**Project:** Morning Star Weekly Delivery App  
**Date:** YYYY-MM-DD  
**Audited commit/branch:** `<hash>` / `<branch>`  
**Auditor:** Codex / Human  

## Executive Summary
- Overall risk: [Low / Medium / High]
- P0 findings: #
- P1 findings: #
- P2 findings: #
- Biggest risk area(s):
  - (e.g., IDOR risk in route handlers, missing RLS policies, webhook idempotency)

## Scope Inventory
### Frontend routes (customer)
- `/`
- `/pricing`
- `/login`
- `/signup`
- `/onboarding`
- `/account`
- `/schedule`
- `/track`

### Frontend routes (admin)
- `/admin/*`

### API routes (Route Handlers)
List each:
- `src/app/api/.../route.ts` — purpose — auth required? — validation? — rate limited?

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
| P0-1 | RLS | (e.g., RLS missing/incorrect) | High | `supabase/migrations/...` | User reads other user rows | Add policy + index | See SECURITY_QA.md: IDOR test |
| P0-2 | Webhook | (e.g., no signature verify / no idempotency) | High | `api/stripe/webhook` | Attacker spoofs subscription | Verify sig + stripe_events | Replay event test |

### P1 — Should Fix Soon
> Weaknesses that can become critical under abuse or increase likelihood of incident.

| ID | Area | Finding | Risk | Location | Fix summary | Acceptance test |
|---:|------|---------|------|----------|-------------|-----------------|
| P1-1 | Maps | Missing rate limiting | Med | `api/maps/*` | Add per-IP/user limit | Rate limit test |
| P1-2 | Logging | Possible PII in logs | Med | `...` | Redact/avoid | Log scan |

### P2 — Nice to Have
> Defense-in-depth, polish, or operational improvements.

| ID | Area | Finding | Risk | Location | Fix summary | Acceptance test |
|---:|------|---------|------|----------|-------------|-----------------|

---

## Positive Controls (What’s Already Good)
- [ ] Stripe signature verification present
- [ ] Webhook idempotency present
- [ ] RLS enabled on all user-owned tables
- [ ] Admin gating enforced server-side
- [ ] Input validation present on all mutating endpoints
- [ ] Secrets not committed; `.env.local` excluded

---

## Recommended Remediations (Plan)
### Phase S1 (Hardening)
- P0 items: …
- P1 items: …

### Phase S2 (Headers/CSP)
- Baseline headers: …
- CSP Report-Only: …

---

## Verification Checklist (Post-fix)
- [ ] `bash scripts/codex/verify.sh`
- [ ] Run `docs/SECURITY_QA.md` checks relevant to fixes
- [ ] Confirm no new public data exposures
- [ ] Confirm Stripe/Maps flows still work

---

## Notes / Open Questions
- …
