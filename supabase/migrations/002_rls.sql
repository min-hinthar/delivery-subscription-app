create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.delivery_windows enable row level security;
alter table public.delivery_appointments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_routes enable row level security;
alter table public.delivery_stops enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_plan_templates enable row level security;
alter table public.meal_plan_template_items enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id or public.is_admin());

create policy "addresses_owner_access"
on public.addresses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "addresses_admin_access"
on public.addresses
for all
using (public.is_admin())
with check (public.is_admin());

create policy "stripe_customers_select_own"
on public.stripe_customers
for select
using (auth.uid() = user_id or public.is_admin());

create policy "stripe_customers_admin_access"
on public.stripe_customers
for all
using (public.is_admin())
with check (public.is_admin());

create policy "subscriptions_select_own"
on public.subscriptions
for select
using (auth.uid() = user_id or public.is_admin());

create policy "subscriptions_admin_access"
on public.subscriptions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "delivery_windows_select_authenticated"
on public.delivery_windows
for select
using (auth.role() = 'authenticated');

create policy "delivery_windows_admin_access"
on public.delivery_windows
for all
using (public.is_admin())
with check (public.is_admin());

create policy "delivery_appointments_owner_access"
on public.delivery_appointments
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delivery_appointments_admin_access"
on public.delivery_appointments
for all
using (public.is_admin())
with check (public.is_admin());

create policy "orders_select_own"
on public.orders
for select
using (auth.uid() = user_id or public.is_admin());

create policy "orders_admin_access"
on public.orders
for all
using (public.is_admin())
with check (public.is_admin());

create policy "order_items_select_own"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "order_items_admin_access"
on public.order_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy "payments_select_own"
on public.payments
for select
using (auth.uid() = user_id or public.is_admin());

create policy "payments_admin_access"
on public.payments
for all
using (public.is_admin())
with check (public.is_admin());

create policy "delivery_routes_admin_access"
on public.delivery_routes
for all
using (public.is_admin())
with check (public.is_admin());

create policy "delivery_stops_select_owner"
on public.delivery_stops
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.delivery_appointments
    where delivery_appointments.id = delivery_stops.appointment_id
      and delivery_appointments.user_id = auth.uid()
  )
);

create policy "delivery_stops_admin_access"
on public.delivery_stops
for all
using (public.is_admin())
with check (public.is_admin());

create policy "meal_items_select_authenticated"
on public.meal_items
for select
using (auth.role() = 'authenticated');

create policy "meal_items_admin_access"
on public.meal_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy "meal_plan_templates_select_authenticated"
on public.meal_plan_templates
for select
using (auth.role() = 'authenticated');

create policy "meal_plan_templates_admin_access"
on public.meal_plan_templates
for all
using (public.is_admin())
with check (public.is_admin());

create policy "meal_plan_template_items_select_authenticated"
on public.meal_plan_template_items
for select
using (auth.role() = 'authenticated');

create policy "meal_plan_template_items_admin_access"
on public.meal_plan_template_items
for all
using (public.is_admin())
with check (public.is_admin());
