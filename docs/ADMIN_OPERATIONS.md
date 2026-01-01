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
### 1) Create or load the weekly menu
1) Go to `/admin/menus`
2) Set **Week of (Saturday)** to the delivery weekend you want (YYYY-MM-DD)
3) Click **Load**
4) If no menu exists, click **Create Menu**
5) Update the menu title (saves on blur)

### 2) Add items
You can add items two ways:
- **Add from Catalog**: picks from `meal_items` (recommended)
- **Add Custom Item**: for one-off specials

### 3) Reorder items
Use **Up/Down** buttons to reorder items. The UI persists the order to `sort_order`.

### 4) Publish
Toggle **Published** ON:
- Sets `weekly_menus.is_published = true`
- Sets `weekly_menus.published_at` if this is the first publish

Once published:
- The public homepage should show “This week’s menu”.

### 5) Unpublish (if needed)
Toggle **Published** OFF to hide the menu publicly.

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
