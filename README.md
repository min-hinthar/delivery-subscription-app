# Mandalay Morning Star — Weekly Delivery Subscription App (Next.js 16)

Production-grade weekly meal delivery subscription + appointment scheduling app for Mandalay Morning Star Burmese Kitchen (Covina). Customers subscribe to a weekly plan, pick weekend delivery windows, and track delivery. Admins manage routes, manifests, and weekly prep totals.

Built with **Next.js 16 (App Router)**, **Supabase (Auth + Postgres + RLS)**, **Stripe subscriptions**, **Google Maps (geocode + directions)**, **Tailwind + shadcn/ui**, and **Framer Motion**.

> Design inspiration: the patterns of a modern Stripe + Supabase + Next template (auth, billing, dark mode, motion), upgraded for Next.js 16 + Vercel and extended for delivery operations. :contentReference[oaicite:1]{index=1}

---

## Features

### Customer
- Supabase Auth: email/password + magic link
- Profile onboarding: name, phone, primary address
- Address validation + geocoding (Google Maps)
- Subscribe to weekly plan (Stripe Checkout)
- Manage subscription (Stripe Billing Portal)
- Pick delivery appointment window (Sat/Sun)
- Cutoff enforcement: **Friday 5:00 PM PT** for upcoming weekend changes
- Delivery tracking (Realtime updates)

### Admin
- Upcoming deliveries view (filters, statuses)
- Route planning map view (Directions API)
- Delivery manifest export (CSV)
- Meal prep summary (totals per dish)
- Configure delivery windows + capacity
- Override/assist customer scheduling (admin-only)

---

## Tech Stack

- Next.js 16 (App Router, Route Handlers) :contentReference[oaicite:2]{index=2}
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres + RLS) + @supabase/ssr (cookie-based SSR)
- Stripe (subscriptions + billing portal + webhooks)
- Google Maps Platform (Geocoding + Directions + Maps JS)
- Framer Motion + next-themes (dark/light mode transitions)
- Vercel deploy + Cron Jobs (weekly generation jobs) :contentReference[oaicite:3]{index=3}

---

## Repo Tour

src/
app/
(marketing)/ # landing, pricing
(auth)/ # login, signup, onboarding
(app)/ # account, schedule, track
admin/ # admin dashboard
api/ # route handlers (Stripe, maps, scheduling)
components/ # UI (shadcn + custom)
lib/
supabase/ # browser/server/admin clients
stripe/ # stripe server utilities
maps/ # geocode/directions utilities
auth/ # guards, helpers
supabase/
migrations/
001_init.sql
002_rls.sql
003_triggers.sql
seed.sql
docs/
BLUEPRINT.md
RUNBOOK.md # optional but recommended

---

## Getting Started (Local)

### Prerequisites
- Node 20+
- pnpm (recommended via Corepack)
- Supabase project (or local Supabase CLI)
- Stripe account (test mode OK)
- Google Cloud project with Maps APIs enabled

### 1) Install
- bash
- corepack enable
- pnpm install

### 2) Configure env
- Create .env.local using .env.example (do not commit .env.local).
- Next.js env variable behavior: server-only by default; browser must be NEXT_PUBLIC_

### 3) Supabase database
Option A (recommended): Supabase CLI
- supabase init
- supabase link --project-ref <ref>
- Apply migrations: supabase db push
- Seed: supabase db seed

Option B: Supabase SQL Editor
- Run supabase/migrations/*.sql in order
- Run supabase/seed.sql

### 4) Stripe setup
- Create Product + Price for weekly subscription
- Enable Customer Portal (Billing Portal)
- Copy:
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET (from Stripe CLI or dashboard endpoint)
NEXT_PUBLIC_STRIPE_PRICE_WEEKLY (Price ID)

Webhook events handled:
- checkout.session.completed (customer mapping)
- customer.subscription.created/updated/deleted (subscription cache)
- invoice.payment_succeeded / invoice.payment_failed (payment cache)

### 5) Webhooks (local)
Use Stripe CLI to forward events to:
- POST /api/stripe/webhook
(Ensure the route handler verifies webhook signatures and is idempotent.)

### 6) Google Maps
Enable APIs:
- Geocoding API
- Directions API
- Maps JavaScript API
Set:
- GOOGLE_MAPS_API_KEY (server)
- NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID (client map styling)

### 7) Run dev
pnpm dev

### Deploy to Vercel
1. Import the repo into Vercel
2. Set Environment Variables (Project → Settings → Environment Variables)
3. Deploy
Vercel’s Next.js integration is first-class; Route Handlers are deployed as functions automatically. 

Stripe webhook in production
- Create a webhook endpoint in Stripe pointing to:
-- /api/stripe/webhook
- Add the production webhook secret as STRIPE_WEBHOOK_SECRET

Cron jobs (weekly order generation)
Use Vercel Cron Jobs to call a secure internal route (e.g. /api/cron/generate-week) with CRON_SECRET. Cron schedules are configured in vercel.json. 
Note: Cron schedules are in UTC. For PT cutoff logic (and DST), run cron frequently (e.g. every 15 minutes) and compute eligibility server-side.

### Admin Bootstrap
To grant admin to your account:
- update profiles.is_admin = true for your user in Supabase SQL editor (or provide an admin-only script in docs).

### Operational Workflow
Weekly cycle
1. Customers select a delivery window for the upcoming weekend
2. Friday 5PM PT cutoff locks changes
3. Cron job generates orders + order_items from templates
4. Admin builds delivery routes and assigns stop order
5. Driver updates stop status → customers see live tracking

### Contributing
- Follow AGENTS.md rules (security + RLS + Stripe idempotency + build gates).
- Keep PRs small and reviewable.

### License
Proprietary (restaurant internal) unless you choose otherwise.
