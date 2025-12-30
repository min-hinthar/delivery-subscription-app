You are Codex. Follow AGENTS.md, docs/QA_UX.md, docs/UI_POLISH_SPEC.md (if present), docs/CHANGE_POLICY.md.

PR GOAL (P1 UI): Fix high-impact UI polish issues.
Must:
- Fix mobile menu overlay issues: sheet/dropdown must have solid bg (bg-background), correct z-index, and backdrop overlay. No transparency bleed-through.
- Fix contrast issues for buttons/text in both light/dark themes using shadcn tokens. Ensure focus rings remain visible.
- Add tasteful hover gradient effects for primary CTAs and interactive hover transitions (respect prefers-reduced-motion).
- Ensure theme toggle uses existing next-themes (do NOT add a second theming system).
- Add icons (lucide-react) to nav + key CTAs where helpful.
- Update docs/UI_POLISH_REPORT.md (create if missing) with issues fixed and remaining.
- Run bash scripts/codex/verify.sh.

Constraints:
- No DB schema changes.
- No binary files.

Open PR: codex/ui-p1-nav-contrast-gradients
