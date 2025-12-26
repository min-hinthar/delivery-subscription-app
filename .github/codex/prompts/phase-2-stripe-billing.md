You are Codex in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PHASE 2 GOAL: Stripe billing end-to-end (checkout + portal + webhooks) integrated with Supabase.
Keep pnpm lint/typecheck/build passing.

Hard rules:
- Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET.
- Webhook writes MUST use Supabase service role (admin client) server-side only.
- Webhook must be idempotent (upsert keyed by Stripe IDs).
- Never trust client-supplied Stripe IDs.

Deliverables (must):
1) Server Stripe utility:
   - src/lib/stripe.ts (server-only; safe env validation at runtime)
2) API routes:
   - POST src/app/api/subscriptions/checkout/route.ts
   - POST src/app/api/subscriptions/portal/route.ts
   - POST src/app/api/stripe/webhook/route.ts
   All validated with zod; consistent ok/bad responses and proper status codes.
3) UI:
   - Pricing page has “Subscribe” button that calls checkout endpoint
   - Account page shows subscription status (active/paused/canceled/past_due) from Supabase cache
   - Billing portal link for managing subscription
4) DB:
   - Ensure stripe_customers + subscriptions + payments tables are used correctly.
   - If any schema tweaks are needed, add a new migration (do not rewrite old ones).

Acceptance criteria:
- pnpm lint/typecheck/build pass
- Stripe flow documented in README (setup + webhook events)
Stop after Phase 2 is complete and green.
