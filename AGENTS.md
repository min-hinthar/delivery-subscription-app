# AGENTS.md — Codex Rules (Build + Maintain + Improve)

This repository is a production app. Agents must optimize for:
1) security
2) correctness
3) maintainability
4) shipped features

If you find these rules outdated, **update this file in the same PR** with a short rationale.

---

## 1) Prime Directive

### Always ship working software
- Keep `pnpm lint`, `pnpm typecheck`, `pnpm build` passing.
- Prefer small PRs with clear commits.

### Never leak secrets
- Never commit `.env.local` or any API keys.
- Update `.env.example` whenever you add env vars.

### RLS-first
- Every table with user data must have RLS enabled.
- Policies must enforce ownership by default.
- Admin-only actions require `profiles.is_admin = true`.

---

## 2) Next.js 16 Compatibility

- Use App Router + Route Handlers (`src/app/api/**/route.ts`). :contentReference[oaicite:11]{index=11}
- Avoid request interception unless necessary; if needed, Next.js 16 uses `proxy.ts` (not `middleware.ts`). :contentReference[oaicite:12]{index=12}
- Do not cause import-time crashes due to missing env vars. Validate env inside server functions.

---

## 3) Supabase Rules

### Clients
Maintain three clients:
- `browser` client (anon key)
- `server` SSR client (cookies)
- `admin` client (service role, server-only)

### Migrations
- Use `supabase/migrations/001_init.sql`, `002_rls.sql`, `003_triggers.sql`.
- Never edit old migrations after merge; add new ones.

### Policies
- Users can CRUD their own `profiles`, `addresses`, `delivery_appointments`.
- Users can SELECT their own `subscriptions`, `orders`, `payments`.
- Only admins can manage:
  - `meal_items`, `meal_plan_templates`, `delivery_windows`
  - `delivery_routes`, `delivery_stops`
  - cross-user operational views/exports

---

## 4) Stripe Rules

### Required routes
- Checkout session creation (subscription)
- Billing portal session creation
- Webhook handler

### Webhook requirements
- Verify signature with `STRIPE_WEBHOOK_SECRET`.
- Idempotent upserts keyed by Stripe IDs.
- Only trust Stripe webhooks (never trust client-submitted Stripe IDs).

---

## 5) Google Maps Rules

- Geocoding and Directions happen server-side using `GOOGLE_MAPS_API_KEY`.
- Client only renders maps (no unrestricted server keys).
- Plan for waypoint limits; implement route chunking later if needed.

---

## 6) Business Rules (must not regress)

- Delivery windows:
  - Saturday 11:00–19:00 PT
  - Sunday 11:00–15:00 PT
- Cutoff: Friday 17:00 PT for upcoming weekend
- After cutoff: customers cannot change appointments (admin can override)
- Weekly generation:
  - active subs + valid appointment => create order + order items from template
- Tracking:
  - driver updates stop statuses => customers see realtime progress

---

## 7) API Standards

- Validate inputs with zod.
- Standard response shape:
  - `{ ok: true, data }`
  - `{ ok: false, error: { message } }`
- Use correct status codes (401/403/422/500).
- Keep handlers small; put logic in `src/lib/**`.

---

## 8) UX / UI Standards

- Tailwind + shadcn/ui for primitives.
- next-themes + Framer Motion for theme/page transitions.
- Accessibility is required (labels, keyboard navigation, aria).

---

## 9) Vercel Deployment Rules

- Support Vercel env vars (Preview + Production). :contentReference[oaicite:13]{index=13}
- Cron jobs use `vercel.json` and call protected endpoints with `CRON_SECRET`. :contentReference[oaicite:14]{index=14}
- Use Node runtime for Stripe webhooks.

---

## 10) How Agents Should Work (Default Loop)

1) **Scan** existing code/docs/tests.
2) **Plan**: list files to touch, migrations, new env vars.
3) **Implement**: small changes; avoid broad refactors.
4) **Prove**: ensure lint/typecheck/build.
5) **Document**: README / BLUEPRINT updates if behavior changed.

If you discover a better approach, implement it and update AGENTS.md.

---
