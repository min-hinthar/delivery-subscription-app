# ROUTING_AUDIT_REPORT — Protected Routing + Supabase/Stripe Audit (R1)

> Purpose: a structured checklist + report format for routing changes.
> Keep it concrete, testable, and aligned with `docs/NEXTJS16_ROUTING_STANDARDS.md`.

---

## 0) PR Metadata
- PR title: R1 protected routing audit: Supabase/Stripe gating + protected boundaries
- Branch: codex/r1-protected-routing-supabase-stripe-audit
- Date: 2026-01-02
- Codex task link (if applicable): .github/codex/prompts/r1-protected-routing-supabase-stripe-audit.md
- Reviewer(s): TBD

### Scope statement (what this PR is allowed to touch)
- Allowed:
  - src/app/** (layouts/pages/route handlers/boundaries)
  - src/components/** (client/server boundary fixes only)
  - src/lib/** (routing/auth helpers if needed)
  - docs/** (required updates)
- Not allowed:
  - Dependencies, migrations, Stripe product config, secrets, binaries

---

## 1) Reported Issue(s)
Routing audit covering protected/onboarding/auth callback/API gates.

### 1.1 Primary issue
- Symptom: Inconsistent gating and missing segment boundaries for protected pages; onboarding could be revisited after completion; appointment detail lived outside onboarding guard.
- Route(s) affected: `/onboarding`, `/appointment/[id]`, protected route group.
- When it happens (exact click path):
  - Authenticated + completed onboarding → visit `/onboarding` directly.
  - Visit `/appointment/[id]` without onboarding gating.
- Expected behavior:
  - Completed onboarding users are redirected to `/account`.
  - Appointment details are gated by onboarding + primary address checks.
- Actual behavior:
  - Onboarding page rendered even after completion.
  - Appointment detail lived outside `(app)/(protected)` guard.

### 1.2 Error details (paste exact logs)
> No error logs captured; audit focused on route correctness and guard coverage.

```txt
N/A
```

* Stack trace points to: N/A
* Repro reliability: sometimes (depends on route access patterns)
* Regression? No known regression.

---

## 2) Reproduction Steps (must be deterministic)

### 2.1 Local reproduction

* Preconditions:

  * [ ] `pnpm install`
  * [ ] `.env.local` configured (or verify script placeholders)
  * [ ] Supabase dev project connected
* Steps:
  1. Log in and complete onboarding (profile + primary address).
  2. Manually visit `/onboarding`.
  3. Visit `/appointment/[id]` using an existing appointment ID.
* Result:
  - Prior behavior: onboarding renders again; appointment details were available without onboarding guard.

### 2.2 Automation gates

* [ ] `bash scripts/codex/verify.sh`
* [ ] `bash scripts/codex/verify-routing.sh` (if exists)

---

## 3) Current Route Inventory Snapshot

> Updated in `docs/CURRENT_APP_TREE.md`.

### 3.1 Route groups present

* (marketing): ✅
* (auth): ✅
* (app): ✅
* (app)/(protected): ✅
* (admin): ✅
* Other: (admin-auth)

### 3.2 Important routes

* Public:

  * `/`
  * `/pricing`
  * `/coverage` (API)
* Auth:

  * `/login`
  * `/signup`
  * `/auth/callback`
* Customer:

  * `/onboarding`
  * `/account`
  * `/schedule`
  * `/track`
  * `/billing`
  * `/appointment/[id]`
* Admin:

  * `/admin/login`
  * `/admin`
  * `/admin/deliveries`
  * `/admin/routes`
  * `/admin/meals`
  * `/admin/subscriptions`

---

## 4) Boundary & Guard Audit (per `NEXTJS16_ROUTING_STANDARDS.md`)

### 4.1 Auth boundary

* Where auth is enforced:

  * (app)/layout: `src/components/auth/app-guard.tsx`
  * (protected)/layout: `src/app/(app)/(protected)/layout.tsx`
  * admin layout: `src/app/(admin)/layout.tsx`
* Expected:

  * (app) = auth-only
  * (protected) = onboarding/address gating
  * admin = `profiles.is_admin` gating
* Findings:

  * ✅ OK
* Notes:
  - Protected layout now derives `next` redirect from request headers, matching app guard behavior.

### 4.2 Redirect loop check

* Any 307/308 loops observed?

  * [x] No
  * [ ] Yes → describe:
* Root cause: N/A

### 4.3 Open redirect check

* Any `next`/`redirect_to` param used?

  * [x] Yes → ensure internal-only
* Where enforced (file + helper):
  - `src/lib/navigation.ts` + auth callback and login flows
* Findings:
  - ✅ OK

---

## 5) Server vs Client Component Audit

### 5.1 Hook usage

* Any `usePathname`, `useRouter`, `useSearchParams`, `useState`, `useEffect` in Server Components?

  * [x] No
  * [ ] Yes → list files and fix:

### 5.2 Browser-only APIs

* Any `window`, `document`, `localStorage` used outside "use client"?

  * [x] No
  * [ ] Yes → list files and fix:

### 5.3 Supabase usage boundaries

* Server components should use server client:

  * `createSupabaseServerClient`
* Client components should use browser client:

  * `createSupabaseBrowserClient`
* Findings:

  * ✅ OK
* Notes:
  - Added env guards before Supabase access on newly protected pages.

---

## 6) Segment UX Boundaries (loading/error/not-found)

### 6.1 loading.tsx

* Added/updated: `(app)/(protected)/loading.tsx`
* Rationale: consistent protected loading state when data-heavy pages render.

### 6.2 error.tsx (must be "use client" + `reset()`)

* Added/updated: `(app)/(protected)/error.tsx`
* Error UX expectation:

  * user-friendly message
  * retry/reset
  * no secrets/PII

### 6.3 not-found.tsx

* Added/updated: `(app)/(protected)/appointment/not-found.tsx` (moved under protected group)
* Rationale: appointment detail remains canonical, but gated by onboarding guard.

---

## 7) Fix Implementation Summary

### 7.1 Root cause (final)

* Protected boundary was not applied to appointment detail route.
* Onboarding page lacked a server-side redirect for already completed users.
* Protected segment lacked its own loading/error boundary.

### 7.2 Fix overview

* Changed routes:
  - Moved `/appointment/[id]` under `(app)/(protected)`.
  - Added protected loading + error boundaries.
* Changed layouts:
  - `(app)/(protected)` layout now uses request headers to preserve `next` path.
* Changed guards:
  - `/onboarding` redirects to `/account` when onboarding + primary address are complete.
* Changed components:
  - None beyond new boundary files.
* Changed helpers:
  - None.

### 7.3 Risk assessment

* Risk level: low
* Potential regressions:
  - Appointment detail access now requires onboarding completion.
* Rollback plan:
  - Revert appointment route move and onboarding redirect guard.

---

## 8) Manual QA Checklist (Happy Path + Edge Cases)

### 8.1 Happy path — customer

* [ ] Signup
* [ ] Confirm email → `/auth/callback` once → `/onboarding` renders once (no loops)
* [ ] Complete onboarding (profile + primary address)
* [ ] Land on `/schedule` (no compile errors)
* [ ] Schedule appointment
* [ ] View `/track` (empty vs live state)
* [ ] Manage `/billing` (if exists)

### 8.2 Edge cases — customer

* [ ] Visit `/schedule` while not onboarded → redirects to `/onboarding` once
* [ ] Visit `/onboarding` while onboarded → redirects to `/account`
* [ ] Expired/invalid magic link → friendly login error
* [ ] Missing Supabase env → friendly config screen (dev)

### 8.3 Admin flows

* [ ] Logged out → `/admin` → `/admin/login` (no loop)
* [ ] Non-admin user → `/admin` shows insufficient access OR redirects to `/account` with message
* [ ] Admin user → access `/admin/*`

---

## 9) Performance & Stability Notes

* Any route using `force-dynamic`? Why?
  - `(app)/(protected)/layout.tsx` uses `force-dynamic` to ensure fresh auth gating.
* Any caching headers changed? Why?
  - Private API routes now send `Cache-Control: no-store` to prevent caching of user data.
* Any heavy client bundles introduced? Where?
  - None.

---

## 10) Docs Updated (required)

* [x] `docs/CURRENT_APP_TREE.md`
* [ ] `docs/NEXTJS16_ROUTING_STANDARDS.md` (if guidance improved)
* [x] `docs/QA_UX.md`
* [x] `docs/QA_UX_REPORT.md`
* [x] `docs/ROUTING_BACKLOG.md`
* [x] `docs/BACKLOG.md`
* [x] `docs/SECURITY_QA.md`
* [x] `docs/SECURITY_REPORT.md`
* [x] `docs/CHANGE_POLICY.md`

List exact edits made:
- Added protected loading/error boundaries and moved appointment detail under protected group.
- Updated QA + security checklists and reports for routing and cache-control updates.
- Updated backlog items and current route inventory.

---

## 11) Follow-ups / Backlog Items

> Add concrete tasks to ROUTING_BACKLOG.md / BACKLOG.md.

* [ ] Add per-route error boundaries for `/schedule` and `/track` if needed.

---

## 12) Appendix

### 12.1 Key diffs (optional)

* File: `src/app/(app)/(protected)/layout.tsx`
* Before/After summary: redirects now preserve original path via request headers.

### 12.2 References

* Standards: `docs/NEXTJS16_ROUTING_STANDARDS.md`
* QA: `docs/QA_UX.md`
* Security QA: `docs/SECURITY_QA.md`
