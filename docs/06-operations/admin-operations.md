# Admin Operations — Morning Star Weekly Delivery

This document explains how admins manage menus, meals, and weekly publishing.

## Roles
- **Admin**: a user with `profiles.is_admin = true`

## Admin Login
1) Go to `/admin/login`
2) Sign in with your admin email/password (or magic link if enabled)

If you cannot access admin pages:
- Confirm your profile has `is_admin = true` in `public.profiles`.

## Weekly Menu Workflow (recommended weekly cadence)
### 1) Build templates
1) Go to `/admin/menus/templates`
2) Click **New template**
3) Name the template + select 21 dishes (7 days × 3 dishes)
4) Save to reuse weekly

### 2) Generate the weekly menu
1) Go to `/admin/menus/generate`
2) Pick a template + week start date (Sunday)
3) Click **Generate weekly menu**

### 3) Publish and monitor
1) Verify the menu items populated correctly
2) Publish once ready (status = `published`)
3) Orders close Wednesday 11:59 PM

Once published:
- The public homepage should show “This week’s menu”.

### 4) Unpublish (if needed)
Set the weekly menu status back to `draft` to hide it publicly.

## Meal Catalog (meal_items)
Meal catalog items power:
- admin “Add from Catalog”
- templates (meal_plan_templates)
- future ordering UX

Recommended practices:
- Prefer **deactivating** (`is_active=false`) instead of deleting
- Keep names stable to avoid breaking templates

## Troubleshooting
### Menu not showing on homepage
- Confirm the weekly menu is published
- Confirm homepage queries the current week menu
- Confirm RLS allows public read only for published menus

### Admin writes failing
- Confirm `SUPABASE_SERVICE_ROLE_KEY` exists in server env
- Confirm you are logged in as an admin user

## Route Planning Workflow (Visual Route Builder)
Use the visual route builder to assign deliveries, optimize order, and export a driver sheet.

### 1) Open route builder
1) Go to `/admin/routes/new`
2) Select the delivery week
3) Confirm unassigned stops appear in the left panel

### 2) Build the route
1) Drag unassigned stops into the route panel
2) Reorder stops as needed
3) Click **Optimize Route** to auto-order via Google Maps

### 3) Assign driver + start time
1) Choose a driver from the dropdown
2) Pick the route start time
3) Click **Save Route** to persist stops and directions

### 4) Export route sheet (PDF)
1) Click **Export PDF** after saving the route
2) Print or share the driver sheet

### Troubleshooting
- If stops cannot be assigned, check that each stop has a full address.
- If optimization fails, retry after verifying Google Maps keys are configured.
