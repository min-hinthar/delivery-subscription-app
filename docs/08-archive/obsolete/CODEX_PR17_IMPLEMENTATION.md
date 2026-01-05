# 🚀 PR #17: Driver Authentication & Management - Implementation Guide for Codex

**Created:** 2026-01-04
**For:** Codex Implementation
**Priority:** P0 (Critical - Completes driver workflow)
**Estimated Effort:** 3-4 hours
**Prerequisites:** PR #16 (Driver Route Tracking) - ✅ COMPLETED

---

## 📋 Quick Summary

This PR completes the driver workflow by adding:
- Admin-initiated driver invites via email
- Driver email confirmation and magic link authentication
- Simple driver onboarding (name, phone, vehicle info)
- Driver role & permissions with RLS policies
- Driver dashboard to view assigned routes
- Admin driver management interface

**Why This Matters:**
- Without this PR, there's no way for drivers to sign up or log in
- Admins can't manage drivers or send invites
- The driver route tracking from PR #16 is unusable without authentication

---

## ✅ What Already Exists (From PR #16)

✅ Driver route view at `/driver/route/[id]`
✅ Location tracking API
✅ Stop management (mark delivered, notes, photos)
✅ Offline queue for location updates
✅ Database: `driver_locations`, `delivery_stops` with driver fields
✅ Migration: `015_driver_route_updates.sql`

---

## 🎯 What You Need to Implement

### Phase 1: Database Setup (30 min)

#### 1.1 Apply Migration
✅ **Already Created:** `supabase/migrations/017_driver_authentication.sql`

**Action Required:**
```bash
# Test migration locally
supabase db reset

# If successful, migration will be auto-applied when pushed
```

**What the migration creates:**
- `driver_profiles` table (email, full_name, phone, vehicle info, status)
- `profiles.is_driver` column
- RLS policies (drivers see own data, admins see all)
- Indexes for performance
- Auto-update trigger for `updated_at`

---

### Phase 2: API Endpoints (60 min)

Create these 5 API endpoints:

#### 2.1 POST /api/admin/drivers/invite

**File:** `src/app/api/admin/drivers/invite/route.ts`

**Purpose:** Admin invites a driver via email

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body = await request.json();
    const { email, message } = inviteSchema.parse(body);

    // 4. Check if email already exists
    const { data: existing } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: { code: 'DUPLICATE', message: 'Driver already invited' } },
        { status: 409 }
      );
    }

    // 5. Send invite email via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: 'driver',
        invited_by: user.id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/driver/onboarding`,
    });

    if (inviteError) {
      console.error('Invite error:', inviteError);
      return NextResponse.json(
        { ok: false, error: { code: 'INVITE_FAILED', message: 'Failed to send invite' } },
        { status: 500 }
      );
    }

    // 6. Create driver profile (pending status)
    const { error: profileError } = await supabase
      .from('driver_profiles')
      .insert({
        id: inviteData.user.id,
        email,
        full_name: '', // Will be filled during onboarding
        phone: '', // Will be filled during onboarding
        status: 'pending',
        invited_by: user.id,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { ok: false, error: { code: 'PROFILE_ERROR', message: 'Failed to create profile' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      driver_id: inviteData.user.id,
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 422 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

#### 2.2 POST /api/driver/profile

**File:** `src/app/api/driver/profile/route.ts`

**Purpose:** Driver completes onboarding profile

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number'),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_color: z.string().optional(),
  license_plate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const data = profileSchema.parse(body);

    // 3. Update driver profile
    const { data: profile, error: updateError } = await supabase
      .from('driver_profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_color: data.vehicle_color,
        license_plate: data.license_plate,
        status: 'active',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update profile' } },
        { status: 500 }
      );
    }

    // 4. Mark user as driver in profiles table
    await supabase
      .from('profiles')
      .update({ is_driver: true })
      .eq('id', user.id);

    return NextResponse.json({
      ok: true,
      profile,
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 422 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

#### 2.3 GET /api/driver/routes

**File:** `src/app/api/driver/routes/route.ts`

**Purpose:** Get driver's assigned routes

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 3. Query routes
    let query = supabase
      .from('delivery_routes')
      .select(`
        id,
        name,
        delivery_date,
        start_time,
        status,
        delivery_stops (
          id,
          status,
          stop_order,
          delivery_appointments (
            address:addresses (
              line1,
              line2,
              city,
              state,
              postal_code
            )
          )
        )
      `)
      .eq('driver_id', user.id)
      .gte('delivery_date', date)
      .order('delivery_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: routes, error: queryError } = await query;

    if (queryError) {
      console.error('Routes query error:', queryError);
      return NextResponse.json(
        { ok: false, error: { code: 'QUERY_FAILED', message: 'Failed to fetch routes' } },
        { status: 500 }
      );
    }

    // 4. Format response
    const formattedRoutes = routes?.map((route) => ({
      id: route.id,
      name: route.name,
      delivery_date: route.delivery_date,
      start_time: route.start_time,
      status: route.status,
      stop_count: route.delivery_stops?.length || 0,
      completed_count: route.delivery_stops?.filter((s: any) => s.status === 'completed').length || 0,
      next_stop: route.delivery_stops
        ?.filter((s: any) => s.status !== 'completed')
        .sort((a: any, b: any) => a.stop_order - b.stop_order)[0]
        ?.delivery_appointments?.address,
    })) || [];

    return NextResponse.json({
      ok: true,
      routes: formattedRoutes,
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

#### 2.4 PATCH /api/admin/drivers/[id]/route.ts

**File:** `src/app/api/admin/drivers/[id]/route.ts`

**Purpose:** Admin updates driver status (suspend/activate)

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { status } = updateSchema.parse(body);

    // 3. Update driver status
    const { data: driver, error: updateError } = await supabase
      .from('driver_profiles')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update driver' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, driver }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 422 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

#### 2.5 POST /api/admin/drivers/[id]/resend-invite/route.ts

**File:** `src/app/api/admin/drivers/[id]/resend-invite/route.ts`

**Purpose:** Admin resends invite email

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // 2. Get driver email
    const { data: driver } = await supabase
      .from('driver_profiles')
      .select('email, status')
      .eq('id', id)
      .single();

    if (!driver) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    if (driver.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_STATUS', message: 'Can only resend for pending drivers' } },
        { status: 400 }
      );
    }

    // 3. Resend invite
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(driver.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/driver/onboarding`,
    });

    if (inviteError) {
      console.error('Resend error:', inviteError);
      return NextResponse.json(
        { ok: false, error: { code: 'RESEND_FAILED', message: 'Failed to resend invite' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent_at: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Admin UI (45 min)

#### 3.1 Admin Drivers List Page

**File:** `src/app/(admin)/admin/drivers/page.tsx`

**Implementation:** See detailed spec in `docs/DRIVER_AUTH_SPEC.md` lines 241-267

**Key Features:**
- List all drivers with search/filter
- Status badges (Active, Pending, Suspended)
- Quick actions (Edit, Suspend, Resend Invite)
- "Invite Driver" button

#### 3.2 Invite Driver Modal

**File:** `src/components/admin/invite-driver-modal.tsx`

**Implementation:** See spec lines 269-294

**Key Features:**
- Email input with validation
- Optional message field
- Submit calls `/api/admin/drivers/invite`
- Success/error handling

#### 3.3 Driver Card Component

**File:** `src/components/admin/driver-card.tsx`

**Purpose:** Display individual driver in list

**Key Features:**
- Driver name, email, phone
- Vehicle info (if available)
- Status badge
- Action buttons (Edit, Suspend/Activate, Resend)

---

### Phase 4: Driver UI (45 min)

#### 4.1 Driver Login Page

**File:** `src/app/(auth)/driver/login/page.tsx`

**Implementation:** See spec lines 366-392

**Key Features:**
- Email input
- "Send Magic Link" button
- Uses `supabase.auth.signInWithOtp({ email })`
- Link to contact admin for new accounts

#### 4.2 Driver Onboarding Page

**File:** `src/app/(driver)/driver/onboarding/page.tsx`

**Implementation:** See spec lines 296-334

**Key Features:**
- Personal info: Full name (required), Phone (required)
- Vehicle info: Make, Model, Color, License Plate (all optional)
- Progress indicator
- Submit calls `/api/driver/profile`
- Redirect to `/driver/dashboard` on success

#### 4.3 Driver Dashboard Page

**File:** `src/app/(driver)/driver/dashboard/page.tsx`

**Implementation:** See spec lines 336-365

**Key Features:**
- Fetch routes from `/api/driver/routes`
- Show today's routes
- Route cards with status
- "Start Route" / "View Route" buttons
- Link to existing `/driver/route/[id]` page

---

### Phase 5: Auth & Routing (30 min)

#### 5.1 Create Driver Route Group

**Directory:** `src/app/(driver)/`

**Files to create:**
- `layout.tsx` - Driver-specific layout with nav
- `dashboard/page.tsx` - Dashboard (from 4.3)
- `onboarding/page.tsx` - Onboarding (from 4.2)

**Middleware check:**
Ensure driver-only access (check `is_driver` in profiles)

#### 5.2 Update Auth Routes

**Create:** `src/app/(auth)/driver/login/page.tsx`

**Purpose:** Separate login page for drivers (magic link only)

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Admin can invite driver by email
- [ ] Driver receives invite email
- [ ] Driver can click magic link → redirects to onboarding
- [ ] Driver fills out onboarding → profile created
- [ ] Driver redirects to dashboard after onboarding
- [ ] Driver sees assigned routes on dashboard
- [ ] Driver can click route → goes to existing `/driver/route/[id]`
- [ ] Admin can view all drivers in `/admin/drivers`
- [ ] Admin can search drivers
- [ ] Admin can filter by status
- [ ] Admin can suspend/activate driver
- [ ] Admin can resend invite to pending driver
- [ ] Suspended driver cannot access routes

### Edge Cases
- [ ] Cannot invite duplicate email
- [ ] Graceful error if email fails
- [ ] Handle expired magic link
- [ ] Redirect incomplete onboarding back to form
- [ ] Show error if driver tries to access admin pages
- [ ] Show error if admin tries to access driver pages

### Security Testing
- [ ] RLS prevents drivers from seeing other drivers' data
- [ ] RLS prevents drivers from seeing all routes
- [ ] RLS prevents non-admins from inviting drivers
- [ ] Magic links expire after 24 hours
- [ ] Cannot access onboarding without valid auth

---

## 📝 Implementation Order (Recommended)

**Day 1 (2 hours):**
1. ✅ Migration already created
2. Create API endpoints (2.1-2.5)
3. Test endpoints with Postman/curl

**Day 2 (2 hours):**
4. Create admin UI (3.1-3.3)
5. Create driver UI (4.1-4.3)
6. Set up routing (5.1-5.2)
7. Test full flow end-to-end

---

## 🚨 Common Pitfalls to Avoid

1. **Don't forget to set `NEXT_PUBLIC_SITE_URL`** for redirect URLs
2. **Supabase Admin API** requires service role key (only use server-side)
3. **RLS policies** - test with different user roles
4. **Magic link redirects** - ensure redirect URL is in Supabase allowed list
5. **Email templates** - configure in Supabase dashboard (optional but recommended)

---

## 🎯 Definition of Done

- [ ] All 5 API endpoints created and working
- [ ] Admin can invite, view, and manage drivers
- [ ] Driver can receive invite, onboard, and access dashboard
- [ ] Driver can view assigned routes
- [ ] All RLS policies working correctly
- [ ] No TypeScript errors
- [ ] Manual testing complete
- [ ] Documentation updated

---

## 📚 Reference Documents

- Full specification: `docs/DRIVER_AUTH_SPEC.md`
- User flows: Lines 52-89 in spec
- Database schema: Lines 93-189 in spec
- UI mockups: Lines 241-392 in spec
- API specs: Lines 395-533 in spec

---

## 🆘 Need Help?

**Stuck on:**
- Supabase Auth? → Check docs: https://supabase.com/docs/guides/auth
- RLS policies? → Review migration file and test in SQL editor
- TypeScript errors? → Check existing API endpoints for patterns
- Magic links not working? → Verify `NEXT_PUBLIC_SITE_URL` is set correctly

---

**Good luck! This is the final major feature before the app is production-ready! 🚀**
