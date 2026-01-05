# BLUEPRINT — Morning Star Weekly Delivery App (Production Spec)

This document is the engineering “north star” for building a **finished** production-grade app:
- Subscription billing + appointment scheduling
- Weekend delivery ops (admin route planning)
- Tracking + status updates
- Vercel deployment + cron automation
- Supabase RLS-first security model

---

## 1) Product Goals

### Primary KPIs
- % of subscribed users with valid appointment for week
- On-time delivery rate
- Failed payment recovery rate
- Admin time to produce routes + manifests

### Personas
- Customer (subscriber)
- Admin (ops + billing support)
- Driver (status updates + navigation)

---

## 2) High-Level Architecture

Text diagram:

[Browser]
  ├─ Next.js 16 App Router (RSC + Client Components)
  │    ├─ Route Handlers (/api/*)  ────────────────┐
  │    └─ Admin UI / Customer UI                  │
  │                                               │
  ├─ Supabase (Auth + Postgres + RLS + Realtime)  │
  │       ├─ profiles/addresses/...               │
  │       └─ realtime: delivery_stops updates     │
  │                                               │
  ├─ Stripe (Subscriptions + Billing Portal) <────┤ webhooks
  │                                               │
  └─ Google Maps (Geocode + Directions) <─────────┘ server-side calls

Vercel:
- hosts Next.js (Route Handlers as serverless functions)
- cron triggers secure internal endpoints (weekly generation) :contentReference[oaicite:7]{index=7}

Route Handlers are the standard API mechanism inside `app/` in Next’s App Router. :contentReference[oaicite:8]{index=8}

---

## 3) Next.js 16 Compatibility Notes

- If request interception is needed, Next.js 16 renames `middleware.ts` → `proxy.ts` (Node runtime). Prefer avoiding proxy unless required; if used, follow Next docs for `proxy.ts`. :contentReference[oaicite:9]{index=9}
- Route handlers should explicitly set runtime if needed for Stripe webhook behavior (Node recommended).

---

## 4) Domain Model (Core Concepts)

### Week-of
Represent each delivery week by `week_of` (date) = the Saturday date of that weekend.

### Appointment scheduling
- Customer chooses:
  - Saturday (11–7) or Sunday (11–3)
  - Specific window (configurable; capacity-limited)
- Store: `delivery_appointments`
- Enforce cutoff: Friday 5PM PT for the `week_of`

### Subscription lifecycle
- Customer subscribes via Stripe Checkout
- Webhook syncs Stripe → `subscriptions` table
- App uses cached subscription state for gating access

### Order generation
- Cron job:
  - For each active subscription with an appointment for `week_of`, create `orders`
  - Copy template items → `order_items`
- Admin modifies order items if needed (optional later)

### Route planning
- Admin creates a `delivery_route` for a `week_of`
- Route has many `delivery_stops` (ordered)
- Directions API generates polyline + ETAs (initial estimate)
- Driver updates each stop status; customers see real-time tracking

---

## 5) Database (Supabase)

### Tables (minimum)
- profiles (user metadata, `is_admin`)
- addresses (user addresses, primary address enforcement)
- stripe_customers (map supabase user ↔ stripe customer)
- subscriptions (stripe subscription snapshot)
- delivery_windows (config: day, start/end, capacity)
- delivery_appointments (per-user per-week selection)
- orders (per-user per-week order)
- order_items (line items)
- meal_items (menu items)
- meal_plan_templates (default weekly plan)
- meal_plan_template_items (template → meal items)
- delivery_routes (route summary + polyline)
- delivery_stops (ordered stops + status)
- payments (invoice/payment snapshots)

### RLS strategy
- RLS ON for all user data
- Customers:
  - select/update their profile/address/appointments
  - select their subscription/order/payment history
- Admin:
  - full access to ops tables (routes/stops/windows/meals)
  - ability to view all appointments/orders

### Cutoff enforcement
Enforce in API + DB:
- API: reject appointment changes after cutoff
- DB: trigger or policy preventing updates after cutoff except admin

---

## 6) API Surface (Route Handlers)

Customer-facing:
- POST `/api/subscriptions/checkout`
- POST `/api/subscriptions/portal`
- POST `/api/delivery/appointment`
- POST `/api/maps/geocode`
- POST `/api/maps/directions`

Infrastructure:
- POST `/api/stripe/webhook` (signature verification, idempotent upserts)
- POST `/api/cron/generate-week` (protected by `CRON_SECRET`)

Admin:
- GET/POST `/api/admin/deliveries`
- POST `/api/admin/routes/build`
- GET `/api/admin/manifest.csv`
- GET `/api/admin/prep-summary`

All endpoints:
- zod validation
- `{ ok: true, data }` / `{ ok: false, error }` format
- correct HTTP status codes

---

## 7) Frontend Routes & UX

Marketing:
- `/` (coverage checker + signup CTA)
- `/pricing`

Auth:
- `/login`, `/signup`, `/onboarding`

Customer app:
- `/account` (profile + addresses)
- `/schedule` (calendar + window selection)
- `/track` (live tracking map + statuses)

Admin:
- `/admin` overview
- `/admin/deliveries`
- `/admin/routes`
- `/admin/meals`
- `/admin/subscriptions`

Motion:
- page transitions + theme transitions
- animated dialogs and list reordering

---

## 8) Vercel Deploy + Cron

- Use Vercel env vars (Preview + Production)
- Cron configured in `vercel.json` to call internal endpoints :contentReference[oaicite:10]{index=10}
- Prefer frequent cron execution + server-side PT/DST logic

---

## 9) Production-Grade Requirements (Non-Functional)

Security:
- webhook signature verification
- service role used only server-side
- RLS never bypassed except with admin client in server routes

Reliability:
- webhook idempotency (upsert by Stripe IDs)
- route build uses retries/backoff for Google APIs

Performance:
- server-side caching where safe (menu, windows)
- paginate admin lists
- avoid large client bundles (maps only on pages that need it)

Observability:
- structured server logs
- error boundaries in UI
- optional Sentry integration later

---

## 10) Build Plan (Milestones for Agents)

M0 — Foundations
- Next.js 16 scaffold + Tailwind + shadcn/ui + next-themes + framer-motion
- Supabase SSR clients + auth guards
- Base layouts and route skeletons

M1 — Billing
- Stripe checkout + portal + webhooks
- subscription gating

M2 — Scheduling
- delivery windows + appointment selection + cutoff logic
- seed windows

M3 — Orders
- template menu items
- weekly cron generates orders

M4 — Admin Ops
- deliveries list + manifest export + prep totals
- routes + stops + directions

M5 — Tracking
- realtime stop updates + customer tracking view

M6 — Hardening
- rate limits, audit logs, improved validations, monitoring, playbooks
