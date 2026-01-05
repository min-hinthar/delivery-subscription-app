# Stripe Webhook Security — Non-negotiable Rules

Stripe webhooks are a privileged input. Treat them as “trusted only after verification”.

## 1) Verify Signature (Required)
- Verify the `Stripe-Signature` header using your endpoint secret.
- Reject requests that fail verification with 400.

## 2) Idempotency (Required)
Stripe can retry events. Your handler must be safe if the same event is delivered multiple times.
- Store processed `event.id` in a `stripe_events` table (or similar).
- If already processed, return 200 immediately.

## 3) Source of Truth
- Subscription status in your DB is derived from Stripe events.
- Never accept client-submitted subscription status or IDs as truth.

## 4) Minimal Logging (No PII)
- Log: event id, type, created timestamp, outcome
- Do not log: full customer email, address, phone, raw payload

## 5) Event Handling Guidelines
- Handle only required event types.
- Ignore unknown events safely.
- Prefer upserts keyed by Stripe IDs:
  - stripe_customer_id
  - stripe_subscription_id
  - stripe_invoice_id

## 6) Failure Handling
- If DB write fails, return 500 so Stripe retries.
- Ensure partial writes don’t corrupt state (transaction if needed).

## 7) Testing
- Stripe CLI forwarding to local webhook
- Simulate duplicates (replay) to confirm idempotency works
