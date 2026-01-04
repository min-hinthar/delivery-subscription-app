do $$
begin
  if not exists (select 1 from pg_type where typname = 'route_status') then
    create type route_status as enum ('pending', 'active', 'completed', 'cancelled');
  end if;
end $$;

update public.delivery_routes
set status = 'active'
where status in ('started', 'in_progress');

update public.delivery_routes
set status = 'pending'
where status is null
  or status not in ('pending', 'active', 'completed', 'cancelled');

alter table public.delivery_routes
  alter column status type route_status using status::route_status;

alter table public.delivery_routes
  alter column status set default 'pending';

alter table public.delivery_stops
  add column if not exists driver_notes text,
  add column if not exists photo_url text;

drop policy if exists "delivery_routes_driver_select" on public.delivery_routes;
create policy "delivery_routes_driver_select"
  on public.delivery_routes
  for select
  using (driver_id = auth.uid());

drop policy if exists "delivery_routes_driver_update" on public.delivery_routes;
create policy "delivery_routes_driver_update"
  on public.delivery_routes
  for update
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

drop policy if exists "delivery_stops_driver_select" on public.delivery_stops;
create policy "delivery_stops_driver_select"
  on public.delivery_stops
  for select
  using (
    exists (
      select 1
      from public.delivery_routes
      where delivery_routes.id = delivery_stops.route_id
        and delivery_routes.driver_id = auth.uid()
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
        and delivery_routes.driver_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.delivery_routes
      where delivery_routes.id = delivery_stops.route_id
        and delivery_routes.driver_id = auth.uid()
    )
  );

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
        and delivery_routes.driver_id = auth.uid()
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
        and delivery_routes.driver_id = auth.uid()
    )
  );

drop policy if exists "driver_locations_update_own" on public.driver_locations;
create policy "driver_locations_update_own"
  on public.driver_locations
  for update
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);
