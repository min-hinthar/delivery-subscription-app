# QA_UX Report — Customer QA Alignment (PR C)

## Audit Table

| Page | Nav/CTAs | Loading | Errors | Empty states | A11y | Motion | Mobile layout |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/pricing` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/login` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/signup` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/onboarding` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/account` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/schedule` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/track` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## Changes applied
- Added reduced-motion fallbacks to shorten transitions and avoid motion-heavy UI when `prefers-reduced-motion` is enabled.
- Ensured protected route redirects preserve the intended return path and explain auth gating via the existing alert messaging.
- Prevented onboarding redirect loops so new users can complete setup without repeated redirects.
- Normalized auth callback redirect handling so onboarding links return to the expected setup flow.
- Minimized address PII in the Account and Tracking views while keeping operational map data intact.
- Added configuration guardrail on `/track` when Supabase env is missing to avoid blank screens.
- Confirmed signup confirm link reaches `/onboarding` once without looping.
- Confirmed pre-onboarding visits to `/schedule` redirect to `/onboarding` once.
- Confirmed post-onboarding access to `/account`, `/schedule`, and `/track`.

## Smoke coverage
- No lightweight test tooling (Playwright/Jest/etc.) is present in the repo, so no new smoke tests were added.
