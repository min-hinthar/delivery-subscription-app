# Change Policy (Pragmatic but Strict)

This repo allows controlled changes to packages, database schema, routes, and triggers
when they improve product quality/security/maintainability.

## 1) Non-negotiables
- No secrets committed (never commit `.env.local` or real keys)
- No binary files in PRs
- Every PR must pass `bash scripts/codex/verify.sh`
- No stacked PRs (merge to `main` between tasks)

## 2) Allowed changes by category

### A) Package/dependency changes (allowed with constraints)
Allowed when:
- the feature cannot be reasonably implemented without it OR it replaces a worse solution
- minimal addition count (prefer built-in Next.js/shadcn/lucide)
- lockfile is committed
- PR explains why and how to remove/rollback

Not allowed:
- adding multiple overlapping UI libraries
- adding unmaintained packages
- adding packages that require unsafe browser keys

### B) DB schema changes (allowed with migrations + RLS)
Allowed when:
- needed for product features (e.g., weekly menus), performance, or security
Required:
- migration in `supabase/migrations/*`
- RLS enabled and policies updated
- indexes added where appropriate
- rollback/impact note in PR
- seed updates must be idempotent if included

Public-read tables:
- Must explicitly restrict public reads to published rows (e.g., `is_published=true`)
- Must not expose PII

### C) Route changes (allowed in dedicated routing/auth PRs)
Allowed when:
- fixing redirect loops, improving routing patterns, or adding canonical routes
Required:
- URLs must not change unless explicitly stated
- admin gating remains server-side
- update routing docs if structure changes
- AppGuard is auth-only. Onboarding gating must live in (app)/(protected) layout to prevent loops.

### D) Triggers/functions (allowed but require extra care)
Allowed when:
- needed for correctness (timestamps, computed fields) or performance
Required:
- migration includes function + trigger definitions
- PR includes test/verification steps and explains impact

## 3) Documentation requirements
Any change that impacts behavior must update docs:
- UI/UX changes → QA_UX / UI_POLISH_REPORT (if used)
- Security changes → SECURITY_REPORT/CHECKLIST
- Routing changes → routing standards + current app tree
- DevEx changes → CODEX_DEVEX.md

## 4) When to STOP
Stop and document rather than guessing if:
- changes require real production credentials
- requirements are ambiguous
- a change would force stacking PRs

---

## Recent behavior updates (documented)
- 2026-01: Protected routing audit aligned onboarding and appointment access:
  - `/onboarding` now redirects to `/account` once onboarding + primary address are complete.
  - `/appointment/[id]` now lives under `(app)/(protected)` to enforce onboarding gating.
