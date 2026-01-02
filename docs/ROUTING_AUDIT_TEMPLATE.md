# ROUTING_AUDIT_TEMPLATE — Next.js 16 App Router (Morning Star Delivery)

> Purpose: a structured checklist + report format for routing changes.
> Use this in routing PRs (R1/R2/…) to capture findings, fixes, and follow-ups.
> Keep it concrete, testable, and aligned with `docs/NEXTJS16_ROUTING_STANDARDS.md`.

---

## 0) PR Metadata
- PR title:
- Branch:
- Date:
- Codex task link (if applicable):
- Reviewer(s):

### Scope statement (what this PR is allowed to touch)
- Allowed:
- Not allowed:

---

## 1) Reported Issue(s)
Describe the user-visible problem(s) that triggered the audit.

### 1.1 Primary issue
- Symptom:
- Route(s) affected:
- When it happens (exact click path):
- Expected behavior:
- Actual behavior:

### 1.2 Error details (paste exact logs)
> Paste the exact terminal/browser logs.

```txt
PASTE LOGS HERE
````

* Stack trace points to:
* Repro reliability: (always / sometimes / rare)
* Regression? (yes/no) If yes, from which PR/commit?

---

## 2) Reproduction Steps (must be deterministic)

### 2.1 Local reproduction

* Preconditions:

  * [ ] `pnpm install`
  * [ ] `.env.local` configured (or verify script placeholders)
  * [ ] Supabase dev project connected
* Steps:
  1.
  2.
  3.
  4.
* Result:

### 2.2 Automation gates

* [ ] `bash scripts/codex/verify.sh`
* [ ] `bash scripts/codex/verify-routing.sh` (if exists)

---

## 3) Current Route Inventory Snapshot

> Update `docs/CURRENT_APP_TREE.md` in the PR. Paste a snapshot here for quick review.

### 3.1 Route groups present

* (marketing):
* (auth):
* (app):
* (app)/(protected):
* (admin):
* Other:

### 3.2 Important routes

* Public:

  * `/`
  * `/pricing`
  * other:
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

  * (app)/layout:
  * (protected)/layout:
  * admin layout:
* Expected:

  * (app) = auth-only
  * (protected) = onboarding/address gating
  * admin = `profiles.is_admin` gating
* Findings:

  * ✅ OK / ⚠️ Needs change / ❌ Broken
* Notes:

### 4.2 Redirect loop check

* Any 307/308 loops observed?

  * [ ] No
  * [ ] Yes → describe:
* Root cause:

### 4.3 Open redirect check

* Any `next`/`redirect_to` param used?

  * [ ] No
  * [ ] Yes → ensure internal-only
* Where enforced (file + helper):
* Findings:

---

## 5) Server vs Client Component Audit

> Identify compilation errors caused by mismatched client/server constraints.

### 5.1 Hook usage

* Any `usePathname`, `useRouter`, `useSearchParams`, `useState`, `useEffect` in Server Components?

  * [ ] No
  * [ ] Yes → list files and fix:

### 5.2 Browser-only APIs

* Any `window`, `document`, `localStorage` used outside `"use client"`?

  * [ ] No
  * [ ] Yes → list files and fix:

### 5.3 Supabase usage boundaries

* Server components should use server client:

  * `createSupabaseServerClient`
* Client components should use browser client:

  * `createSupabaseBrowserClient`
* Findings:

  * ✅ OK / ⚠️ Needs change / ❌ Broken
* Notes:

---

## 6) Segment UX Boundaries (loading/error/not-found)

### 6.1 loading.tsx

* Added/updated:
* Rationale:

### 6.2 error.tsx (must be `"use client"` + `reset()`)

* Added/updated:
* Error UX expectation:

  * user-friendly message
  * retry/reset
  * no secrets/PII

### 6.3 not-found.tsx

* Added/updated:
* Rationale:

---

## 7) Fix Implementation Summary

### 7.1 Root cause (final)

* What exactly caused the bug?
* Why did it only show after onboarding save?

### 7.2 Fix overview

* Changed routes:
* Changed layouts:
* Changed guards:
* Changed components:
* Changed helpers:

### 7.3 Risk assessment

* Risk level: low / medium / high
* Potential regressions:
* Rollback plan:

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
* [ ] Visit `/onboarding` while onboarded → redirects to `/account` (or chosen landing)
* [ ] Expired/invalid magic link → friendly login error
* [ ] Missing Supabase env → friendly config screen (dev)

### 8.3 Admin flows

* [ ] Logged out → `/admin` → `/admin/login` (no loop)
* [ ] Non-admin user → `/admin` shows insufficient access OR redirects to `/account` with message
* [ ] Admin user → access `/admin/*`

---

## 9) Performance & Stability Notes

* Any route using `force-dynamic`? Why?
* Any caching headers changed? Why?
* Any heavy client bundles introduced? Where?

---

## 10) Docs Updated (required)

* [ ] `docs/CURRENT_APP_TREE.md`
* [ ] `docs/NEXTJS16_ROUTING_STANDARDS.md` (if guidance improved)
* [ ] `docs/QA_UX.md`
* [ ] `docs/QA_UX_REPORT.md`
* [ ] `docs/ROUTING_BACKLOG.md`
* [ ] `docs/BACKLOG.md`

List exact edits made:

---

## 11) Follow-ups / Backlog Items

> Add concrete tasks to ROUTING_BACKLOG.md / BACKLOG.md.

* [ ]
* [ ]
* [ ]

---

## 12) Appendix

### 12.1 Key diffs (optional)

* File:
* Before/After summary:

### 12.2 References

* Standards: `docs/NEXTJS16_ROUTING_STANDARDS.md`
* QA: `docs/QA_UX.md`
* Security QA: `docs/SECURITY_QA.md`

```


::contentReference[oaicite:0]{index=0}
```
