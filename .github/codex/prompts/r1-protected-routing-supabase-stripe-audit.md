You are Codex. Follow:
- AGENTS.md (non-negotiables)
- docs/NEXTJS16_ROUTING_STANDARDS.md (source of truth)
- docs/QA_UX.md + docs/QA_UX_REPORT.md (customer flow gates)
- docs/SECURITY_QA.md + docs/SECURITY_REPORT.md (auth/IDOR/webhook constraints)
- docs/WEBHOOK_SECURITY.md (Stripe webhook rules)
- docs/HEADERS_AND_CSP.md (headers/CSP constraints)
- docs/CHANGE_POLICY.md (record behavior changes)
- docs/CURRENT_APP_TREE.md (must match current reality)
- docs/ROUTING_BACKLOG.md + docs/BACKLOG.md (living backlog)

PR BRANCH: codex/r1-protected-routing-supabase-stripe-audit

# 0) Objective
Perform a comprehensive routing review and hardening pass for:
- all `src/app/(app)/(protected)` routes and layouts
- onboarding route(s)
- the auth callback route(s)
- all related API routes that influence customer flow:
  - /api/subscriptions/*
  - /api/stripe/webhook
  - /api/delivery/*
  - /api/account/profile
  - any helper routes that determine “subscription active / onboarding complete / schedule allowed”

Goals:
1) Eliminate redirect loops, double redirects, and “compiled but crashes” route behavior.
2) Enforce modern Next.js 16 App Router patterns:
   - correct server vs client boundaries
   - correct route group usage
   - correct loading/error/not-found boundaries
3) Ensure Supabase + Stripe integration is consistent with routing rules:
   - redirects depend only on server-verified state
   - APIs return stable error shapes (no leaking stack traces/PII)
4) Update all living docs + QA reports.

# 1) Allowed scope
You may modify:
- src/app/** (layouts, pages, route handlers, loading.tsx, error.tsx, not-found.tsx)
- src/components/** (only when required for client/server boundary fixes or route wiring)
- src/lib/** (only when required for routing helpers, auth helpers, stripe helpers)
- docs/** (must update required docs)
- scripts/codex/** (ONLY if verify-routing.sh needs a small update to catch regressions)

You may NOT:
- Add or change dependencies
- Change database schema/migrations in this PR
- Change Stripe product/pricing configuration
- Add binary assets
- Commit secrets

# 2) Required workflow
A) Start from latest origin/main, new branch from main.
B) Determine the current route tree by inspecting src/app.
C) Reproduce any known issues if possible:
   - Login -> onboarding -> finish -> land on protected route(s)
   - /schedule, /track, /account, /billing
   - checkout/portal flows
D) Fix issues minimally with strict adherence to docs/NEXTJS16_ROUTING_STANDARDS.md.
E) Run: bash scripts/codex/verify.sh
F) Update docs + open PR.

# 3) Audit checklist (must execute)

## 3.1 Route inventory + correctness
- Enumerate all routes in:
  - src/app/(app)/(protected)/**
  - src/app/(app)/onboarding/**
  - src/app/(auth)/** (callback)
  - src/app/api/** relevant to auth/subscription/scheduling
- Update docs/CURRENT_APP_TREE.md to reflect reality.

## 3.2 Boundary & gating rules
Validate the routing boundary model:
- (app)/layout MUST be auth-only (no onboarding gating here).
- (app)/(protected)/layout MUST enforce:
  - user authenticated
  - onboarding_completed true
  - primary address exists
  - (optional) subscription status gating occurs only where appropriate
- onboarding route MUST NOT be under (protected) gating.
- admin routes MUST remain isolated and gated by is_admin.

Fix any violations.

## 3.3 Redirect discipline
For each redirect in server components/layouts/route handlers:
- confirm it cannot loop
- confirm it uses safe internal-only `next` handling
- confirm it does not rely on `referer` heuristics
- confirm it uses stable “source of truth” state from Supabase (server) rather than client guesses

## 3.4 Supabase auth session correctness
- Confirm server contexts use createSupabaseServerClient.
- Confirm auth callback exchanges code for session and sets cookies reliably.
- Confirm “getUser” is used in server contexts, not client-only.
- Confirm protected routes never call browser Supabase client in server components.

## 3.5 Stripe state correctness across routing
Identify where routes decide:
- “has active subscription”
- “needs checkout”
- “can access schedule”

Rules:
- subscription state must come from DB fields updated by webhook (server truth)
- routes should not trust client-supplied stripe IDs
- APIs must verify user ownership (no IDOR)
- billing portal and checkout creation must be server-only routes

Ensure routing decisions depend on server-verified subscription row.

## 3.6 API route contract review (related to protected flows)
For each relevant API route handler under src/app/api:
- Validate inputs with zod (mutations)
- Ensure consistent response shape:
  - { ok: true, data }
  - { ok: false, error: { code, message, details? } }
- Ensure safe errors (no stack traces/PII)
- Ensure proper auth:
  - user routes require auth
  - admin routes require is_admin
  - stripe webhook verifies signature + idempotency
- Ensure cache safety:
  - private APIs use no-store (or Next.js defaults) and do not accidentally cache sensitive data.

## 3.7 Client/server component correctness
Find and fix issues like:
- hooks used in server components
- browser APIs (window/document/localStorage) in server
- importing client-only modules into server components
- importing server-only env access into client

Fix by:
- moving logic into leaf client components
- passing props from server to client
- or converting page to client only when required (avoid unless necessary)

## 3.8 Segment UX boundaries
Add or improve:
- loading.tsx for key protected routes
- error.tsx (client component with reset()) for protected route groups
- not-found.tsx where appropriate

Use minimal but consistent design aligned with existing UI patterns.

# 4) Required route behaviors (acceptance criteria)

## 4.1 Onboarding + protected access
- Signed-out user visiting protected route:
  -> /login?reason=auth&next=/target
- Signed-in but not onboarded or missing primary address:
  -> /onboarding (one redirect, no loops)
- Visiting /onboarding while already onboarded:
  -> redirect to /account (or your canonical landing)

## 4.2 Subscription access (define & implement consistently)
Choose and document the policy (must be consistent across routes):
- Policy A (recommended):
  - /account and /billing accessible without active subscription (to manage)
  - /schedule requires an active subscription (or shows CTA to pricing)
  - /track can show empty state without active subscription but should not crash
Implement with server-verified checks:
- Use subscriptions table for user_id and status in server components/layouts.
- Never rely on client local state to gate these pages.

## 4.3 Stripe flows
- Checkout route returns a server-generated URL and redirects user (or returns JSON used by client).
- Portal route returns a portal URL (server-only).
- Webhook processing remains source of truth; if missing, add guardrails but do not redesign whole webhook.

## 4.4 API endpoints that influence routing must be stable
- If /api/subscriptions/portal or /checkout fails:
  - show friendly error message in UI and a retry path
  - do not crash compilation or create redirect loops.

# 5) Concrete deliverables
In this PR you MUST:
1) Fix any routing/redirect bugs found in protected/onboarding flows.
2) Fix any compile-time errors caused by client/server boundary mistakes.
3) Ensure protected routes rely on server-verified Supabase state for redirects.
4) Ensure subscription gating (if present) is consistent and documented.
5) Add minimal loading/error boundaries where helpful.
6) Update docs and reports.

# 6) Docs updates (must)
Update:
- docs/CURRENT_APP_TREE.md
- docs/NEXTJS16_ROUTING_STANDARDS.md (only if you add new guidance)
- docs/QA_UX.md + docs/QA_UX_REPORT.md (customer flow, mark regressions fixed)
- docs/SECURITY_QA.md + docs/SECURITY_REPORT.md (auth/IDOR/webhook checks)
- docs/ROUTING_BACKLOG.md (mark done + new followups)
- docs/BACKLOG.md (summary item)
- docs/CHANGE_POLICY.md (if behavior changed, e.g., subscription gating policy)

Also create or update:
- docs/ROUTING_AUDIT_REPORT.md (NEW or update if exists)
  - use docs/ROUTING_AUDIT_TEMPLATE.md as structure

# 7) Testing requirements
- Run: bash scripts/codex/verify.sh
- Manual QA steps (must include in PR description):
  1) Signup -> confirm email -> /auth/callback -> /onboarding (no loop)
  2) Complete onboarding -> /account renders
  3) Visit /schedule -> stable, no compile crash
  4) Subscription gating behavior (document what happens if no active subscription)
  5) Portal/checkout endpoints respond safely and UI shows friendly errors on failure
  6) /admin/login and /admin routes do not loop

# 8) PR description requirements
Include:
- Summary of fixes + root causes
- Routes touched
- Policy decisions (subscription gating)
- How to test
- Docs updated
- Risk and rollback plan
