PR GOAL: Fix mobile navigation overlay/z-index/contrast/open-close issues.

Must:
- Update SiteHeader mobile nav to use boolean open state (not pathname-based)
- Ensure backdrop blocks interactions and has correct z-index
- Ensure panel uses solid bg-background and closes on link click, ESC, route change
- Add scroll lock while open
- Improve ThemeToggle hover/contrast
- Update docs/BACKLOG.md entry
- Run bash scripts/codex/verify.sh

Open PR: codex/ui-hotfix-mobile-nav
