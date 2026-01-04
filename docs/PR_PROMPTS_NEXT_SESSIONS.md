# PR Prompts for Next Sessions — Claude + Codex Collaboration

**Created:** 2026-01-03
**Purpose:** Guide future development sessions with clear, actionable prompts
**Usage:** Each session, choose a prompt and execute it fully

---

## 🎯 How to Use This Document

**For each new PR:**
1. Choose a prompt based on priority
2. Complete ALL tasks in that prompt
3. Update this document with completion status
4. Create PR following the template
5. Next person reviews and provides critical feedback
6. Iterate until merged

**Priority Levels:**
- **P0:** Critical (blocks other work, security, broken features)
- **P1:** High (major UX/admin workflow improvements)
- **P2:** Medium (nice-to-have features)
- **P3:** Low (polish, optimizations)

---

## ⚙️ Git Setup for Codex (REQUIRED READING)

**Before starting ANY prompt below, set up the branch correctly:**

### If Working on a Claude Branch
```bash
# Step 1: Fetch the Claude branch
git fetch origin claude/plan-claude-integration-2tdsK

# Step 2: Checkout with tracking (CRITICAL)
git checkout -b claude/plan-claude-integration-2tdsK origin/claude/plan-claude-integration-2tdsK

# Step 3: Pull latest changes
git pull

# Step 4: Review what Claude did
pnpm dev
pnpm test
```

### If Creating a New Codex Branch
```bash
# Step 1: Ensure you're on latest main
git checkout main
git pull origin main

# Step 2: Create Codex branch
git checkout -b codex/design-system-2.0

# Step 3: Work on your changes
# ... make changes ...

# Step 4: Commit and push
git add -A
git commit -m "feat: implement design system 2.0"
git push -u origin codex/design-system-2.0
```

**For full git workflow details, see AGENTS.md Section 16**

---

## 🚀 PHASE 1: Foundation & Design System (Weeks 1-2)

### PR #1: Design System 2.0 — Foundation (P0)

**Branch:** `codex/design-system-2.0`
**Status:** ✅ COMPLETED & MERGED (PR #53)
**Completed By:** Codex
**Merged:** 2026-01-04

**What to Implement:**

1. **Update Global CSS** (`src/app/globals.css`)
   - [ ] Add new Burmese-inspired color palette (golden, crimson, deep brown)
   - [ ] Define gradient variables (hero, card, CTA)
   - [ ] Add typography scale (modular scale 1.25)
   - [ ] Define semantic spacing variables
   - [ ] Add new focus states with brand colors

2. **Update Tailwind Config** (`tailwind.config.ts`)
   - [ ] Extend colors with brand palette
   - [ ] Add custom font families (Playfair Display for headings, Inter for body)
   - [ ] Configure custom shadows
   - [ ] Add custom animations

3. **Create Design Tokens File** (`src/lib/design/tokens.ts`)
   ```typescript
   export const colors = {
     brand: {
       primary: '#D4A574',   // Golden
       secondary: '#8B4513', // Deep brown
       accent: '#DC143C',    // Crimson
     },
     // ... etc
   };
   ```

4. **Update Button Component** (`src/components/ui/button.tsx`)
   - [ ] Add `destructive` variant
   - [ ] Add `loading` prop with spinner
   - [ ] Update gradient styles with new brand colors
   - [ ] Add size variants: `sm`, `default`, `lg`, `icon`
   - [ ] Write tests for new variants

**Testing:**
- [ ] Run existing button tests
- [ ] Add tests for new variants
- [ ] Visual regression test in Storybook (if available)
- [ ] Test dark mode compatibility

**Review Checklist:**
- [ ] All colors pass WCAG AA contrast
- [ ] Gradients work in light/dark mode
- [ ] Typography scale is consistent
- [ ] Button variants cover all use cases
- [ ] No breaking changes to existing components

**Expected Outcome:**
- New design system ready for rollout
- All components can start using new colors/typography
- Foundation for all future UI work

---

### PR #2: Core Form Components (P0)

**Branch:** `codex/form-components`
**Status:** ✅ COMPLETED & MERGED (PR #55)
**Completed By:** Codex
**Merged:** 2026-01-04

**What to Implement:**

1. **Input Field Component** (`src/components/ui/input-field.tsx`)
   - [ ] Label + input + helper text + error message
   - [ ] Left/right icon support
   - [ ] Validation states (error, success, warning)
   - [ ] Consistent styling across all states
   - [ ] Accessibility (ARIA labels, roles)
   - [ ] Write comprehensive tests

2. **Select Component** (`src/components/ui/select.tsx`)
   - [ ] Custom-styled dropdown
   - [ ] Searchable variant
   - [ ] Multi-select support
   - [ ] Mobile bottom sheet on small screens
   - [ ] Keyboard navigation
   - [ ] Write tests

3. **Date Picker Component** (`src/components/ui/date-picker.tsx`)
   - [ ] Calendar view
   - [ ] Range selection
   - [ ] Disabled dates support
   - [ ] Mobile-optimized
   - [ ] Integration with react-hook-form
   - [ ] Write tests

4. **Modal/Dialog Component** (`src/components/ui/modal.tsx`)
   - [ ] Full-screen on mobile, centered on desktop
   - [ ] Focus trap (lock focus inside modal)
   - [ ] Backdrop blur
   - [ ] Slide-up animation (mobile), fade (desktop)
   - [ ] Escape to close
   - [ ] Write tests

**Testing:**
- [ ] Test all form components with keyboard navigation
- [ ] Test accessibility with screen readers
- [ ] Test mobile responsiveness
- [ ] Test validation states
- [ ] Integration test with a real form

**Review Checklist:**
- [ ] All form fields accessible (labels, ARIA)
- [ ] Validation errors clear and helpful
- [ ] Mobile UX smooth (no keyboard issues)
- [ ] Works with react-hook-form/Zod
- [ ] Consistent with design system

**Expected Outcome:**
- Reusable form components ready
- Can replace inline form fields across app
- Better UX consistency

---

## 🏠 PHASE 2: Customer Experience (Weeks 2-3)

### PR #3: Homepage Redesign (P1)

**Branch:** `claude/plan-claude-integration-2tdsK`
**Status:** ✅ COMPLETED & MERGED (PR #52)
**Completed By:** Claude (Session 3)
**Merged:** 2026-01-03

**What to Implement:**

1. **Hero Section Redesign** (`src/app/(marketing)/page.tsx`)
   - [ ] Add professional food photography carousel
   - [ ] Implement ZIP coverage checker above the fold
   - [ ] Update copy to be more compelling
   - [ ] Add gradient background
   - [ ] Make CTA more prominent

2. **Weekly Menu Preview Section**
   - [ ] Create `WeeklyMenuPreview` component
   - [ ] Display current week's menu with photos
   - [ ] Card-based layout (4 dishes, scrollable on mobile)
   - [ ] "View Full Menu" CTA

3. **How It Works Timeline**
   - [ ] Create visual 3-step timeline
   - [ ] Icons/illustrations for each step
   - [ ] Animated on scroll (Framer Motion)

4. **Social Proof Section**
   - [ ] Customer testimonials component
   - [ ] Star ratings display
   - [ ] Photos (if available)

5. **Sticky Mobile CTA**
   - [ ] Sticky "Get Started" button on mobile
   - [ ] Safe area aware (notch)
   - [ ] Smooth show/hide on scroll

**Assets Needed:**
- [ ] Hero food photography (3-5 high-quality images)
- [ ] Dish photos for menu preview (6+ dishes)
- [ ] Customer testimonials (3-5)
- [ ] Star rating data

**Testing:**
- [ ] Mobile responsiveness (375px, 768px, 1024px+)
- [ ] Scroll performance (no jank)
- [ ] Image loading (lazy, optimized)
- [ ] CTA conversion tracking setup

**Review Checklist:**
- [ ] Imagery is high-quality and appetizing
- [ ] Copy is compelling and clear
- [ ] CTAs are prominent and actionable
- [ ] Page loads fast (<2s)
- [ ] SEO optimized (meta tags, structured data)

**Expected Outcome:**
- Professional, conversion-optimized homepage
- Showcases food and value proposition
- Ready to drive signups

---

### PR #4: Onboarding Flow Enhancement (P1)

**Branch:** `codex/onboarding-enhancement`
**Status:** ✅ COMPLETED & MERGED (PR #60)
**Completed By:** Codex
**Merged:** 2026-01-04

**What to Implement:**

1. **Add Welcome Step** (`src/components/onboarding/welcome-step.tsx`)
   - [ ] New step 0: Welcome screen with value prop
   - [ ] "Let's get started" CTA
   - [ ] Brand imagery

2. **Enhance Profile Step**
   - [ ] Add household size selector (radio buttons)
   - [ ] Phone number formatting (US format)
   - [ ] Better field layout

3. **Implement Address Autocomplete** (`src/components/onboarding/address-autocomplete.tsx`)
   - [ ] Integrate Google Places Autocomplete
   - [ ] Parse address components
   - [ ] Pre-fill street, city, state, ZIP
   - [ ] Manual entry fallback

4. **Add Preferences Step** (`src/components/onboarding/preferences-step.tsx`)
   - [ ] Preferred delivery day (Sat/Sun/Either)
   - [ ] Preferred time window (Morning/Afternoon/Evening)
   - [ ] Dietary restrictions (multi-select)

5. **Update Progress Indicator**
   - [ ] Visual dots showing 4 steps
   - [ ] Current step highlighted
   - [ ] Completed steps marked

**Testing:**
- [ ] Test Google Places integration
- [ ] Test form validation at each step
- [ ] Test back/forward navigation
- [ ] Test data persistence
- [ ] Test mobile UX

**Review Checklist:**
- [ ] Address autocomplete works reliably
- [ ] Phone formatting is correct
- [ ] Progress is clear
- [ ] Can go back and edit
- [ ] Data saves correctly

**Expected Outcome:**
- Smooth, guided onboarding
- Captures preferences early
- Better user experience

---

### PR #5: Schedule Page with Calendar Picker (P1)

**Branch:** `codex/ui-p1-schedule-calendar`
**Status:** ✅ COMPLETED & MERGED (PR #57)
**Completed By:** Codex
**Merged:** 2026-01-04

**What to Implement:**

1. **Calendar Component** (`src/components/schedule/calendar-picker.tsx`)
   - [ ] Visual month calendar
   - [ ] Highlight available days (Sat/Sun)
   - [ ] Gray out past cutoff days
   - [ ] Click to select date
   - [ ] Mobile-optimized

2. **Time Slot Selector** (`src/components/schedule/time-slot-selector.tsx`)
   - [ ] Radio buttons for time windows
   - [ ] Show availability (X of Y slots)
   - [ ] Disable full windows
   - [ ] Visual capacity indicator

3. **Delivery Summary Card**
   - [ ] Show selected date, time, address
   - [ ] "Change" and "Confirm" buttons
   - [ ] Confirmation modal

4. **Update Schedule Page** (`src/app/(app)/(protected)/schedule/page.tsx`)
   - [ ] Replace dropdown with calendar
   - [ ] Integrate time slot selector
   - [ ] Add summary card
   - [ ] Update API calls

**Testing:**
- [ ] Test date selection
- [ ] Test capacity limits
- [ ] Test cutoff enforcement
- [ ] Test mobile calendar UX
- [ ] Integration test full flow

**Review Checklist:**
- [ ] Calendar is intuitive
- [ ] Availability is clear
- [ ] Cutoff is enforced
- [ ] Mobile UX is smooth
- [ ] Confirmation works

**Expected Outcome:**
- Visual, intuitive scheduling
- Matches DoorDash/Uber Eats UX
- Better conversion

---

### PR #6: Live Delivery Tracking (P1) ⭐ NEXT HEAVY WORKLOAD

**Branch:** `codex/live-delivery-tracking`
**Status:** 🔜 READY TO START
**Priority:** P1 (High-value customer feature)
**Estimated Effort:** 2-3 hours
**Prerequisites:** PR #10 (Google Maps Foundation) - see below

**What to Implement:**

1. **Animated Truck Marker** (`src/components/track/animated-marker.ts`)
   - [ ] Smooth marker movement between locations
   - [ ] Truck icon rotation based on direction
   - [ ] Easing animation

2. **Real-time Map Updates** (`src/components/track/tracking-map.tsx`)
   - [ ] Supabase Realtime subscription
   - [ ] Update truck position every 10s
   - [ ] Polyline showing route (completed vs. remaining)
   - [ ] Customer location pin

3. **ETA Display Component** (`src/components/track/eta-display.tsx`)
   - [ ] Large, prominent ETA
   - [ ] Progress bar showing route completion
   - [ ] "Arriving in X minutes" text

4. **Delivery Timeline** (`src/components/track/delivery-timeline.tsx`)
   - [ ] List of all stops
   - [ ] Completed stops (checkmark)
   - [ ] Current stop (animated)
   - [ ] Upcoming stops (gray)

5. **Driver Info Card** (collapsed by default)
   - [ ] Driver name, photo
   - [ ] Contact button (if enabled)

**Database Updates:**
- [ ] Create `driver_locations` table
- [ ] Add RLS policies
- [ ] Add indexes

**Testing:**
- [ ] Test real-time updates
- [ ] Test marker animation
- [ ] Test mobile map performance
- [ ] Integration test with mock data

**Review Checklist:**
- [ ] Map animations smooth
- [ ] Real-time updates work
- [ ] ETA is accurate
- [ ] Mobile performance good
- [ ] Privacy respected

**Expected Outcome:**
- DoorDash-quality tracking
- Customers see live updates
- Reduced support tickets

---

## 👨‍💼 PHASE 3: Admin Tools (Weeks 3-4)

### PR #7: Admin Dashboard Redesign (P1)

**Branch:** `claude/admin-dashboard-redesign`

**What to Implement:**

1. **Enhanced Metrics Cards** (`src/app/(admin)/admin/page.tsx`)
   - [ ] Add trending indicators (↑↓)
   - [ ] Add week-over-week comparison
   - [ ] Add revenue metrics

2. **Route Status Section** (`src/components/admin/route-status.tsx`)
   - [ ] Live route status display
   - [ ] Driver info per route
   - [ ] Progress indicators
   - [ ] Quick actions (Track, Assign Driver)

3. **Alerts Section** (`src/components/admin/admin-alerts.tsx`)
   - [ ] Pending confirmations
   - [ ] Route delays
   - [ ] System notifications

4. **Quick Actions**
   - [ ] Create Route button
   - [ ] Export Manifest button
   - [ ] Manage Menus link

**Testing:**
- [ ] Test metrics calculation
- [ ] Test route status updates
- [ ] Test quick actions
- [ ] Mobile admin view

**Review Checklist:**
- [ ] Metrics are accurate
- [ ] Real-time updates work
- [ ] Quick actions functional
- [ ] Mobile usable

**Expected Outcome:**
- Operational command center
- Admins see everything at a glance
- Quick access to key tasks

---

### PR #8: Deliveries Management Enhancement (P1)

**Branch:** `codex/deliveries-management`
**Status:** ✅ COMPLETED & MERGED (PR #59)
**Completed By:** Codex
**Merged:** 2026-01-04
**Note:** Also included search functionality from PR #7

**What to Implement:**

1. **Search Functionality** (`src/components/admin/delivery-search.tsx`)
   - [ ] Search by customer name, email, phone
   - [ ] Real-time search (debounced)
   - [ ] Highlight matches

2. **Advanced Filters** (`src/components/admin/delivery-filters.tsx`)
   - [ ] Status filter (multi-select)
   - [ ] Route filter
   - [ ] Day filter
   - [ ] Sort options

3. **Bulk Actions** (`src/components/admin/bulk-actions.tsx`)
   - [ ] Select all checkbox
   - [ ] Assign to route (bulk)
   - [ ] Export selected (CSV)
   - [ ] Send message (bulk)

4. **Enhanced Delivery List** (`src/components/admin/delivery-list.tsx`)
   - [ ] Table view on desktop
   - [ ] Card view on mobile
   - [ ] Expandable details
   - [ ] Inline actions (Edit, Assign, Message)

5. **Pagination**
   - [ ] Page size selector (10, 25, 50, 100)
   - [ ] Page navigation
   - [ ] Total count display

**API Updates:**
- [ ] Add search endpoint
- [ ] Add bulk update endpoint
- [ ] Add pagination support

**Testing:**
- [ ] Test search performance
- [ ] Test filters
- [ ] Test bulk actions
- [ ] Test pagination
- [ ] Integration tests

**Review Checklist:**
- [ ] Search is fast
- [ ] Filters work correctly
- [ ] Bulk actions reliable
- [ ] Pagination smooth
- [ ] Mobile usable

**Expected Outcome:**
- Admins can find any delivery quickly
- Bulk operations save time
- Scalable for 100+ deliveries/week

---

### PR #9: Visual Route Builder (P0) ⭐ HEAVY WORKLOAD

**Branch:** `codex/visual-route-builder`
**Status:** 🔜 READY TO START
**Priority:** P0 (Critical admin efficiency)
**Estimated Effort:** 3-4 hours
**Prerequisites:** PR #10 (Google Maps Foundation) - see below

**What to Implement:**

1. **Unassigned Stops Panel** (`src/components/admin/unassigned-stops.tsx`)
   - [ ] List of stops needing assignment
   - [ ] Drag-and-drop support
   - [ ] Filter options

2. **Route Builder Map** (`src/components/admin/route-builder-map.tsx`)
   - [ ] Interactive Google Map
   - [ ] Show all stops as markers
   - [ ] Show route polyline
   - [ ] Drag stops to reorder

3. **Route Details Panel** (`src/components/admin/route-details.tsx`)
   - [ ] Route metrics (distance, duration, stops)
   - [ ] Driver assignment dropdown
   - [ ] Start time picker
   - [ ] Stop sequence (drag to reorder)

4. **Route Optimization** (`src/lib/maps/route-optimizer.ts`)
   - [ ] Call Google Directions API
   - [ ] Optimize waypoint order
   - [ ] Calculate metrics
   - [ ] Update route in DB

5. **Export Route Sheet** (`src/app/api/admin/routes/export-pdf/route.ts`)
   - [ ] Generate PDF with:
     - Route map
     - Stop list with addresses
     - Estimated times
     - Customer contact info
   - [ ] Printer-friendly format

**Database Updates:**
- [ ] Add `driver_id` to routes table
- [ ] Add `start_time`, `end_time`
- [ ] Add `actual_distance`, `actual_duration`

**Testing:**
- [ ] Test drag-and-drop
- [ ] Test route optimization
- [ ] Test PDF generation
- [ ] Mobile builder UX

**Review Checklist:**
- [ ] Drag-and-drop intuitive
- [ ] Optimization works correctly
- [ ] PDF looks professional
- [ ] Mobile UX acceptable
- [ ] Performance good with 20+ stops

**Expected Outcome:**
- Visual, intuitive route planning
- Auto-optimization saves time
- Printable route sheets for drivers

---

## 🗺️ PHASE 4: Google Maps Integration (Week 4)

### PR #10: Google Maps Foundation (P0) ⭐⭐ TOP PRIORITY HEAVY WORKLOAD

**Branch:** `codex/google-maps-foundation`
**Status:** 🚀 RECOMMENDED NEXT
**Priority:** P0 (Blocks PR #6, #9, #11)
**Estimated Effort:** 3-4 hours
**Business Impact:** Enables real-time tracking and route optimization

**What to Implement:**

1. **API Setup**
   - [ ] Configure Google Maps API keys
   - [ ] Set up API restrictions
   - [ ] Add browser key to env vars
   - [ ] Create Map ID for custom styling

2. **Database Schema** (`supabase/migrations/XXX_driver_locations.sql`)
   - [ ] Create `driver_locations` table
   - [ ] Add RLS policies
   - [ ] Create indexes
   - [ ] Update `routes` table
   - [ ] Update `delivery_stops` table

3. **Driver Location API** (`src/app/api/driver/location/route.ts`)
   - [ ] POST endpoint to update location
   - [ ] Auth check (driver only)
   - [ ] Upsert location in DB
   - [ ] Trigger ETA recalculation

4. **Map Utilities** (`src/lib/maps/`)
   - [ ] `createStyledMap()` - Initialize map with custom styling
   - [ ] `AnimatedMarker` class - Smooth marker animation
   - [ ] `parseAddressComponents()` - Parse Google Places results

5. **Directions API Proxy** (`src/app/api/maps/directions/route.ts`)
   - [ ] Server-side proxy for Directions API
   - [ ] Route optimization support
   - [ ] Caching

**Testing:**
- [ ] Test API key restrictions
- [ ] Test driver location updates
- [ ] Test map rendering
- [ ] Test animated markers

**Review Checklist:**
- [ ] API keys properly restricted
- [ ] Database schema correct
- [ ] RLS policies secure
- [ ] Map utilities work
- [ ] No API key leakage

**Expected Outcome:**
- Google Maps infrastructure ready
- Real-time location tracking working
- Foundation for tracking features

---

### PR #11: Real-Time ETA Engine (P1)

**Branch:** `claude/realtime-eta`

**What to Implement:**

1. **ETA Calculator** (`src/lib/maps/eta-calculator.ts`)
   - [ ] `calculateCustomerETA()` - Multi-factor ETA calculation
   - [ ] Use Distance Matrix API
   - [ ] Factor in traffic, stops, buffer
   - [ ] Return estimated arrival time

2. **Batch ETA Updates** (`src/lib/maps/update-etas.ts`)
   - [ ] `updateCustomerETAs()` - Update all customers on route
   - [ ] Triggered by driver location updates
   - [ ] Calculate ETAs for all upcoming stops
   - [ ] Store in `delivery_stops.estimated_arrival`

3. **Distance Matrix Proxy** (`src/app/api/maps/distance-matrix/route.ts`)
   - [ ] Server-side proxy
   - [ ] Batch requests support
   - [ ] Caching by origin/destination pair

4. **Rate Limiting** (`src/lib/rate-limiter.ts`)
   - [ ] Protect map APIs from abuse
   - [ ] 60 requests per minute per IP
   - [ ] Return 429 on exceeded

**Testing:**
- [ ] Test ETA accuracy
- [ ] Test batch updates
- [ ] Test rate limiting
- [ ] Integration test full flow

**Review Checklist:**
- [ ] ETA calculations reasonable
- [ ] Performance good (sub-second)
- [ ] Rate limiting works
- [ ] Cost-optimized

**Expected Outcome:**
- Accurate ETAs for customers
- Real-time updates as driver moves
- Cost-efficient API usage

---

## 🎨 PHASE 5: Polish & Optimization (Ongoing)

### PR #12: Image Optimization & CDN (P2)

**Branch:** `codex/image-optimization`

**What to Implement:**

1. **Food Photography Integration**
   - [ ] Add hero images to `/public/images/`
   - [ ] Optimize images (WebP format, <100KB each)
   - [ ] Use next/image everywhere
   - [ ] Lazy loading

2. **Dish Photos for Menu**
   - [ ] Add 20+ dish photos
   - [ ] Consistent dimensions (800x600)
   - [ ] Add alt text (SEO + accessibility)

3. **Image CDN Setup** (optional)
   - [ ] Configure Vercel Image Optimization
   - [ ] Or integrate Cloudinary
   - [ ] Update image URLs

4. **Placeholder Images**
   - [ ] Low-quality image placeholders (LQIP)
   - [ ] Blur-up effect

**Testing:**
- [ ] Test image loading performance
- [ ] Test lazy loading
- [ ] Lighthouse image scores

**Review Checklist:**
- [ ] All images optimized
- [ ] Lazy loading works
- [ ] Alt text present
- [ ] Page speed improved

**Expected Outcome:**
- Fast image loading
- Better visual appeal
- Improved SEO

---

### PR #13: Mobile Navigation Enhancement (P2)

**Branch:** `claude/mobile-nav`

**What to Implement:**

1. **Bottom Tab Navigation** (`src/components/navigation/mobile-tabs.tsx`)
   - [ ] Fixed bottom navigation on mobile
   - [ ] Icons: Home, Schedule, Track, Account
   - [ ] Active state highlighting
   - [ ] Safe area padding

2. **Swipe Gestures**
   - [ ] Swipe to dismiss modals
   - [ ] Pull-to-refresh on lists

3. **Touch Optimizations**
   - [ ] Increase tap targets to 44px minimum
   - [ ] Add haptic feedback (if supported)
   - [ ] Reduce long-press delay

**Testing:**
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test with various screen sizes

**Review Checklist:**
- [ ] Navigation intuitive
- [ ] Gestures smooth
- [ ] Works on all devices

**Expected Outcome:**
- Native app-like feel
- Better mobile UX
- Higher engagement

---

### PR #14: Performance Optimization (P2)

**Branch:** `codex/performance-optimization`

**What to Implement:**

1. **Code Splitting**
   - [ ] Lazy load admin pages
   - [ ] Lazy load Google Maps
   - [ ] Dynamic imports for heavy components

2. **Bundle Analysis**
   - [ ] Run next-bundle-analyzer
   - [ ] Identify large dependencies
   - [ ] Replace/optimize heavy packages

3. **Caching Strategy**
   - [ ] Service worker for offline
   - [ ] Cache static assets
   - [ ] Prefetch critical routes

4. **Database Query Optimization**
   - [ ] Add indexes to slow queries
   - [ ] Batch queries where possible
   - [ ] Implement data pagination

**Testing:**
- [ ] Lighthouse scores (aim for 90+)
- [ ] Core Web Vitals all green
- [ ] Load testing (50+ concurrent users)

**Review Checklist:**
- [ ] Bundle size reduced
- [ ] Page load <2s
- [ ] Lighthouse green
- [ ] No regressions

**Expected Outcome:**
- Lightning-fast app
- Better SEO
- Higher conversion

---

## 📊 PR Template

**Use this template for every PR:**

```markdown
## Summary
Brief description of what this PR does and why.

## Related Issues
- Closes #XX
- Addresses feedback from #YY
- Part of [BACKLOG.md item]

## Changes Made
### Added
- [ ] Feature X
- [ ] Component Y

### Changed
- [ ] Updated Z for better UX

### Fixed
- [ ] Bug in A

## Testing Completed
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing on mobile
- [ ] Accessibility tested
- [ ] Cross-browser tested

## Screenshots/Videos
[Add before/after screenshots or demo video]

## Checklist
- [ ] Code follows AGENTS.md standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] Lighthouse score maintained/improved
- [ ] Mobile tested
- [ ] Dark mode tested
- [ ] Accessibility verified

## Review Focus
Key areas for reviewer to focus on:
1. [Specific concern #1]
2. [Specific concern #2]

## Comparison with Top Apps
How does this compare to:
- DoorDash: [comparison]
- Uber Eats: [comparison]
- HelloFresh: [comparison]

## Next Steps
What should be done next after this PR:
- [ ] Follow-up PR for X
- [ ] Codex to implement Y
- [ ] Claude to review Z
```

---

## 🔄 Session Handoff Protocol

**After Each Session:**

1. **Update This Document**
   - [ ] Mark completed prompts
   - [ ] Add new prompts if needed
   - [ ] Update priorities

2. **Update Handoff Doc** (`CLAUDE_CODEX_HANDOFF.md`)
   - [ ] What was completed
   - [ ] What needs review
   - [ ] What's next
   - [ ] Open questions

3. **Create Detailed PR**
   - [ ] Use template above
   - [ ] Link to prompt in this doc
   - [ ] Tag for review

4. **Review Partner's Work**
   - [ ] Critical review (not rubber stamp!)
   - [ ] Test thoroughly
   - [ ] Suggest improvements
   - [ ] Approve or request changes

---

## 📈 Success Metrics

Track these for each PR:

**Code Quality:**
- TypeScript coverage: 100%
- Test coverage: >75%
- Lighthouse score: >90
- Bundle size: <500KB initial load

**UX Metrics:**
- Page load time: <2s
- Time to interactive: <3s
- CLS: <0.1
- FID: <100ms

**Business Metrics:**
- Signup conversion: Baseline → +30%
- Mobile bounce rate: Baseline → -40%
- Admin efficiency: Baseline → +50%

---

---

## 🎯 PROGRESS SUMMARY (Updated 2026-01-04)

### ✅ Completed PRs (7 Features - ALL MERGED!)

**Phase 1 - Foundation:**
- ✅ PR #1: Design System 2.0 Foundation (Codex, PR #53)
- ✅ PR #2: Core Form Components (Codex, PR #55)

**Phase 2 - Customer Experience:**
- ✅ PR #3: Homepage Redesign (Claude Session 3, PR #52)
- ✅ PR #4: Onboarding Flow Enhancement (Codex, PR #60)
- ✅ PR #5: Schedule Page Calendar Picker (Codex, PR #57)

**Phase 3 - Admin Tools:**
- ✅ PR #7: Admin Dashboard Search (Codex, PR #58)
- ✅ PR #8: Deliveries Management / Bulk Actions (Codex, PR #59)

**Pricing Page Bonus:**
- ✅ Pricing Page Redesign (Codex, PR #56)

### 🚀 Next Heavy Workload Phases - DETAILED IMPLEMENTATION GUIDE

---

## ⭐⭐ PRIORITY 1: Google Maps Foundation (PR #10)

**Why This First:**
- Blocks PR #6 (Live Tracking) and PR #9 (Route Builder)
- Foundational infrastructure for all maps features
- High business value - enables competitive tracking features

**Implementation Strategy:**

### Step 1: API Setup & Security (30 min)
1. **Create Google Cloud Project**
   - Enable Maps JavaScript API
   - Enable Geocoding API
   - Enable Directions API
   - Enable Distance Matrix API
   - Enable Places API

2. **Generate & Restrict API Keys**
   ```bash
   # Browser key (Maps JS API)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."
   # Restrictions: HTTP referrers (your-domain.com/*)

   # Server key (Geocoding, Directions, Distance Matrix)
   GOOGLE_MAPS_SERVER_API_KEY="..."
   # Restrictions: IP addresses (Vercel IPs)
   ```

3. **Create Map ID for Custom Styling**
   - Go to Map Styles in Google Cloud Console
   - Create new map style (Burmese-inspired colors)
   - Note the Map ID for client-side maps

### Step 2: Database Schema (45 min)

**Create Migration:** `supabase/migrations/XXX_google_maps_foundation.sql`

```sql
-- Driver locations table (real-time tracking)
CREATE TABLE driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  heading numeric(5, 2), -- 0-360 degrees
  speed numeric(6, 2), -- km/h
  accuracy numeric(6, 2), -- meters
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_heading CHECK (heading IS NULL OR (heading >= 0 AND heading <= 360))
);

-- RLS Policies
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can update their own location
CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view own location"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Customers can view driver location if on their route
CREATE POLICY "Customers can view driver on their route"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_stops ds
      JOIN appointments a ON ds.appointment_id = a.id
      WHERE ds.route_id = driver_locations.route_id
        AND a.user_id = auth.uid()
        AND a.status IN ('confirmed', 'in_transit')
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all driver locations"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Indexes for performance
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_route_id ON driver_locations(route_id);
CREATE INDEX idx_driver_locations_updated_at ON driver_locations(updated_at DESC);

-- Update routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS actual_distance integer; -- meters
ALTER TABLE routes ADD COLUMN IF NOT EXISTS actual_duration integer; -- seconds

-- Update delivery_stops table
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS estimated_arrival timestamptz;
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS actual_arrival timestamptz;
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS geocoded_lat numeric(10, 8);
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS geocoded_lng numeric(11, 8);
```

### Step 3: Map Utilities (60 min)

**File:** `src/lib/maps/map-utils.ts`

```typescript
/**
 * Initialize Google Map with custom Burmese-inspired styling
 */
export function createStyledMap(
  container: HTMLElement,
  mapId: string,
  options?: google.maps.MapOptions
): google.maps.Map {
  const defaultOptions: google.maps.MapOptions = {
    center: { lat: 16.8661, lng: 96.1951 }, // Yangon, Myanmar
    zoom: 12,
    mapId, // Custom styling
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    ...options,
  };

  return new google.maps.Map(container, defaultOptions);
}

/**
 * Parse Google Places Autocomplete result
 */
export function parseAddressComponents(
  place: google.maps.places.PlaceResult
): {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
} {
  const components = place.address_components || [];

  const getComponent = (type: string): string => {
    const comp = components.find((c) => c.types.includes(type));
    return comp?.long_name || '';
  };

  const street = [
    getComponent('street_number'),
    getComponent('route'),
  ].filter(Boolean).join(' ');

  return {
    street,
    city: getComponent('locality') || getComponent('sublocality'),
    state: getComponent('administrative_area_level_1'),
    zip: getComponent('postal_code'),
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}
```

**File:** `src/lib/maps/animated-marker.ts`

```typescript
/**
 * Animated marker that smoothly moves between positions
 */
export class AnimatedMarker {
  private marker: google.maps.Marker;
  private currentPosition: google.maps.LatLng;
  private targetPosition: google.maps.LatLng | null = null;
  private animationFrameId: number | null = null;

  constructor(
    map: google.maps.Map,
    position: google.maps.LatLng,
    icon?: google.maps.Icon | google.maps.Symbol
  ) {
    this.currentPosition = position;
    this.marker = new google.maps.Marker({
      position,
      map,
      icon: icon || {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#D4A574',
        fillOpacity: 1,
        strokeColor: '#8B4513',
        strokeWeight: 2,
      },
    });
  }

  /**
   * Animate marker to new position over duration
   */
  animateTo(
    newPosition: google.maps.LatLng,
    duration: number = 1000
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      this.targetPosition = newPosition;
      const startTime = Date.now();
      const startLat = this.currentPosition.lat();
      const startLng = this.currentPosition.lng();
      const endLat = newPosition.lat();
      const endLng = newPosition.lng();

      // Calculate heading (rotation angle)
      const heading = google.maps.geometry.spherical.computeHeading(
        this.currentPosition,
        newPosition
      );

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const lat = startLat + (endLat - startLat) * eased;
        const lng = startLng + (endLng - startLng) * eased;

        this.currentPosition = new google.maps.LatLng(lat, lng);
        this.marker.setPosition(this.currentPosition);

        // Rotate marker to face direction of travel
        const icon = this.marker.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.rotation = heading;
          this.marker.setIcon(icon);
        }

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animationFrameId = null;
          resolve();
        }
      };

      animate();
    });
  }

  getPosition(): google.maps.LatLng {
    return this.currentPosition;
  }

  setMap(map: google.maps.Map | null): void {
    this.marker.setMap(map);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.marker.setMap(null);
  }
}
```

### Step 4: API Endpoints (60 min)

**File:** `src/app/api/driver/location/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const locationSchema = z.object({
  route_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const location = locationSchema.parse(body);

    // Upsert driver location
    const { error: upsertError } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: user.id,
        route_id: location.route_id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id,route_id',
      });

    if (upsertError) {
      console.error('Failed to update driver location:', upsertError);
      return NextResponse.json(
        { ok: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update location' } },
        { status: 500 }
      );
    }

    // TODO: Trigger ETA recalculation (PR #11)

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid location data', details: error.errors } },
        { status: 422 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/maps/directions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const directionsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  waypoints: z.array(z.string()).optional(),
  optimize: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = directionsSchema.parse(body);

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', params.origin);
    url.searchParams.set('destination', params.destination);
    url.searchParams.set('key', process.env.GOOGLE_MAPS_SERVER_API_KEY!);

    if (params.waypoints && params.waypoints.length > 0) {
      const waypointsParam = params.optimize
        ? `optimize:true|${params.waypoints.join('|')}`
        : params.waypoints.join('|');
      url.searchParams.set('waypoints', waypointsParam);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { ok: false, error: { code: 'DIRECTIONS_ERROR', message: data.error_message || 'Failed to get directions' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 422 }
      );
    }

    console.error('Directions API error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch directions' } },
      { status: 500 }
    );
  }
}
```

### Step 5: Testing & Verification (45 min)

**Create test file:** `src/lib/maps/__tests__/map-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance, formatDuration } from '../map-utils';

describe('Map Utilities', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      // Yangon to Mandalay (approx 630km)
      const distance = calculateDistance(16.8661, 96.1951, 21.9588, 96.0891);
      expect(distance).toBeGreaterThan(600000);
      expect(distance).toBeLessThan(650000);
    });

    it('returns 0 for same point', () => {
      const distance = calculateDistance(16.8661, 96.1951, 16.8661, 96.1951);
      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('formats meters', () => {
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('formats kilometers', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(5432)).toBe('5.4km');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes', () => {
      expect(formatDuration(180)).toBe('3min');
      expect(formatDuration(3599)).toBe('60min');
    });

    it('formats hours', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(5400)).toBe('1h 30min');
    });
  });
});
```

**Verification Checklist:**
- [ ] Google Maps API keys created and restricted
- [ ] Map ID created for custom styling
- [ ] Database migration runs successfully
- [ ] RLS policies tested (driver, customer, admin)
- [ ] Driver location API endpoint works
- [ ] Directions API proxy works
- [ ] Map utilities pass tests
- [ ] No API keys leaked in client bundle

### Expected Completion Time: 3-4 hours

---

## ⭐ PRIORITY 2: Visual Route Builder (PR #9)

**Prerequisite:** PR #10 must be completed first

**Why This Matters:**
- Biggest admin efficiency gain
- Reduces route planning from 1 hour → 10 minutes
- Auto-optimization saves fuel and time

**Implementation Strategy:**

### Key Components:
1. **Drag-and-Drop Interface** (use `@dnd-kit/core`)
2. **Google Maps Integration** (display stops, routes, optimization)
3. **Route Optimization Algorithm** (Google Directions API with waypoint optimization)
4. **PDF Export** (printable route sheets for drivers)

### Estimated Effort: 3-4 hours

---

## ⭐ PRIORITY 3: Live Delivery Tracking (PR #6)

**Prerequisite:** PR #10 must be completed first

**Why This Matters:**
- Competitive feature (DoorDash/Uber Eats standard)
- Reduces "where's my order?" support tickets
- Increases customer satisfaction

**Implementation Strategy:**

### Key Components:
1. **Real-time Map Component** (Google Maps + Supabase Realtime)
2. **Animated Truck Marker** (smooth movement, heading rotation)
3. **ETA Display** (multi-factor calculation)
4. **Delivery Timeline** (completed/current/upcoming stops)

### Estimated Effort: 2-3 hours

---

## 📊 Recommended Implementation Order

### Week 1:
1. **PR #10: Google Maps Foundation** (3-4 hours) ← START HERE
2. **PR #11: Real-time ETA Engine** (2 hours)

### Week 2:
3. **PR #9: Visual Route Builder** (3-4 hours)
4. **PR #6: Live Delivery Tracking** (2-3 hours)

### Week 3:
5. **PR #12: Image Optimization** (2 hours)
6. **PR #13: Mobile Navigation** (2 hours)
7. **PR #14: Performance Optimization** (2-3 hours)

**Total Estimated Time for Remaining Work: 16-20 hours**

---

**Last Updated:** 2026-01-04
**Status:** Active - HEAVY WORKLOADS DETAILED
**Owner:** Claude + Codex team
**Next Recommended:** PR #10 (Google Maps Foundation)
