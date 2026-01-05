# Threat Model (STRIDE-style) — 2025/2026

This is a practical threat model aimed at preventing real-world issues without overengineering.

## Assets
- A1: Customer PII (name, phone, address, lat/lng)
- A2: Subscription state (active/paused/canceled/past_due)
- A3: Delivery scheduling (appointments, windows, cutoff)
- A4: Admin ops data (routes, stops, manifests)
- A5: Secrets (Supabase service role, Stripe secret, Maps server key)

## Actors
- R1: Legit customer (normal user)
- R2: Admin (trusted operations user)
- A1: Unauthenticated attacker (web)
- A2: Authenticated attacker (customer account attempting escalation)
- A3: Bot/abuser (brute force, endpoint spamming)
- A4: Insider risk (misuse of admin access)

## Entry Points
- E1: Auth endpoints/pages (login/signup/magic link)
- E2: Customer APIs (appointment, onboarding, billing portal)
- E3: Maps APIs (geocode/directions) — expensive and abusable
- E4: Stripe webhook — highest trust input but must be verified
- E5: Cron endpoint — must be protected with secret + strict checks
- E6: Admin pages/APIs

## Threats & Mitigations (Quick Matrix)

### Spoofing
- T-S1: Fake subscription state from client
  - Mitigation: Stripe webhook verified + server-side DB snapshot; client never sets status
- T-S2: Session hijack / token leakage
  - Mitigation: secure cookies, avoid localStorage tokens, strict headers/CSP

### Tampering
- T-T1: Modify appointment after cutoff
  - Mitigation: server-side cutoff enforcement + (optional) DB enforcement; admin override only
- T-T2: Modify another user’s address/appointment via guessed ID (IDOR)
  - Mitigation: Supabase RLS ownership + server checks (never use client-supplied user_id)

### Repudiation
- T-R1: “I didn’t change my address/appointment”
  - Mitigation: audit logging for sensitive updates (optional, P1)

### Information Disclosure
- T-I1: View other customers’ delivery stops/addresses
  - Mitigation: strict RLS, admin gating, customer tracking only for their stop
- T-I2: Leak secrets in logs/errors
  - Mitigation: error sanitization, env validation without printing secrets

### Denial of Service
- T-D1: Spam geocode/directions APIs
  - Mitigation: rate limit by IP/user, caching, reject invalid inputs early
- T-D2: Spam webhook endpoint
  - Mitigation: verify signature early; rate limit by IP (optional), drop invalid quickly

### Elevation of Privilege
- T-E1: Access admin APIs/pages as customer
  - Mitigation: enforce is_admin in server routes + UI guards + RLS policies
- T-E2: Bypass RLS via misused service role key
  - Mitigation: keep service role server-only; never exposed to client; avoid logging it
