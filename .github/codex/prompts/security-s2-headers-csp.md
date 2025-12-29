You are Codex working in this repo. Follow AGENTS.md, docs/BLUEPRINT.md, docs/QA_UX.md.

APPROACH: pragmatic yet strict (2025/2026).
This PR implements strong security headers and CSP rollout WITHOUT breaking Stripe or Maps.

Hard constraints:
- No binary files.
- Keep pnpm lint/typecheck/build passing.
- CSP must be Report-Only first (do not enforce unless you are confident it won't break).

Tasks:
1) Implement baseline security headers using Next.js headers configuration (next.config.ts):
   - X-Content-Type-Options
   - Referrer-Policy
   - X-Frame-Options or CSP frame-ancestors
   - Permissions-Policy
   - HSTS in production only

2) Add CSP Report-Only header:
   - Start with a pragmatic allowlist that supports:
     - Stripe (js.stripe.com, hooks.stripe.com)
     - Google Maps (maps.googleapis.com, maps.gstatic.com, googleapis/gstatic images)
     - Supabase connect-src to project URL
   - Avoid unsafe-eval in production; allow only if dev requires (document it).

3) Document rollout:
   - Update docs/HEADERS_AND_CSP.md with:
     - the exact policy used
     - how to monitor violations
     - how to tighten to enforced CSP

4) Verification:
   - Ensure Checkout and Billing Portal flows still work.
   - Ensure Maps pages still render.
   - Run bash scripts/codex/verify.sh.

Acceptance:
- Headers present and consistent
- CSP Report-Only added and documented
- No critical regressions in Stripe/Maps
- pnpm lint/typecheck/build pass

Open PR branch: codex/security-s2
