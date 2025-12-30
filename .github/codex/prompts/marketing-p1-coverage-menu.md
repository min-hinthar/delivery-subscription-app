You are Codex. Follow AGENTS.md, docs/QA_UX.md, docs/CHANGE_POLICY.md.

PR GOAL (P1 Marketing):
1) Add a PUBLIC coverage checker on homepage:
   - User enters ZIP code
   - Calls POST /api/maps/coverage
   - Server geocodes ZIP and checks eligibility:
     - county in COVERAGE_ALLOWED_COUNTIES
     - route distance/time from kitchen origin under thresholds
   - Returns eligible/ineligible with clear reason + ETA/distance when eligible
   - Add soft rate limiting + caching by ZIP

2) Add PUBLIC weekly chef-curated menu section on homepage:
   - Show current week’s published menu items
   - If none, show friendly empty state
   - You may add DB tables/migrations (weekly_menus, weekly_menu_items) with RLS allowing public select ONLY when published.

Requirements:
- Mobile-first layout, dark-mode parity.
- Use existing component system (shadcn) and tasteful motion.
- No binary assets.
- Update .env.example with required variables.
- Run bash scripts/codex/verify.sh.

Open PR: codex/marketing-p1-coverage-menu
