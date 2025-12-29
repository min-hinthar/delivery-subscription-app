You are Codex. Follow AGENTS.md, docs/NEXTJS16_ROUTING_STANDARDS.md, docs/ROUTING_BACKLOG.md, and scripts/codex/ROUTING_PLAYBOOK.md.

PR GOAL (R1): Introduce Next.js 16 route groups and segment boundaries WITHOUT changing URLs or business logic.

Current routes include:
- root: /, /pricing, /login, /signup, /onboarding
- customer app: (app)/account, /schedule, /track
- admin app: (admin)/admin/*
- api routes: src/app/api/**

Must do:
1) Create route groups:
   - (marketing): move src/app/page.tsx and src/app/pricing/page.tsx into (marketing)
   - (auth): move /login, /signup, and auth/callback route into (auth)
   - (app): ensure /onboarding is moved into (app)
   URLs MUST remain identical (route groups do not affect URL paths).

2) Add segment boundaries:
   - Add loading.tsx + error.tsx for (marketing), (auth), (app), (admin)
   - error.tsx must be a client component with a retry button calling reset()

3) Ensure (app) and (admin) layouts enforce server-side auth gating (do not weaken existing gating).
4) Keep API routes in place (src/app/api/**) — do not restructure APIs in this PR.
5) Update docs/CURRENT_APP_TREE.md if it exists, or create it.
6) Run:
   - bash scripts/codex/verify.sh
   - (optional) bash scripts/codex/verify-routing.sh if present

Acceptance:
- All original URLs still work.
- No business logic changes.
- pnpm lint/typecheck/build pass.

Open PR branch: codex/routing-r1-groups-boundaries
