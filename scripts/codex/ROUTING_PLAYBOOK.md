# Codex Routing Playbook — Next.js 16 App Router (Advanced Patterns)

Read first:
- docs/NEXTJS16_ROUTING_STANDARDS.md
- docs/QA_UX.md
- docs/SECURITY_QA.md

## Hard rules
- Do NOT change DB schema unless explicitly required.
- Do NOT change business rules (billing/scheduling/cutoff logic) in routing-only PRs.
- Keep auth boundaries strict: customer vs admin.
- Keep pnpm lint/typecheck/build passing.
- No binary files.

## Implementation steps (routing PR)
1) Inventory current `src/app` routes and map them into groups:
   - (marketing), (auth), (app), (admin)

2) Implement group layouts:
   - (app) layout: server-side auth guard + navigation
   - (admin) layout: server-side auth + is_admin guard + admin navigation

3) Add segment boundaries:
   - loading.tsx, error.tsx, not-found.tsx where relevant

4) Implement advanced patterns only where they improve UX:
   - Parallel routes (slots) for nav/content/modal
   - Intercepting routes for modal overlays with deep links
   - Optional catch-all for help/legal with smart 404 (notFound())

5) API alignment:
   - ensure route handlers follow zod validation + consistent responses
   - private endpoints no-store

6) Testing:
   - bash scripts/codex/verify.sh
   - Run QA_UX happy path
   - Run SECURITY_QA auth/open-redirect/IDOR checks

## PR notes required
Include in PR description:
- “Routing Changelog” (what moved, what URLs changed)
- Any redirects added
- How to test modal overlays (deep-link + back behavior)
