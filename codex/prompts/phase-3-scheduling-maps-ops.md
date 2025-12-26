You are Codex in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PHASE 3 GOAL: Scheduling + Maps + Admin Ops + Cron. Keep pnpm lint/typecheck/build passing.

Hard rules:
- Enforce cutoff Friday 5PM PT (server validation + DB/RLS where applicable).
- Google Geocode + Directions must run server-side using GOOGLE_MAPS_API_KEY.
- Admin-only routes require profiles.is_admin.

Deliverables (must):
1) Customer scheduling:
   - /schedule UI: pick week_of + delivery window (Sat 11–7, Sun 11–3) with capacity feedback
   - POST /api/delivery/appointment route handler with cutoff enforcement
2) Maps API routes:
   - POST /api/maps/geocode (validate + store canonical address)
   - POST /api/maps/directions (route polyline + totals)
3) Admin ops:
   - /admin/deliveries: list, filters, status, prep totals
   - /admin/routes: build routes (directions) + stop ordering
   - manifest export (CSV) endpoint
4) Weekly generation:
   - POST /api/cron/generate-week protected by CRON_SECRET
   - Add vercel.json cron config (UTC schedule) and compute PT cutoff server-side (DST safe)
5) Realtime tracking skeleton:
   - /track shows route + stops and listens for delivery_stops updates (Supabase Realtime)

Acceptance criteria:
- pnpm lint/typecheck/build pass
- README has Vercel cron + ops steps
Stop after Phase 3 is complete and green.
