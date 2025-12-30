# Workstreams

This document defines the disciplined workflow for using Codex to improve the app.

## Workstreams
- Platform/DevEx (verify/build, CI ergonomics)
- Routing/Auth (redirect loops, route groups, auth UX)
- UI/UX (mobile nav, contrast, motion, onboarding clarity)
- Marketing/Public (coverage check, weekly menu, conversion)
- Security (webhooks, idempotency, headers/CSP, RLS audits)

## Process
1) Add/Update backlog item in `docs/BACKLOG.md`
2) Create a single PR targeting 1–3 backlog items
3) Ensure `bash scripts/codex/verify.sh` passes
4) Merge to `main`
5) Repeat

## Definition of Done
- Acceptance criteria satisfied for the backlog item(s)
- QA steps included in PR description
- No secrets or binaries committed
- Docs updated
