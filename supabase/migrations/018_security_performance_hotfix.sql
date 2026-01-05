-- =====================================================
-- Migration: 018_security_performance_hotfix
-- Description: Security hardening for function search_path, RLS auth wrappers,
--              and performance indexes on FK columns.
-- Created: 2026-01-06
-- =====================================================

-- =====================================================
-- 1. Lock down function search_path
-- =====================================================

alter function public.set_updated_at() set search_path = public;
alter function public.ensure_single_primary_address() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.delivery_window_capacity_remaining(date, uuid) set search_path = public;
alter function public.update_driver_profile_updated_at() set search_path = public;

-- =====================================================
-- 2. Add indexes for foreign keys (performance advisor)
-- =====================================================

create index if not exists idx_delivery_appointments_delivery_window_id
  on public.delivery_appointments(delivery_window_id);

create index if not exists idx_delivery_routes_driver_id
  on public.delivery_routes(driver_id);

create index if not exists idx_meal_plan_template_items_meal_item_id
  on public.meal_plan_template_items(meal_item_id);

create index if not exists idx_order_items_meal_item_id
  on public.order_items(meal_item_id);

create index if not exists idx_orders_appointment_id
  on public.orders(appointment_id);

-- =====================================================
-- 3. RLS policy updates: wrap auth.* with SELECT for plan stability
-- =====================================================

-- Profiles

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using ((select auth.uid()) = id or public.is_admin())
  with check ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles
  for delete
  using ((select auth.uid()) = id or public.is_admin());

-- Addresses

drop policy if exists "addresses_owner_access" on public.addresses;
create policy "addresses_owner_access"
  on public.addresses
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "addresses_admin_access" on public.addresses;
create policy "addresses_admin_access"
  on public.addresses
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Stripe customers

drop policy if exists "stripe_customers_select_own" on public.stripe_customers;
create policy "stripe_customers_select_own"
  on public.stripe_customers
  for select
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "stripe_customers_admin_access" on public.stripe_customers;
create policy "stripe_customers_admin_access"
  on public.stripe_customers
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Subscriptions

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "subscriptions_admin_access" on public.subscriptions;
create policy "subscriptions_admin_access"
  on public.subscriptions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Delivery windows

drop policy if exists "delivery_windows_select_authenticated" on public.delivery_windows;
create policy "delivery_windows_select_authenticated"
  on public.delivery_windows
  for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "delivery_windows_admin_access" on public.delivery_windows;
create policy "delivery_windows_admin_access"
  on public.delivery_windows
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Delivery appointments

drop policy if exists "delivery_appointments_owner_access" on public.delivery_appointments;
create policy "delivery_appointments_owner_access"
  on public.delivery_appointments
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delivery_appointments_admin_access" on public.delivery_appointments;
create policy "delivery_appointments_admin_access"
  on public.delivery_appointments
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Orders

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders
  for select
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "orders_admin_access" on public.orders;
create policy "orders_admin_access"
  on public.orders
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Order items

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items
  for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "order_items_admin_access" on public.order_items;
create policy "order_items_admin_access"
  on public.order_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Payments

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments
  for select
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "payments_admin_access" on public.payments;
create policy "payments_admin_access"
  on public.payments
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Delivery routes

drop policy if exists "delivery_routes_admin_access" on public.delivery_routes;
create policy "delivery_routes_admin_access"
  on public.delivery_routes
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "delivery_routes_driver_select" on public.delivery_routes;
create policy "delivery_routes_driver_select"
  on public.delivery_routes
  for select
  using (driver_id = (select auth.uid()));

drop policy if exists "delivery_routes_driver_update" on public.delivery_routes;
create policy "delivery_routes_driver_update"
  on public.delivery_routes
  for update
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));

-- Delivery stops

drop policy if exists "delivery_stops_select_owner" on public.delivery_stops;
create policy "delivery_stops_select_owner"
  on public.delivery_stops
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.delivery_appointments
      where delivery_appointments.id = delivery_stops.appointment_id
        and delivery_appointments.user_id = (select auth.uid())
    )
  );

drop policy if exists "delivery_stops_admin_access" on public.delivery_stops;
create policy "delivery_stops_admin_access"
  on public.delivery_stops
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Driver-delivery stops policies

drop policy if exists "delivery_stops_driver_select" on public.delivery_stops;
create policy "delivery_stops_driver_select"
  on public.delivery_stops
  for select
  using (
    exists (
      select 1
      from public.delivery_routes
      where delivery_routes.id = delivery_stops.route_id
        and delivery_routes.driver_id = (select auth.uid())
    )
  );

drop policy if exists "delivery_stops_driver_update" on public.delivery_stops;
create policy "delivery_stops_driver_update"
  on public.delivery_stops
  for update
  using (
    exists (
      select 1
      from public.delivery_routes
      where delivery_routes.id = delivery_stops.route_id
        and delivery_routes.driver_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.delivery_routes
      where delivery_routes.id = delivery_stops.route_id
        and delivery_routes.driver_id = (select auth.uid())
    )
  );

-- Meal items

drop policy if exists "meal_items_select_authenticated" on public.meal_items;
create policy "meal_items_select_authenticated"
  on public.meal_items
  for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "meal_items_admin_access" on public.meal_items;
create policy "meal_items_admin_access"
  on public.meal_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Meal plan templates

drop policy if exists "meal_plan_templates_select_authenticated" on public.meal_plan_templates;
create policy "meal_plan_templates_select_authenticated"
  on public.meal_plan_templates
  for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "meal_plan_templates_admin_access" on public.meal_plan_templates;
create policy "meal_plan_templates_admin_access"
  on public.meal_plan_templates
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Meal plan template items

drop policy if exists "meal_plan_template_items_select_authenticated" on public.meal_plan_template_items;
create policy "meal_plan_template_items_select_authenticated"
  on public.meal_plan_template_items
  for select
  using ((select auth.role()) = 'authenticated');

drop policy if exists "meal_plan_template_items_admin_access" on public.meal_plan_template_items;
create policy "meal_plan_template_items_admin_access"
  on public.meal_plan_template_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Driver locations

drop policy if exists "Drivers can insert own location" on public.driver_locations;
create policy "Drivers can insert own location"
  on public.driver_locations
  for insert
  to authenticated
  with check ((select auth.uid()) = driver_id);

drop policy if exists "Drivers can update own location" on public.driver_locations;
create policy "Drivers can update own location"
  on public.driver_locations
  for update
  to authenticated
  using ((select auth.uid()) = driver_id)
  with check ((select auth.uid()) = driver_id);

drop policy if exists "Drivers can view own location" on public.driver_locations;
create policy "Drivers can view own location"
  on public.driver_locations
  for select
  to authenticated
  using ((select auth.uid()) = driver_id);

drop policy if exists "Customers can view driver on their route" on public.driver_locations;
create policy "Customers can view driver on their route"
  on public.driver_locations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.delivery_stops ds
      join public.delivery_appointments a on ds.appointment_id = a.id
      where ds.route_id = driver_locations.route_id
        and a.user_id = (select auth.uid())
        and a.status in ('confirmed', 'in_transit')
    )
  );

drop policy if exists "Admins can view all driver locations" on public.driver_locations;
create policy "Admins can view all driver locations"
  on public.driver_locations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update driver locations" on public.driver_locations;
create policy "Admins can update driver locations"
  on public.driver_locations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "No one can delete driver locations" on public.driver_locations;
create policy "No one can delete driver locations"
  on public.driver_locations
  for delete
  to authenticated
  using (false);

-- Driver profiles

drop policy if exists "driver_profiles_select_own" on public.driver_profiles;
create policy "driver_profiles_select_own"
  on public.driver_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "driver_profiles_update_own" on public.driver_profiles;
create policy "driver_profiles_update_own"
  on public.driver_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id and status <> 'suspended')
  with check ((select auth.uid()) = id and status <> 'suspended');

drop policy if exists "driver_profiles_admin_select" on public.driver_profiles;
create policy "driver_profiles_admin_select"
  on public.driver_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "driver_profiles_admin_insert" on public.driver_profiles;
create policy "driver_profiles_admin_insert"
  on public.driver_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "driver_profiles_admin_update" on public.driver_profiles;
create policy "driver_profiles_admin_update"
  on public.driver_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

-- Driver-access to addresses/profiles

drop policy if exists "addresses_driver_select" on public.addresses;
create policy "addresses_driver_select"
  on public.addresses
  for select
  using (
    exists (
      select 1
      from public.delivery_appointments
      join public.delivery_stops on delivery_stops.appointment_id = delivery_appointments.id
      join public.delivery_routes on delivery_routes.id = delivery_stops.route_id
      where delivery_appointments.address_id = addresses.id
        and delivery_routes.driver_id = (select auth.uid())
    )
  );

drop policy if exists "profiles_driver_select" on public.profiles;
create policy "profiles_driver_select"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.delivery_appointments
      join public.delivery_stops on delivery_stops.appointment_id = delivery_appointments.id
      join public.delivery_routes on delivery_routes.id = delivery_stops.route_id
      where delivery_appointments.user_id = profiles.id
        and delivery_routes.driver_id = (select auth.uid())
    )
  );

-- Driver locations helper policy

drop policy if exists "driver_locations_update_own" on public.driver_locations;
create policy "driver_locations_update_own"
  on public.driver_locations
  for update
  using ((select auth.uid()) = driver_id)
  with check ((select auth.uid()) = driver_id);
