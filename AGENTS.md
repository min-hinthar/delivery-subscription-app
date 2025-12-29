# AGENTS.md — Codex House Rules (Morning Star Weekly Delivery App)
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Auth/Postgres/RLS) + Stripe (Subs/Portal/Webhooks) + Google Maps (Geocode/Directions) + Framer Motion  
**Primary Specs:** `docs/BLUEPRINT.md`, `docs/QA_UX.md`, `docs/SECURITY_QA.md`, `docs/NEXTJS16_ROUTING_STANDARDS.md`

---

## 1) Mission
Build and maintain a **production-grade weekly meal delivery appointment app** with:
- secure-by-default architecture (RLS-first, server-verified webhooks)
- modern mobile-first UX (no dead ends, smooth states, accessible)
- clear routing boundaries (marketing/auth/customer/admin)
- stable, incremental PRs (minimal conflicts, easy review)

---

## 2) Golden Rules (Non-negotiable)
1) **Do not stack PRs.** One PR at a time. Do not begin a new PR until the previous PR is merged into `main`.
2) **Always start from latest `origin/main`.** Every Codex task/PR must branch off the latest `main`.
3) **Scope discipline.** Touch only files needed by the active prompt. No drive-by refactors.
4) **No binary files in PRs.** Do not add `.png/.jpg/.ico/.pdf/.psd` etc. Use SVG/code/icons.
5) **No secrets committed.** Never edit or commit `.env.local` or any real keys.
6) **Keep gates green.** Every PR must pass `bash scripts/codex/verify.sh` before requesting review.
7) **Security is strict.** Never weaken authz, RLS, webhook verification, or admin gating.

---

## 3) Branch Hygiene (Conflict-Minimizing Workflow)
### Required start-of-task routine
- Fetch latest main and create a new branch:
  - update local main to `origin/main`
  - create a fresh branch for the PR (name per conventions below)

### Required completion routine
- Run `bash scripts/codex/verify.sh`
- Ensure PR description includes:
  - summary
  - how to test
  - QA_UX/Security considerations
  - any risk/rollback notes

### Naming convention
- UI polish: `codex/polish-customer-a`, `codex/polish-customer-b`, `codex/polish-customer-c`
- Security: `codex/security-s0`, `codex/security-s1`, `codex/security-s2`
- Routing: `codex/routing-r1-groups-boundaries`, `codex/routing-r2-appointments-modals`

---

## 4) Where Requirements Live (Source of Truth)
- Product + architecture: `docs/BLUEPRINT.md`
- Customer UX QA: `docs/QA_UX.md`
- Security regression QA: `docs/SECURITY_QA.md`
- Security standards: `docs/SECURITY_OVERVIEW.md`, `docs/SECURITY_CHECKLIST.md`, `docs/WEBHOOK_SECURITY.md`, `docs/RLS_AUDIT.md`, `docs/HEADERS_AND_CSP.md`
- Routing standards: `docs/NEXTJS16_ROUTING_STANDARDS.md`
- Current route inventory (if present): `docs/CURRENT_APP_TREE.md`

If a prompt conflicts with these docs, **follow the docs** and update the prompt outcomes in the PR notes.

---

## 5) Commands (Local + Codex Cloud)
### Standard verification (required for every PR)
```bash
bash scripts/codex/verify.sh
````

### Optional checks

* Routing-specific checks (if present):

```bash
bash scripts/codex/verify-routing.sh
```

### Dev server

```bash
pnpm dev
```

---

## 6) Coding Standards (Next.js 16 App Router)

### Server vs client components

* Default to **Server Components**.
* Use `"use client"` only for interactive UI (forms, toasts, maps rendering).
* Keep client components **leaf-level** when possible.

### Caching rules

* **Private user data = no-store** (pages + APIs).
* Public marketing pages may use revalidation if safe.
* Never cache sensitive data responses.

### Routing boundaries

* Use route groups: `(marketing)`, `(auth)`, `(app)`, `(admin)`
* Enforce auth in `(app)/layout.tsx` server-side.
* Enforce admin in `(admin)/layout.tsx` server-side (`profiles.is_admin`).

### Segment boundaries

* Add `loading.tsx`, `error.tsx`, and `not-found.tsx` where it improves UX.
* `error.tsx` must be a client component using `reset()`.

### Advanced routing patterns (allowed)

* Parallel routes (`@modal`, `@nav`) and intercepting routes are allowed **only** when they:

  * improve list→detail UX
  * preserve deep linking
  * keep auth/admin gating intact
  * preserve back/forward behavior

---

## 7) API Route Handler Standards (`src/app/api/**/route.ts`)

### Input validation

* All mutating routes must validate input with zod.
* Return consistent JSON:

  * `{ ok: true, data: ... }`
  * `{ ok: false, error: { code, message, details? } }`

### Error handling

* Do not leak stack traces, secrets, or full PII.
* Map common errors to user-friendly messages:

  * 401 unauthenticated
  * 403 unauthorized
  * 422 validation/cutoff rules
  * 429 rate-limited
  * 500 unexpected

### Privacy

* Do not log full addresses or phone numbers.
* Never log Stripe raw payloads or secrets.

### Security controls

* Prevent open redirects: only allow internal return paths.
* Rate limit expensive endpoints (maps geocode/directions) pragmatically.
* Use `no-store` headers for private endpoints.

---

## 8) Supabase Standards (Auth + Postgres + RLS)

* RLS is mandatory for user-owned tables.
* Queries must not allow IDOR: user can only read/write their own rows.
* Admin tables/routes are restricted via admin checks.
* Service role key usage is **server-only** and limited to:

  * Stripe webhooks
  * cron jobs
  * admin operations (when necessary)

DB changes:

* Use migrations in `supabase/migrations/*`.
* Migrations must be idempotent and documented.

---

## 9) Stripe Standards (Subscriptions + Portal + Webhooks)

* Stripe webhooks must:

  * verify signature
  * be idempotent (store processed event ids)
* Subscription state in DB comes from Stripe events (webhook source of truth).
* Checkout and portal sessions are created server-side only.
* Never trust client-supplied Stripe IDs.

---

## 10) Google Maps Standards (Geocode + Directions)

* Server-only for geocode/directions (no unrestricted keys in client bundle).
* Validate inputs; reject invalid requests early.
* Add abuse controls (rate limits + caching where safe).
* On maps failure, UX must degrade gracefully (text fallback, retry).

---

## 11) UI/UX Standards (2025/2026)

* Mobile-first layout and tap targets (>=44px).
* shadcn/ui components for consistent UI.
* Framer Motion:

  * subtle transitions
  * no blocking animations
  * respect `prefers-reduced-motion`
* Dark mode parity required.
* Every page must have a clear “next action” CTA (see `docs/QA_UX.md`).
* Avoid blank screens: loading skeletons/empty states required.

---

## 12) Documentation Expectations

When a PR changes behavior, update docs:

* UX changes → update `docs/QA_UX.md` (or ensure it still passes)
* Security changes → update `docs/SECURITY_CHECKLIST.md`, `docs/SECURITY_REPORT.md` status
* Routing changes → update `docs/NEXTJS16_ROUTING_STANDARDS.md` if needed and/or `docs/CURRENT_APP_TREE.md`

Doc changes must be **concrete and testable** (no vague statements).

---

## 13) PR Quality Bar

Every PR must include in the PR description:

* What changed + why
* How to test (commands + click path)
* Any risks/rollbacks
* QA mapping:

  * which parts of `docs/QA_UX.md` are affected
  * which parts of `docs/SECURITY_QA.md` are affected (if applicable)

---

## 14) Stop Conditions (When to pause and document)

Stop and document (instead of guessing) if:

* implementing a change would require a second PR dependency
* a change would expand scope beyond the prompt
* you would need real credentials/keys or direct DB access
* you’re unsure about expected business rules (cutoffs, windows, admin privileges)

In these cases, add a short note in the PR describing:

* what’s blocked
* what’s needed to proceed safely

