# AGENTS.md — Codex House Rules (Morning Star Weekly Delivery App)
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Auth/Postgres/RLS) + Stripe (Subs/Portal/Webhooks) + Google Maps (Geocode/Directions) + Framer Motion + next-themes  
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
2) **Always start from latest `main` (best effort).** Use `bash scripts/codex/git-sync-main.sh` if present before branching.
3) **Scope discipline.** Touch only files needed by the active prompt. No drive-by refactors.
4) **No binary files in PRs.** Do not add `.png/.jpg/.ico/.pdf/.psd` etc. Use SVG/code/icons.
5) **No secrets committed.** Never edit or commit `.env.local` or any real keys.
6) **Keep gates green.** Every PR must pass `bash scripts/codex/verify.sh` before requesting review.
7) **Security is strict.** Never weaken authz, RLS, webhook verification, or admin gating.
8) **Use existing theming.** `next-themes` is the app’s theming system; do not introduce a second theme provider.

---

## 3) Branch Hygiene (Conflict-Minimizing Workflow)
### Required start-of-task routine
- Sync to latest main (best effort) then create a new branch:
  - `bash scripts/codex/git-sync-main.sh` (if available)
  - create a fresh branch for the PR (name per conventions below)

> Note: In some Codex environments `origin/main` may be unavailable. If so, proceed from the provided base and document it in the PR.

### Required completion routine
- Run `bash scripts/codex/verify.sh`
- Ensure PR description includes:
  - summary
  - how to test
  - QA_UX/Security considerations
  - any risk/rollback notes

### Naming convention
- UI polish: `codex/polish-customer-a`, `codex/polish-customer-b`, `codex/polish-customer-c`
- UI hotfix/polish: `codex/ui-p1-*`
- Marketing/public: `codex/marketing-p1-*`
- Platform/DevEx: `codex/platform-p0-*`
- Security: `codex/security-s0`, `codex/security-s1`, `codex/security-s2`
- Routing: `codex/routing-r1-groups-boundaries`, `codex/routing-r2-appointments-modals`
- Auth/Routing fixes: `codex/auth-p0-*`

---

## 4) Where Requirements Live (Source of Truth)
- Product + architecture: `docs/BLUEPRINT.md`
- Customer UX QA: `docs/QA_UX.md`
- UI polish spec (if present): `docs/UI_POLISH_SPEC.md`
- Backlog/workstreams (if present): `docs/BACKLOG.md`, `docs/WORKSTREAMS.md`
- Security regression QA: `docs/SECURITY_QA.md`
- Security standards: `docs/SECURITY_OVERVIEW.md`, `docs/SECURITY_CHECKLIST.md`, `docs/WEBHOOK_SECURITY.md`, `docs/RLS_AUDIT.md`, `docs/HEADERS_AND_CSP.md`
- Routing standards: `docs/NEXTJS16_ROUTING_STANDARDS.md`
- Current route inventory (if present): `docs/CURRENT_APP_TREE.md`
- Change policy (if present): `docs/CHANGE_POLICY.md`

If a prompt conflicts with these docs, **follow the docs** and update the prompt outcomes in the PR notes.

---

## 5) Commands (Local + Codex Cloud)
### Standard verification (required for every PR)
```bash
bash scripts/codex/verify.sh
````

### Dev server

```bash
pnpm dev
```

---

## 6) DevEx: verify/build without secrets

Some environments (Codex/CI) may not have real env vars.

* `scripts/codex/verify.sh` may source `scripts/codex/load-env.sh` (safe stubs) and set `CODEX_VERIFY=1`.
* Runtime must remain strict in real environments (Vercel), where `CODEX_VERIFY` is not set.

Never commit real secrets. Stubs are acceptable only for build verification.

---

## 7) Coding Standards (Next.js 16 App Router)

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
* `/admin/login` must NOT be under admin-gated layout (avoid redirect loops).

### Segment boundaries

* Add `loading.tsx`, `error.tsx`, and `not-found.tsx` where it improves UX.
* `error.tsx` must be a client component using `reset()`.

### Advanced routing patterns (allowed)

* Parallel routes (`@modal`, `@nav`) and intercepting routes are allowed only when they:

  * improve list→detail UX
  * preserve deep linking
  * keep auth/admin gating intact
  * preserve back/forward behavior

---

## 8) API Route Handler Standards (`src/app/api/**/route.ts`)

### Input validation

* All mutating routes must validate input with zod.
* Return consistent JSON:

  * `{ ok: true, data: ... }`
  * `{ ok: false, error: { code, message, details? } }`

### Error handling

* Do not leak stack traces, secrets, or full PII.
* Avoid user enumeration in auth flows (e.g., “No active account found or credentials are incorrect.”).
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
* Rate limit expensive endpoints (maps geocode/directions/coverage) pragmatically.
* Use `no-store` headers for private endpoints.

---

## 9) Supabase Standards (Auth + Postgres + RLS)

* RLS is mandatory for user-owned tables.
* Queries must not allow IDOR: user can only read/write their own rows.
* Admin tables/routes are restricted via admin checks.
* Service role key usage is server-only and limited to:

  * Stripe webhooks
  * cron jobs
  * admin operations (when necessary)

DB changes:

* Use migrations in `supabase/migrations/*`.
* Migrations must be idempotent and documented.
* Public-read tables require explicit RLS policies scoped to published/public rows.

---

## 10) Stripe Standards (Subscriptions + Portal + Webhooks)

* Stripe webhooks must:

  * verify signature
  * be idempotent (store processed event ids)
* Subscription state in DB comes from Stripe events (webhook source of truth).
* Checkout and portal sessions are created server-side only.
* Never trust client-supplied Stripe IDs.

---

## 11) Google Maps Standards (Geocode + Directions)

* Server-only for geocode/directions (no unrestricted keys in client bundle).
* Validate inputs; reject invalid requests early.
* Add abuse controls (rate limits + caching where safe).
* On maps failure, UX must degrade gracefully (text fallback, retry).

---

## 12) UI/UX Standards (2025/2026)

* Mobile-first layout and tap targets (>=44px).
* shadcn/ui components for consistent UI.
* Framer Motion:

  * subtle transitions
  * no blocking animations
  * respect `prefers-reduced-motion`
* Dark mode parity required.
* Every page must have a clear “next action” CTA (see `docs/QA_UX.md`).
* Avoid blank screens: loading skeletons/empty states required.
* Maintain contrast (WCAG-aware): buttons/text must be readable in both themes.

---

## 13) Documentation Expectations

When a PR changes behavior, update docs:

* UX changes → update `docs/QA_UX.md` (or ensure it still passes) + `docs/UI_POLISH_REPORT.md` if used
* Security changes → update `docs/SECURITY_CHECKLIST.md`, `docs/SECURITY_REPORT.md` status
* Routing changes → update `docs/NEXTJS16_ROUTING_STANDARDS.md` and/or `docs/CURRENT_APP_TREE.md`
* Platform/DevEx changes → update `docs/CODEX_DEVEX.md`

Doc changes must be concrete and testable.

---

## 14) PR Quality Bar

Every PR must include in the PR description:

* What changed + why
* How to test (commands + click path)
* Any risks/rollbacks
* QA mapping:

  * which parts of `docs/QA_UX.md` are affected
  * which parts of `docs/SECURITY_QA.md` are affected (if applicable)

---

## 15) Stop Conditions (When to pause and document)

Stop and document (instead of guessing) if:

* implementing a change would require a second PR dependency
* a change would expand scope beyond the prompt
* you would need real credentials/keys or direct DB access
* you’re unsure about expected business rules (cutoffs, windows, admin privileges)

In these cases, add a short note in the PR describing:

* what’s blocked
* what’s needed to proceed safely

---

## 16) Working with Codex (Dual-Agent Collaboration)

This project uses both Codex and Claude Code working together as senior full-stack developers. Each agent has clear responsibilities to ensure efficient, high-quality development.

### 16.1) Agent Responsibilities

**Claude Code focuses on:**
- Planning and architecture design
- UI/UX design and research
- Frontend component design
- Code review and feedback
- Documentation updates
- Setting quality benchmarks

**Codex focuses on:**
- Feature implementation from specifications
- Writing comprehensive tests
- Bug fixes and debugging
- Performance optimization
- Production concerns

### 16.2) Workflow

**Standard Development Cycle:**
1. Claude creates plans, architecture docs, and designs → Pushes to `claude/*` branch
2. User reviews and merges Claude's work to `main`
3. Codex pulls `main` → Implements features → Pushes to `codex/*` branch
4. User reviews and merges Codex's work to `main`
5. Repeat

**Key Principle:** Codex ALWAYS works from the `main` branch, not Claude branches. This ensures a clean, linear workflow.

### 16.3) Git Workflow

**For Codex: Starting Work**
```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b codex/[feature-name]

# Implement, test, commit
pnpm dev
pnpm test
bash scripts/codex/verify.sh

# Push when ready
git add -A
git commit -m "feat: [feature-name]"
git push -u origin codex/[feature-name]
```

**For Claude: Planning & Design**
```bash
# Work on planning branch
git checkout -b claude/plan-[feature-name]

# Create docs, designs, architecture
# Push for user review
git push -u origin claude/plan-[feature-name]
```

### 16.4) Communication Protocol

**After Each Claude Session:**
Claude documents in `docs/CLAUDE_CODEX_HANDOFF.md`:
- What was planned/designed
- Implementation notes for Codex
- Acceptance criteria
- Files to review
- Open questions

**After Each Codex Session:**
Codex adds to `docs/CLAUDE_CODEX_HANDOFF.md`:
- What was implemented
- Test coverage achieved
- Issues encountered
- Suggestions for Claude's next session

### 16.5) Handoff Documents

**Primary Communication:**
- `docs/CLAUDE_CODEX_HANDOFF.md` - Session summaries and task handoffs

**Planning & Specs (Claude creates, Codex implements from):**
- `docs/UI_UX_REVAMP_PLAN.md` - UI/UX specifications
- `docs/GOOGLE_MAPS_ARCHITECTURE.md` - Maps implementation plan
- `docs/PR_PROMPTS_NEXT_SESSIONS.md` - Feature specifications
- `CODEX_WORKFLOW.md` - Codex workflow guide

**For Codex: Quick Start**
Read `CODEX_WORKFLOW.md` for complete workflow instructions.

### 16.6) Quality Standards

**Both agents must:**
- Write comprehensive tests (target 80%+ coverage)
- Follow TypeScript strict mode (zero `any` types)
- Ensure all tests pass before committing
- Run `bash scripts/codex/verify.sh` before pushing
- Update relevant documentation
- Provide clear commit messages

**Code Quality Targets:**
- Test Coverage: 80%+
- TypeScript: Zero `any` types
- Accessibility: WCAG AA minimum
- Performance: Lighthouse 90+
- Bundle Size: <200KB initial load

### 16.7) Conflict Resolution

**If technical disagreement arises:**
1. Document both approaches in `CLAUDE_CODEX_HANDOFF.md`
2. Provide evidence/benchmarks for each approach
3. Let user make final decision

**Priority Hierarchy:**
1. Security > UX > Performance > Aesthetics
2. User safety > Developer convenience
3. Production stability > New features

---

## Summary: Professional Dual-Agent Workflow

**Workflow:** Claude plans → User merges to main → Codex implements → User merges to main

**Claude's Role:** Planning, architecture, design, review
**Codex's Role:** Implementation, testing, optimization

**Key Documents:**
- `CODEX_WORKFLOW.md` - Codex's workflow guide
- `docs/CLAUDE_CODEX_HANDOFF.md` - Session handoffs and communication

**Success Metrics:** Quality code, comprehensive tests, clear documentation, efficient collaboration.
