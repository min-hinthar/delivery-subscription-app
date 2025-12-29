You are Codex. Follow AGENTS.md, docs/QA_UX.md, docs/UI_POLISH_SPEC.md.

PR GOAL (UI B1): Visual polish baseline:
- Fix mobile nav sheet/dropdown background (no transparency issues)
- Add dark/light toggle in customer + admin nav
- Add icons (lucide-react) for nav + CTAs
- Add consistent motion primitives (Framer Motion) for page + modal transitions
- Ensure reduced motion is respected

Constraints:
- Do not change business logic or DB schema.
- No binary files.
- Keep pnpm lint/typecheck/build passing.
- Replace any remaining scaffold placeholder UI text that is visible.

Deliverables:
- Update docs/UI_POLISH_REPORT.md with issues fixed and remaining.
- Run bash scripts/codex/verify.sh.

Open PR: codex/polish-ui-b1
