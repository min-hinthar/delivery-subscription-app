# RLS Audit & Policy Standards — Supabase (2025/2026)

RLS is the primary defense against cross-tenant data leaks.

## Policy Principles
1) Default deny: RLS enabled everywhere with explicit policies.
2) Ownership enforced by `auth.uid()` equality checks.
3) Admin access requires `profiles.is_admin = true` (via a stable helper function).
4) Use indexes for columns referenced in policies to keep queries fast.

## Required Tables (Minimum)
- profiles (id = auth.uid())
- addresses (user_id = auth.uid())
- delivery_appointments (user_id = auth.uid())
- subscriptions (user_id = auth.uid())
- orders (user_id = auth.uid())
- order_items (order_id belongs to user)
- payments (user_id = auth.uid())
- delivery_stops: customers must only see their own stop (if exposed at all)

Admin-controlled tables
- delivery_windows
- meal_items
- meal_plan_templates (+ items)
- delivery_routes
- delivery_stops (all)
- exports/manifests views (admin only)

## Testing RLS (Hosted Dev)
Create two users (A and B).
- As user A:
  - Insert profile/address/appointment
  - Attempt to read user B rows -> must fail / return empty
- As admin:
  - Can view operational lists

## Performance Notes
- Add indexes on:
  - user_id columns
  - foreign keys used frequently
  - week_of, delivery_window_id
- Avoid policies that require expensive joins without indexes.

## Recommended “Admin” helper
Implement a stable SQL function `is_admin()` that checks profiles for auth.uid()
and use it in RLS policies.

## Checklist Per Table
For each table:
- [ ] RLS enabled
- [ ] SELECT policy correct
- [ ] INSERT policy correct
- [ ] UPDATE policy correct
- [ ] DELETE policy correct
- [ ] Indexes exist for policy predicates
