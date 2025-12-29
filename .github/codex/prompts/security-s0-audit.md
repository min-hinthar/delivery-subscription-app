You are Codex working in this repo. Follow AGENTS.md, docs/BLUEPRINT.md, and docs/QA_UX.md.

APPROACH: pragmatic yet strict (2025/2026).
- Strict: authz/RLS, webhook verification/idempotency, open redirect prevention, PII logging rules
- Pragmatic: CSP starts Report-Only; rate limits start lightweight then tighten

PR GOAL (S0): Produce a security audit and a prioritized backlog. Prefer documentation only in this PR.

Tasks:
1) Create/complete these docs if missing:
   - docs/SECURITY_OVERVIEW.md
   - docs/THREAT_MODEL.md
   - docs/HEADERS_AND_CSP.md
   - docs/SECURITY_CHECKLIST.md
   - docs/WEBHOOK_SECURITY.md
   - docs/RLS_AUDIT.md

2) Create docs/SECURITY_REPORT.md including:
   - Inventory of API routes, protected routes, webhook, cron, maps endpoints
   - Findings categorized by severity (P0/P1/P2)
   - Concrete fixes referencing files/lines
   - “Quick wins” list

3) Create docs/SECURITY_BACKLOG.md:
   - P0 (must fix), P1 (should), P2 (nice)
   - Each item includes: scope, files, acceptance test

4) Do not change app behavior unless you must fix a critical bug that blocks accurate auditing.
   If you do, keep changes minimal and document them clearly.

5) Run bash scripts/codex/verify.sh.

Acceptance:
- Security docs exist and are coherent.
- SECURITY_REPORT and BACKLOG are actionable and specific.
- pnpm lint/typecheck/build pass.

Open PR branch: codex/security-s0
