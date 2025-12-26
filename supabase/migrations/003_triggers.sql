create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ensure_single_primary_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary then
    update public.addresses
      set is_primary = false,
          updated_at = now()
    where user_id = new.user_id
      and id <> new.id;
  end if;
  return new;
end;
$$;

create or replace function public.delivery_window_capacity_remaining(
  p_week_of date,
  p_delivery_window_id uuid
)
returns integer
language sql
stable
as $$
  select greatest(
    (select capacity from public.delivery_windows where id = p_delivery_window_id)
    - (
      select count(*)
      from public.delivery_appointments
      where week_of = p_week_of
        and delivery_window_id = p_delivery_window_id
    ),
    0
  );
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create trigger addresses_single_primary
before insert or update on public.addresses
for each row execute function public.ensure_single_primary_address();

create trigger stripe_customers_set_updated_at
before update on public.stripe_customers
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger delivery_windows_set_updated_at
before update on public.delivery_windows
for each row execute function public.set_updated_at();

create trigger delivery_appointments_set_updated_at
before update on public.delivery_appointments
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger delivery_routes_set_updated_at
before update on public.delivery_routes
for each row execute function public.set_updated_at();

create trigger delivery_stops_set_updated_at
before update on public.delivery_stops
for each row execute function public.set_updated_at();

create trigger meal_items_set_updated_at
before update on public.meal_items
for each row execute function public.set_updated_at();

create trigger meal_plan_templates_set_updated_at
before update on public.meal_plan_templates
for each row execute function public.set_updated_at();

create trigger meal_plan_template_items_set_updated_at
before update on public.meal_plan_template_items
for each row execute function public.set_updated_at();
