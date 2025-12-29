You are Codex. Follow:
- AGENTS.md
- docs/NEXTJS16_ROUTING_STANDARDS.md
- scripts/codex/ROUTING_PLAYBOOK.md

PR GOAL: Refactor routing to match advanced Next.js 16 App Router patterns:
- route groups (marketing/auth/app/admin)
- parallel routes (slots) for composable shells
- intercepting routes for modal overlays with deep links
- segment loading/error boundaries
- correct caching behavior for private vs public

Constraints:
- No DB schema changes unless strictly required.
- No business logic changes.
- No binary files.
- Keep pnpm lint/typecheck/build passing.

Acceptance:
- Customer happy path in docs/QA_UX.md still works.
- Security checks in docs/SECURITY_QA.md still pass.
- If URLs change, add redirects and document them.

Run: bash scripts/codex/verify.sh
Open PR branch: codex/routing-nextjs16
