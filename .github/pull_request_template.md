## Summary
- What does this PR change?
- Why is it needed?
- Backlog item(s): (link to `docs/BACKLOG.md` entry if applicable)

## Type of change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor (no behavior change)
- [ ] Security hardening
- [ ] Performance improvement
- [ ] Documentation only
- [ ] Platform/DevEx (verify/build/CI)

## Scope / Risk
- Affected areas:
- Risk level: [low / medium / high]
- Rollback plan:
- Breaking changes (URLs, DB schema, API contracts): [none / yes — describe]

## Screenshots / recordings (required for UI changes)
- Desktop:
- Mobile:
- Accessibility notes (contrast/focus states/keyboard): (brief)

## How to test (required)
### Local gates
- [ ] `bash scripts/codex/verify.sh` (lint/typecheck/build)

### Codex/CI build note (required if env changes)
- [ ] Verify passes in ephemeral environments (no real secrets committed)
- [ ] If `CODEX_VERIFY` / stub env introduced/used, documented in `docs/CODEX_DEVEX.md`

### Manual QA (customer)
- [ ] Follow `docs/QA_UX.md` “Happy path”
- [ ] Verify edge cases relevant to this PR

### Manual QA (admin) — if admin affected
- [ ] `/admin/login` loads without redirect loop
- [ ] Admin pages are protected by server-side admin gating

### Dev environment (hosted Supabase / Stripe test) — if applicable
- [ ] Auth works (login/logout)
- [ ] Subscription state reflects Stripe webhook updates
- [ ] Scheduling works (cutoff + capacity)
- [ ] Tracking renders (empty state and live state)

## Security checklist (required for any server/API/auth/billing changes)
### Auth / Authorization
- [ ] Protected routes require auth (no accidental public access)
- [ ] Admin-only routes enforce `profiles.is_admin` server-side
- [ ] No open redirects (only allow internal return paths)
- [ ] IDOR check: cannot access other users’ resources by guessing IDs
- [ ] Supabase RLS enforced for all user-owned tables (ownership policies)

### Input validation / API safety
- [ ] All Route Handlers validate input (zod or equivalent)
- [ ] Error responses do not leak secrets/PII
- [ ] Rate limiting / abuse controls considered for public endpoints (maps, auth, webhook)

### Stripe
- [ ] Webhook signature verification is enforced
- [ ] Webhook processing is idempotent (safe on retries / duplicates)
- [ ] Client never sends trusted Stripe IDs (server derives from session/customer)

### Headers / CSP (if touched)
- [ ] Security headers updated via `next.config` headers
- [ ] CSP updated/tested (Report-Only first if tightening)

## Data & privacy checklist
- [ ] No secrets committed; only `.env.example` updated
- [ ] Logs avoid PII (full address, phone) unless explicitly needed
- [ ] Public endpoints do not leak precise addresses; only return safe summaries
- [ ] Any new analytics/tracking reviewed for consent and PII

## DB changes
- [ ] No schema changes
OR
- [ ] New migration added: `supabase/migrations/____.sql`
- [ ] RLS updated & tested
- [ ] Seed updated (idempotent)
- [ ] Rollback/impact documented (what happens if migration is reverted)

## UI/UX quality bar (required for UI changes)
- [ ] No transparent overlays/sheets (mobile nav, dropdowns) — correct z-index + backdrop
- [ ] Contrast OK in light/dark themes (buttons/text)
- [ ] Focus states visible; keyboard navigation works
- [ ] `prefers-reduced-motion` respected for animations/transitions
- [ ] No scaffold placeholder content visible on user-facing pages
- [ ] No binary assets added (use SVG/lucide)

## Observability
- [ ] Errors are actionable (not raw stack traces)
- [ ] Key events logged (webhook received, cron ran) without PII

## Codex metadata (if applicable)
- Prompt file used:
- Branch name:
- Notes / follow-ups:
