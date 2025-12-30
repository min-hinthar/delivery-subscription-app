You are Codex. Follow AGENTS.md, docs/QA_UX.md, and docs/UI_POLISH_SPEC.md.

PR GOAL (P1 UI): Fix high-impact UI polish issues.
Must:
- Fix mobile menu overlay issues: sheet/dropdown must have solid bg (bg-background), correct z-index, and backdrop overlay. No transparency bleed-through.
- Fix contrast issues for buttons/text in both light/dark themes using shadcn tokens (bg-primary text-primary-foreground, etc.). Ensure focus rings remain visible.
- Add tasteful hover gradient effects for primary CTAs and interactive hover transitions (no heavy animations; respect prefers-reduced-motion).
- Add missing theme toggle if not present (reuse existing next-themes; do NOT add a new theming system).
- Add icons (lucide-react) to nav + key CTAs where helpful.
- Update docs/UI_POLISH_REPORT.md with issues fixed and remaining.
- Run bash scripts/codex/verify.sh.

Constraints:
- No DB schema changes.
- No binary files.

Open PR: codex/ui-p1-nav-contrast-gradients
