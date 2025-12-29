You are Codex. Follow AGENTS.md, docs/QA_UX.md, docs/UI_POLISH_SPEC.md.

PR GOAL (UI B2): Replace placeholder content with real app content and data-driven UI:
- Landing/Pricing copy: real product messaging, trust cues, delivery windows, cutoff info
- Account/Schedule/Track: show real data (profile, subscription state, appointment state)
- Add instructive empty states with next-step CTAs
- Improve forms microcopy and validation messaging
- Ensure dark mode parity across updated components

Constraints:
- Do not change core billing/scheduling logic.
- Minimal API changes allowed only if required to display real data.
- No DB schema changes.
- No binary files.
- Keep pnpm lint/typecheck/build passing.

Deliverables:
- Update docs/UI_POLISH_REPORT.md (mark remaining items).
- Run bash scripts/codex/verify.sh.

Open PR: codex/polish-ui-b2
