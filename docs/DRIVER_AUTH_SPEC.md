# Driver Authentication & Management System - Complete Specification

**Feature:** PR #17 - Driver Authentication, Onboarding & Management
**Priority:** P0 (Critical - Completes driver workflow)
**Estimated Effort:** 3-4 hours
**Dependencies:** PR #16 (Driver Route Tracking) - COMPLETED ✅
**For:** Codex Implementation

---

## 🎯 Executive Summary

This PR completes the driver workflow by adding:
1. **Admin-initiated driver invites** via email
2. **Driver email confirmation** and magic link authentication
3. **Simple driver onboarding** (name, phone, vehicle info)
4. **Driver role & permissions** with RLS policies
5. **Driver dashboard** to view assigned routes
6. **Admin driver management** interface

**Business Value:**
- Secure driver onboarding process
- No password management (magic link only)
- Admin controls driver access
- Complete driver → route → tracking workflow

---

## 📋 Current State Analysis

### What Already Exists (PR #16)
✅ Driver route view (`/driver/route/[id]`)
✅ Location tracking API
✅ Stop management (mark delivered, notes, photos)
✅ Offline queue for location updates
✅ Database: `driver_locations`, `delivery_stops` with driver fields

### What's Missing (This PR)
❌ Driver authentication & signup
❌ Admin driver invite system
❌ Driver onboarding flow
❌ Driver role & permissions
❌ Driver profile management
❌ Admin driver management UI
❌ Driver-specific RLS policies

---

## 🏗️ Architecture Overview

### User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN FLOW                                │
└─────────────────────────────────────────────────────────────┘
1. Admin navigates to /admin/drivers
2. Admin clicks "Invite Driver"
3. Admin enters driver email
4. System sends invite email with magic link
5. Admin sees driver in "Pending" status
6. After driver confirms, status changes to "Active"
7. Admin can assign active drivers to routes

┌─────────────────────────────────────────────────────────────┐
│                    DRIVER FLOW                               │
└─────────────────────────────────────────────────────────────┘
1. Driver receives invite email
2. Driver clicks magic link → redirects to /driver/confirm?token=...
3. Driver confirms email (Supabase verifies)
4. Driver redirected to /driver/onboarding
5. Driver fills out profile:
   - Full name (required)
   - Phone number (required)
   - Vehicle make/model (optional)
   - Vehicle color (optional)
   - License plate (optional)
6. Driver submits → profile created → redirect to /driver/dashboard
7. Driver sees assigned routes (or empty state)
8. Driver clicks route → /driver/route/[id] (existing functionality)

┌─────────────────────────────────────────────────────────────┐
│                 RETURNING DRIVER FLOW                        │
└─────────────────────────────────────────────────────────────┘
1. Driver visits /driver/login
2. Driver enters email
3. System sends magic link
4. Driver clicks link → authenticated → /driver/dashboard
```

---

## 🗄️ Database Schema

### New Table: `driver_profiles`

```sql
create table driver_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text not null,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  license_plate text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  invited_by uuid references profiles(id),
  invited_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_driver_profiles_email on driver_profiles(email);
create index idx_driver_profiles_status on driver_profiles(status);
create index idx_driver_profiles_invited_by on driver_profiles(invited_by);

-- RLS Policies
alter table driver_profiles enable row level security;

-- Drivers can view and update their own profile
create policy "Drivers can view own profile"
  on driver_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Drivers can update own profile"
  on driver_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all driver profiles
create policy "Admins can view all driver profiles"
  on driver_profiles for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Admins can insert driver profiles (via invite)
create policy "Admins can invite drivers"
  on driver_profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Admins can update driver profiles
create policy "Admins can update driver profiles"
  on driver_profiles for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
```

### Update Existing `profiles` Table

```sql
-- Add is_driver column to profiles
alter table profiles add column if not exists is_driver boolean not null default false;

-- Create index
create index if not exists idx_profiles_is_driver on profiles(is_driver);
```

### Update Existing `delivery_routes` Table

```sql
-- Ensure driver_id column exists (should already exist from PR #16)
-- This is just verification
alter table delivery_routes add column if not exists driver_id uuid references driver_profiles(id);
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Setup

**Magic Link Configuration:**
- Enable email auth in Supabase dashboard
- Configure email templates for driver invites
- Set redirect URL: `{SITE_URL}/driver/confirm`

**Custom Email Template (Driver Invite):**
```html
<h2>You've been invited to join as a delivery driver!</h2>
<p>Click the link below to confirm your email and complete your profile:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email & Get Started</a></p>
<p>This link expires in 24 hours.</p>
```

**Custom Email Template (Driver Login):**
```html
<h2>Sign in to your driver dashboard</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link expires in 15 minutes.</p>
```

### Role-Based Access Control (RBAC)

**Roles:**
- `admin`: Full access (existing)
- `customer`: Customer access (existing)
- `driver`: Driver access (NEW)

**Permissions Matrix:**

| Resource | Admin | Customer | Driver |
|----------|-------|----------|--------|
| Admin Dashboard | ✅ | ❌ | ❌ |
| Driver Dashboard | ❌ | ❌ | ✅ |
| Customer Dashboard | ❌ | ✅ | ❌ |
| Driver Profiles (view all) | ✅ | ❌ | Own only |
| Delivery Routes (view all) | ✅ | ❌ | Assigned only |
| Driver Locations (update) | ❌ | ❌ | Own only |
| Customer Tracking | ✅ | Own only | ❌ |

---

## 🎨 UI Components

### 1. Admin Driver Management (`/admin/drivers`)

**Page Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Drivers                                        [Invite Driver] │
├────────────────────────────────────────────────────────────┤
│  [Search drivers...] [Status: All ▼] [Sort: Name ▼]       │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐ │
│  │ John Smith              ✅ Active     [Edit] [Suspend]│ │
│  │ john@example.com • (555) 123-4567                     │ │
│  │ Blue Honda Civic • ABC123                             │ │
│  │ Assigned to: 2 routes                                 │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Jane Doe                ⏳ Pending    [Resend Invite] │ │
│  │ jane@example.com                                      │ │
│  │ Invited 2 days ago                                    │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Components to Create:**
- `src/app/(admin)/admin/drivers/page.tsx` - Main driver management page
- `src/components/admin/driver-list.tsx` - Driver list with filters
- `src/components/admin/driver-card.tsx` - Individual driver card
- `src/components/admin/invite-driver-modal.tsx` - Invite modal

### 2. Invite Driver Modal

**Modal Content:**
```
┌────────────────────────────────────┐
│  Invite Driver                  [×]│
├────────────────────────────────────┤
│  Driver Email Address              │
│  ┌──────────────────────────────┐ │
│  │ driver@example.com           │ │
│  └──────────────────────────────┘ │
│                                    │
│  Optional Message                  │
│  ┌──────────────────────────────┐ │
│  │ Welcome to our delivery team!│ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                    │
│         [Cancel]  [Send Invite]    │
└────────────────────────────────────┘
```

**API Endpoint:**
- `POST /api/admin/drivers/invite`
- Body: `{ email, message? }`
- Response: `{ success, driver_id }`

### 3. Driver Onboarding (`/driver/onboarding`)

**Page Layout:**
```
┌────────────────────────────────────────────────────────────┐
│              Complete Your Driver Profile                  │
├────────────────────────────────────────────────────────────┤
│  Personal Information                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Full Name *                                          │ │
│  │ John Smith                                           │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Phone Number *                                       │ │
│  │ (555) 123-4567                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Vehicle Information (Optional)                            │
│  ┌─────────────────────┐ ┌─────────────────────────────┐ │
│  │ Make                │ │ Model                       │ │
│  │ Honda               │ │ Civic                       │ │
│  └─────────────────────┘ └─────────────────────────────┘ │
│  ┌─────────────────────┐ ┌─────────────────────────────┐ │
│  │ Color               │ │ License Plate               │ │
│  │ Blue                │ │ ABC123                      │ │
│  └─────────────────────┘ └─────────────────────────────┘ │
│                                                            │
│                                 [Complete Profile]         │
└────────────────────────────────────────────────────────────┘
```

**Component:**
- `src/app/(driver)/driver/onboarding/page.tsx` - Onboarding form
- `src/components/driver/onboarding-form.tsx` - Form component

**API Endpoint:**
- `POST /api/driver/profile`
- Body: `{ full_name, phone, vehicle_make?, vehicle_model?, vehicle_color?, license_plate? }`
- Response: `{ success, profile }`

### 4. Driver Dashboard (`/driver/dashboard`)

**Page Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Driver Dashboard                          [Profile] [Logout]│
├────────────────────────────────────────────────────────────┤
│  Today's Routes                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Route #1234          🚗 In Progress  [View Route]    │ │
│  │ 12 stops • Started 30 minutes ago                     │ │
│  │ Next: 123 Main St, Covina, CA                         │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Route #1235          📋 Pending      [Start Route]   │ │
│  │ 8 stops • Scheduled for 2:00 PM                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Completed Today: 1 route • 15 deliveries                 │
└────────────────────────────────────────────────────────────┘
```

**Component:**
- `src/app/(driver)/driver/dashboard/page.tsx` - Main dashboard
- `src/components/driver/route-summary-card.tsx` - Route card

**API Endpoint:**
- `GET /api/driver/routes` - Get driver's assigned routes
- Response: `{ routes: [...] }`

### 5. Driver Login (`/driver/login`)

**Page Layout:**
```
┌────────────────────────────────────┐
│                                    │
│         🚗 Driver Login            │
│                                    │
│  Enter your email to receive a    │
│  secure login link.                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Email Address                │ │
│  │ driver@example.com           │ │
│  └──────────────────────────────┘ │
│                                    │
│       [Send Magic Link]            │
│                                    │
│  Don't have an account?            │
│  Contact your administrator.       │
└────────────────────────────────────┘
```

**Component:**
- `src/app/(auth)/driver/login/page.tsx` - Login page
- Uses Supabase `signInWithOtp({ email })`

---

## 🔌 API Endpoints

### 1. `POST /api/admin/drivers/invite`

**Purpose:** Admin invites a driver via email

**Request:**
```typescript
{
  email: string;
  message?: string; // Optional custom message
}
```

**Response:**
```typescript
{
  ok: boolean;
  driver_id?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

**Implementation:**
```typescript
1. Verify requester is admin
2. Check if email already exists in driver_profiles
3. Create user in Supabase Auth with email
4. Insert into driver_profiles (status: 'pending')
5. Send invite email via Supabase
6. Return driver_id
```

### 2. `POST /api/driver/profile`

**Purpose:** Driver completes onboarding profile

**Request:**
```typescript
{
  full_name: string;
  phone: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_plate?: string;
}
```

**Response:**
```typescript
{
  ok: boolean;
  profile?: DriverProfile;
  error?: { code: string; message: string };
}
```

**Implementation:**
```typescript
1. Verify requester is authenticated driver
2. Validate input (Zod schema)
3. Update driver_profiles table
4. Set status to 'active'
5. Set confirmed_at timestamp
6. Update profiles.is_driver = true
7. Return profile
```

### 3. `GET /api/driver/routes`

**Purpose:** Get driver's assigned routes

**Query Params:**
- `status?: 'pending' | 'active' | 'completed'`
- `date?: YYYY-MM-DD` (default: today)

**Response:**
```typescript
{
  ok: boolean;
  routes?: Array<{
    id: string;
    delivery_date: string;
    start_time: string;
    status: string;
    stop_count: number;
    completed_count: number;
    next_stop?: {
      address: string;
      customer_name: string;
    };
  }>;
}
```

**Implementation:**
```typescript
1. Verify requester is authenticated driver
2. Query delivery_routes where driver_id = auth.uid()
3. Filter by status and date
4. Join with delivery_stops for counts
5. Return routes
```

### 4. `PATCH /api/admin/drivers/[id]`

**Purpose:** Admin updates driver status (suspend/activate)

**Request:**
```typescript
{
  status: 'active' | 'suspended';
}
```

**Response:**
```typescript
{
  ok: boolean;
  driver?: DriverProfile;
}
```

### 5. `POST /api/admin/drivers/[id]/resend-invite`

**Purpose:** Admin resends invite email to pending driver

**Response:**
```typescript
{
  ok: boolean;
  sent_at?: string;
}
```

---

## 🛡️ Security Considerations

### 1. Email Verification
- ✅ Magic links expire after 24 hours (invites) or 15 minutes (login)
- ✅ One-time use only
- ✅ Supabase handles token generation and validation

### 2. RLS Policies
- ✅ Drivers can only view/update their own profile
- ✅ Drivers can only view routes assigned to them
- ✅ Drivers can only update their own location
- ✅ Admins have full access to driver management

### 3. Input Validation
- ✅ Email format validation
- ✅ Phone number format (US format)
- ✅ License plate alphanumeric only
- ✅ Prevent SQL injection with parameterized queries

### 4. Rate Limiting
- ✅ Invite endpoint: 10 invites per hour per admin
- ✅ Login magic link: 3 requests per 15 minutes per email

---

## 📝 Implementation Checklist

### Database (30 minutes)
- [ ] Create migration `017_driver_authentication.sql`
- [ ] Create `driver_profiles` table
- [ ] Add RLS policies for driver_profiles
- [ ] Add `is_driver` column to profiles
- [ ] Test RLS policies with different user roles

### API Endpoints (60 minutes)
- [ ] `POST /api/admin/drivers/invite` - Invite driver
- [ ] `POST /api/driver/profile` - Complete onboarding
- [ ] `GET /api/driver/routes` - Get assigned routes
- [ ] `PATCH /api/admin/drivers/[id]` - Update driver status
- [ ] `POST /api/admin/drivers/[id]/resend-invite` - Resend invite
- [ ] Add input validation (Zod schemas)
- [ ] Add error handling
- [ ] Add rate limiting

### Admin UI (45 minutes)
- [ ] `/admin/drivers` page - Driver list
- [ ] `InviteDriverModal` component
- [ ] `DriverCard` component
- [ ] `DriverList` component with filters
- [ ] Search functionality
- [ ] Status filter (All, Active, Pending, Suspended)

### Driver UI (45 minutes)
- [ ] `/driver/login` page - Magic link login
- [ ] `/driver/onboarding` page - Profile completion
- [ ] `/driver/dashboard` page - Route overview
- [ ] `DriverOnboardingForm` component
- [ ] `RouteSummaryCard` component
- [ ] Profile dropdown in driver nav

### Auth & Routing (30 minutes)
- [ ] Create driver route group `(driver)`
- [ ] Add driver auth middleware
- [ ] Redirect logic after login
- [ ] Redirect logic after onboarding
- [ ] Logout functionality

### Email Templates (15 minutes)
- [ ] Configure Supabase email templates
- [ ] Driver invite template
- [ ] Driver login template
- [ ] Test email delivery

### Testing (30 minutes)
- [ ] Test admin invite flow
- [ ] Test driver onboarding flow
- [ ] Test driver login flow
- [ ] Test RLS policies
- [ ] Test driver dashboard
- [ ] Test admin driver management

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/lib/validation/__tests__/driver-validation.test.ts
describe('Driver Profile Validation', () => {
  it('validates phone number format', () => {
    expect(validatePhone('555-123-4567')).toBe(true);
    expect(validatePhone('invalid')).toBe(false);
  });

  it('validates license plate format', () => {
    expect(validateLicensePlate('ABC123')).toBe(true);
    expect(validateLicensePlate('ABC-123')).toBe(true);
    expect(validateLicensePlate('invalid!')).toBe(false);
  });
});
```

### E2E Tests
```typescript
// tests/e2e/driver-auth.spec.ts
test.describe('Driver Authentication', () => {
  test('admin invites driver successfully', async ({ page }) => {
    // Login as admin
    // Navigate to /admin/drivers
    // Click "Invite Driver"
    // Enter email
    // Verify success message
  });

  test('driver completes onboarding', async ({ page }) => {
    // Use magic link to login
    // Fill out onboarding form
    // Submit
    // Verify redirect to dashboard
  });
});
```

### Manual Testing Checklist
- [ ] Admin can invite driver
- [ ] Driver receives invite email
- [ ] Driver can confirm email via magic link
- [ ] Driver completes onboarding
- [ ] Driver sees assigned routes in dashboard
- [ ] Driver can access route detail page
- [ ] Driver can login with magic link
- [ ] Admin can suspend driver
- [ ] Suspended driver cannot access routes
- [ ] Admin can reactivate driver

---

## 📚 Documentation Updates

### Files to Update
1. **`docs/REMAINING_FEATURES.md`**
   - Add PR #17 as next priority feature
   - Mark as P0 (Critical)

2. **`docs/PR_PROMPTS_NEXT_SESSIONS.md`**
   - Add detailed PR #17 prompt for Codex
   - Include all acceptance criteria

3. **`docs/CLAUDE_CODEX_HANDOFF.md`**
   - Document driver auth specification
   - Add next steps for Codex

4. **`CODEX_PLAYBOOK.md`**
   - Update "What's Next" section
   - Add PR #17 to implementation queue

5. **`AGENTS.md`**
   - Document driver role in RBAC section
   - Update RLS policy examples

---

## 🎯 Acceptance Criteria

### Admin Flow
- [ ] Admin can navigate to `/admin/drivers`
- [ ] Admin can see list of all drivers (active, pending, suspended)
- [ ] Admin can invite a driver by email
- [ ] Admin sees driver in "Pending" status after invite
- [ ] Admin can resend invite email to pending driver
- [ ] Admin can view driver profile details
- [ ] Admin can suspend an active driver
- [ ] Admin can reactivate a suspended driver
- [ ] Admin can search drivers by name or email
- [ ] Admin can filter drivers by status

### Driver Flow
- [ ] Driver receives invite email with magic link
- [ ] Driver clicks link and is redirected to `/driver/onboarding`
- [ ] Driver fills out required fields (name, phone)
- [ ] Driver can optionally add vehicle information
- [ ] Driver submits profile and is redirected to `/driver/dashboard`
- [ ] Driver sees assigned routes on dashboard
- [ ] Driver can click route to view details (`/driver/route/[id]`)
- [ ] Driver can logout
- [ ] Driver can login again via `/driver/login` with magic link

### Security
- [ ] Only admins can access `/admin/drivers`
- [ ] Only drivers can access `/driver/*` routes
- [ ] Drivers can only see their own profile
- [ ] Drivers can only see routes assigned to them
- [ ] Magic links expire appropriately
- [ ] RLS policies prevent unauthorized data access

### Edge Cases
- [ ] Cannot invite duplicate email
- [ ] Graceful error if invite email fails to send
- [ ] Handle expired magic link
- [ ] Handle incomplete onboarding (redirect back to onboarding)
- [ ] Handle suspended driver trying to access dashboard
- [ ] Proper validation error messages

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (`pnpm test && pnpm test:e2e`)
- [ ] Test with real email delivery (staging environment)
- [ ] Verify Supabase email templates configured
- [ ] Verify RLS policies in production database
- [ ] Test magic link expiry times

### Post-Deployment
- [ ] Monitor error logs for auth failures
- [ ] Verify invite emails are delivered
- [ ] Test admin invite flow in production
- [ ] Test driver onboarding in production
- [ ] Monitor driver login success rate

---

## 📊 Success Metrics

### Operational
- Driver invite to activation time: <24 hours
- Magic link success rate: >95%
- Driver onboarding completion rate: >90%
- Admin invite flow time: <2 minutes

### Technical
- RLS policy coverage: 100%
- API response time: <500ms
- Email delivery rate: >99%
- Auth error rate: <1%

---

## 🔄 Future Enhancements (Not in This PR)

1. **Driver Mobile App**
   - Native iOS/Android app
   - Push notifications for route assignments
   - Offline route caching

2. **Driver Messaging**
   - In-app chat with customers
   - In-app chat with admin
   - SMS fallback

3. **Driver Analytics**
   - Performance metrics (on-time %, deliveries/hour)
   - Customer ratings
   - Earnings tracking

4. **Advanced Vehicle Management**
   - Vehicle photos
   - Insurance verification
   - Background check integration

5. **Multi-Admin Roles**
   - Dispatcher role (can assign routes, can't suspend drivers)
   - Manager role (full driver management)
   - Owner role (all permissions)

---

**Specification Version:** 1.0
**Last Updated:** 2026-01-04
**Author:** Claude (Session 8)
**For Implementation By:** Codex
**Estimated Completion:** 3-4 hours
**Status:** ✅ Ready for Implementation
