You are Codex. Follow:
- AGENTS.md (non-negotiables)
- docs/NEXTJS16_ROUTING_STANDARDS.md (source of truth)
- docs/QA_UX.md, docs/SECURITY_QA.md (QA gates)
- docs/CURRENT_APP_TREE.md (must update if tree changes)
- docs/ROUTING_BACKLOG.md, BACKLOG.md (living backlog)
- docs/CHANGE_POLICY.md (document behavior changes)

PR BRANCH: codex/r1-routing-audit-schedule-fix

# 0) Primary objective
Fix the /schedule route compile/runtime error after onboarding completes, and perform a comprehensive routing audit:
- Ensure route groups and boundaries follow docs/NEXTJS16_ROUTING_STANDARDS.md
- Eliminate redirect loops / over-eager redirects
- Add correct loading/error boundaries where needed
- Ensure all routes compile cleanly and behave consistently
- Update routing-related docs + reports

# 1) Allowed scope
You may modify:
- src/app/** (pages, layouts, route groups, loading.tsx, error.tsx, not-found.tsx)
- src/components/** (only if required to fix routing imports or client/server boundaries)
- src/lib/** (only if required for routing/auth helpers or to fix compile errors)
- docs/** (routing + QA + backlog updates)

You may NOT:
- Add or change dependencies
- Change database schema or migrations
- Change Stripe or Maps logic (unless it is the direct cause of /schedule errors)
- Add binary assets
- Commit secrets

# 2) Required workflow
1) Start from latest origin/main
2) Reproduce /schedule error locally in task:
   - Run pnpm dev
   - Navigate login -> onboarding -> save -> redirect -> /schedule
   - Capture the actual error message and the file/stack location
3) Fix minimally, aligned with routing standards
4) Run: bash scripts/codex/verify.sh
5) Update docs and open PR

# 3) Audit checklist (must execute)
## 3A) Route inventory
- Enumerate the current route tree by inspecting src/app
- Update docs/CURRENT_APP_TREE.md to match reality

## 3B) Boundary validation (per NEXTJS16_ROUTING_STANDARDS.md)
Ensure:
- Marketing/public routes do not import authed-only modules
- (auth) routes do not depend on (app) layout state
- (app) = auth-only; (app)/(protected) = onboarding gating
- (admin) is isolated and cannot be accessed without admin gating
- Inter-route redirects do not create loops

## 3C) Client/server correctness
- Any file using hooks (useState/useEffect/usePathname) must have "use client"
- Route pages/layouts should be Server Components by default
- Supabase server calls must be in server contexts
- Supabase browser client must only be used in client components
- Fix mismatches causing /schedule compile errors (likely “hooks in server component” or importing browser-only code in server).

## 3D) Segment UX boundaries
Add/adjust:
- loading.tsx for /schedule and other heavy pages (optional but recommended)
- error.tsx where there are known failures
- not-found.tsx where appropriate
All error.tsx must be client components using reset().

# 4) Fix strategy for /schedule (expected patterns)
When /schedule errors occur after onboarding:
Common causes:
- schedule page imports a client component but is used incorrectly
- schedule page imports supabase browser client in a server component
- schedule page uses window/document or next/navigation hooks in server
- schedule page imports a module that reads env vars at build time (throwing)

Required resolution:
- Keep schedule page as Server Component that fetches server data safely, OR
- Convert leaf UI to client components and pass data down
- Ensure env checks do not throw during build/route compile; follow existing env pattern in repo

# 5) Concrete required improvements
## 5A) /schedule route must be stable
- No compilation errors
- If user is not onboarded, redirect to /onboarding (once)
- If missing subscription, show a friendly CTA to pricing/checkout
- If no appointment scheduled, show primary CTA to schedule
- Empty states must be styled (no blank screens)

## 5B) /admin/login redirect stability
- Ensure /admin/login does not loop if user is not admin
- Non-admin users hitting /admin routes should see “insufficient access” or be routed to /account with clear message (per existing behavior)

# 6) Docs updates (must)
Update:
- docs/NEXTJS16_ROUTING_STANDARDS.md:
  - Add any discovered edge-case guidance (e.g. “never infer current route from referer in server guard”)
- docs/CURRENT_APP_TREE.md:
  - accurate app tree after fixes
- docs/QA_UX.md and docs/QA_UX_REPORT.md:
  - Update “Happy Path” to include: onboarding -> schedule -> create appointment
  - Mark /schedule compile issue resolved
- docs/ROUTING_BACKLOG.md:
  - Mark items done + add follow-ups discovered during audit
- docs/BACKLOG.md:
  - Add a concise entry for any future routing improvements (if any)

# 7) PR deliverables
- Fix /schedule compile error (with minimal, standards-compliant changes)
- Improve routing boundaries & add missing loading/error boundaries where it clearly helps
- Docs updated as required
- verify.sh passes

# 8) PR description requirements
Include:
- What was broken, the root cause, and fix summary
- Exact repro steps and how to test
- Routes affected
- Any risks and rollback plan
- Which docs were updated
