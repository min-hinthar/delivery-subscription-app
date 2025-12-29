You are Codex working in this repo. Follow AGENTS.md, docs/BLUEPRINT.md, docs/QA_UX.md.

APPROACH: pragmatic yet strict (2025/2026).
Implement P0/P1 items from docs/SECURITY_BACKLOG.md with minimal UX disruption.

Hard constraints:
- No binary files.
- Keep pnpm lint/typecheck/build passing.
- Do not weaken auth guards, RLS, webhook verification.
- Add DB migrations only if required; keep them minimal and explain why.

Must implement (typical P0/P1):
1) Open redirect prevention:
   - Any returnTo/redirect param must allow internal paths only.

2) Authorization hardening:
   - Ensure admin APIs/pages enforce profiles.is_admin server-side
   - Ensure customer reads/writes are owner-scoped (and not by client-supplied user_id)
   - Eliminate any IDOR risks in route handlers

3) Webhook hardening:
   - Verify Stripe signature
   - Add idempotency storage (stripe_events table recommended)
   - Ensure webhook handler safely retries and upserts by Stripe IDs

4) Input validation:
   - Every mutating route uses zod validation
   - Errors are sanitized and do not leak secrets or PII

5) Abuse controls (pragmatic):
   - Add lightweight rate limiting to expensive endpoints:
     - /api/maps/geocode
     - /api/maps/directions
   - Add basic caching where safe (optional)

6) Logging/privacy:
   - Remove/avoid logging full PII (address/phone)
   - Add structured logs for webhook/cron without PII

7) Update docs:
   - Update docs/SECURITY_REPORT.md with “resolved” notes
   - Update docs/SECURITY_CHECKLIST.md if new controls added

8) Run bash scripts/codex/verify.sh.

Acceptance:
- P0 items resolved
- Webhook is signature-verified and idempotent
- Admin access is fully gated
- No IDOR paths remain in route handlers
- pnpm lint/typecheck/build pass

Open PR branch: codex/security-s1
