You are Codex in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PHASE 1 GOAL: Foundation + complete Supabase schema/RLS/triggers/seed + core UI scaffolding.
Keep changes reviewable and keep pnpm lint/typecheck/build passing.

Hard rules:
- No secrets committed. Update .env.example only.
- No import-time crashes if env vars missing.
- RLS on all tables; ownership policies; admin via profiles.is_admin.
- Use Next.js App Router route handlers in src/app/api/**/route.ts.

Deliverables (must):
1) Tooling/scripts:
   - package.json scripts: dev, build, start, lint, typecheck (pnpm)
2) Core libs:
   - src/lib/api/response.ts (ok/bad helpers)
   - src/lib/api/types.ts (zod schemas for onboarding/address/appointment/billing inputs)
3) Supabase clients:
   - src/lib/supabase/client.ts (browser)
   - src/lib/supabase/server.ts (SSR cookies via @supabase/ssr)
   - src/lib/supabase/admin.ts (service-role, server-only)
4) UI scaffolding modeled like launch-mvp template (auth, billing, dark mode, motion),
   but compatible with Next.js 16 and Vercel:
   - ThemeProvider (next-themes)
   - ThemeToggle
   - Framer Motion page transitions
   - (app) layout auth guard
   - admin layout admin guard
   - placeholder pages: /, /pricing, /login, /signup, /onboarding, /account, /schedule, /track,
     /admin and subpages
5) Supabase migrations + seed:
   - supabase/migrations/001_init.sql (ALL baseline tables + indexes)
   - supabase/migrations/002_rls.sql (enable RLS + policies + is_admin function)
   - supabase/migrations/003_triggers.sql (updated_at, primary address uniqueness, capacity helper)
   - supabase/seed.sql (delivery windows + meal items + template)
   Baseline tables:
   profiles, addresses, stripe_customers, subscriptions, delivery_windows, delivery_appointments,
   orders, order_items, payments, delivery_routes, delivery_stops, meal_items,
   meal_plan_templates, meal_plan_template_items
6) Update README + docs if needed and ensure .env.example exists.

Acceptance criteria:
- pnpm lint/typecheck/build pass
- migrations are complete and consistent with BLUEPRINT.md
- AGENTS.md still enforced; update it if you improved the process.
Stop after Phase 1 is complete and green.
