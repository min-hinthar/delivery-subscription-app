You are Codex working in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PRIMARY QA STANDARD: docs/QA_UX.md (2025/2026).
Your job is to make the CUSTOMER experience conform to QA_UX.md as closely as possible.

PR GOAL (PR C): QA Alignment Hardening.
Do a systematic audit of customer pages and implement fixes so the QA_UX checklist passes:
- responsive layout
- performance/perceived speed
- accessibility
- security UX guardrails
- motion/interactive motion
- empty/error/loading states

Hard constraints:
- Avoid DB schema changes unless absolutely necessary to satisfy QA_UX security constraints.
  If needed, add a new migration and explain why.
- Do not add binary files.
- Keep pnpm lint/typecheck/build passing.
- Do not loosen auth, RLS, or webhook requirements.

Process (follow in order):
1) Create a short audit table in docs/QA_UX_REPORT.md with:
   - Page: /, /pricing, /login, /signup, /onboarding, /account, /schedule, /track
   - PASS/FAIL per category: Nav/CTAs, Loading, Errors, Empty states, A11y, Motion, Mobile layout
   - List the concrete changes you will make.
2) Implement the fixes.
3) Add minimal automated smoke coverage if easy:
   - At least one Playwright test OR simple route-level smoke tests (if test tooling exists).
   - If no tests exist, do not introduce a huge test framework; keep it minimal.
4) Ensure security UX requirements:
   - protected routes redirect and explain why
   - no open redirects
   - avoid leaking PII in UI and logs (minimize address display)
5) Validate motion:
   - ensure prefers-interactive-motion disables or shortens transitions
6) Performance/perceived speed:
   - skeletons prevent blank screen
   - avoid loading Maps on pages that don’t need it
7) Run:
   - pnpm lint
   - pnpm typecheck
   - pnpm build

Acceptance criteria:
- docs/QA_UX_REPORT.md shows all customer pages PASS on core categories.
- No regressions in business logic.
- pnpm lint/typecheck/build pass.

Stop after completing PR C.
