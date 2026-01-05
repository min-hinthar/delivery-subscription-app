# UI Polish Spec (2025/2026) — Customer + Admin

This spec defines what “polished” means beyond functional.

## Global UI Quality Bar
- No transparent/unstyled dropdowns/sheets on mobile
- No scaffold placeholder content in any visible page
- Clear copy, instructive empty states, and next-step CTAs everywhere
- Dark/Light mode toggle present and accessible
- Icons for major actions (Lucide)
- Motion: subtle, consistent, respects reduced motion
- Consistent spacing/typography (shadcn defaults, Tailwind)
- No layout overflow on mobile

## Components that must be audited (minimum)
- Mobile nav sheet/dropdown background and layering (z-index/backdrop)
- Landing page + Pricing: remove boilerplate; add trust cues + “how it works”
- Account: replace placeholders with real profile/address/subscription status
- Schedule: replace placeholders with real windows/appointment data + helpful guidance
- Track: better empty + waiting states
- Admin: remove scaffold content and add instructive empty states (if real data absent)

## Dark/Light Mode
- Provide a toggle in customer + admin nav
- Persist theme (local storage or cookie)
- Animate transition (Framer Motion) but respect prefers-reduced-motion
- Ensure focus rings and contrast in both themes

## Iconography
Use lucide-react icons for:
- navigation items
- primary CTAs
- status badges (success/warn/error)
No external image assets.

## Motion Rules
- Page transitions: 150–250ms, no bounce by default
- Modals/sheets: fade + slight translate
- Lists: subtle animate-presence for insert/remove
- Reduce motion: disable or shorten transitions

## Acceptance
- QA_UX happy path is nicer (no dead ends, no “blank/placeholder” UI)
- Visual polish meets modern mobile web expectations
- No new business logic changes
