do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'driver_profiles'
  ) then
    create table public.driver_profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text not null unique,
      full_name text,
      phone text,
      vehicle_make text,
      vehicle_model text,
      vehicle_color text,
      license_plate text,
      status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
      invited_by uuid references public.profiles(id),
      invited_at timestamptz not null default now(),
      confirmed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint driver_profiles_active_requires_contact
        check (status <> 'active' or (full_name is not null and phone is not null))
    );
  end if;
end $$;

create index if not exists idx_driver_profiles_email on public.driver_profiles(email);
create index if not exists idx_driver_profiles_status on public.driver_profiles(status);
create index if not exists idx_driver_profiles_invited_by on public.driver_profiles(invited_by);

alter table public.driver_profiles enable row level security;

alter table public.profiles
  add column if not exists is_driver boolean not null default false;

create index if not exists idx_profiles_is_driver on public.profiles(is_driver);

alter table public.delivery_routes
  add column if not exists driver_id uuid references public.driver_profiles(id);

drop policy if exists "driver_profiles_select_own" on public.driver_profiles;
create policy "driver_profiles_select_own"
  on public.driver_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "driver_profiles_update_own" on public.driver_profiles;
create policy "driver_profiles_update_own"
  on public.driver_profiles
  for update
  using (auth.uid() = id and status <> 'suspended')
  with check (auth.uid() = id and status <> 'suspended');

drop policy if exists "driver_profiles_admin_select" on public.driver_profiles;
create policy "driver_profiles_admin_select"
  on public.driver_profiles
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "driver_profiles_admin_insert" on public.driver_profiles;
create policy "driver_profiles_admin_insert"
  on public.driver_profiles
  for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "driver_profiles_admin_update" on public.driver_profiles;
create policy "driver_profiles_admin_update"
  on public.driver_profiles
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
