-- =====================================================
-- Migration: 017_driver_authentication
-- Description: Driver authentication, profiles, and management system
-- PR: #17 - Driver Authentication & Management
-- Created: 2026-01-04
-- =====================================================

-- =====================================================
-- 1. Create driver_profiles table
-- =====================================================

create table if not exists public.driver_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text not null,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  license_plate text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  invited_by uuid references public.profiles(id),
  invited_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- 2. Create indexes for driver_profiles
-- =====================================================
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

-- =====================================================
-- 3. Enable RLS on driver_profiles
-- =====================================================

alter table public.driver_profiles enable row level security;

-- =====================================================
-- 4. RLS Policies for driver_profiles
-- =====================================================

-- Drivers can view their own profile
drop policy if exists "Drivers can view own profile" on public.driver_profiles;
create policy "Drivers can view own profile"
  on public.driver_profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Drivers can update their own profile
drop policy if exists "Drivers can update own profile" on public.driver_profiles;
create policy "Drivers can update own profile"
  on public.driver_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all driver profiles
drop policy if exists "Admins can view all driver profiles" on public.driver_profiles;
create policy "Admins can view all driver profiles"
  on public.driver_profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
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

-- Admins can invite drivers (insert)
drop policy if exists "Admins can invite drivers" on public.driver_profiles;
create policy "Admins can invite drivers"
  on public.driver_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
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

-- Admins can update driver profiles
drop policy if exists "Admins can update driver profiles" on public.driver_profiles;
create policy "Admins can update driver profiles"
  on public.driver_profiles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
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

-- =====================================================
-- 5. Update profiles table to add is_driver column
-- =====================================================

alter table public.profiles add column if not exists is_driver boolean not null default false;

-- Create index for is_driver lookups
create index if not exists idx_profiles_is_driver on public.profiles(is_driver);

-- =====================================================
-- 6. Update delivery_routes table to ensure driver_id exists
-- =====================================================

-- This should already exist from PR #16, but ensure it's there
alter table public.delivery_routes add column if not exists driver_id uuid references public.driver_profiles(id);

-- Create index for driver route lookups
create index if not exists idx_delivery_routes_driver_id on public.delivery_routes(driver_id);

-- =====================================================
-- 7. Create trigger to automatically update updated_at
-- =====================================================

create or replace function public.update_driver_profile_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists driver_profiles_updated_at on public.driver_profiles;
create trigger driver_profiles_updated_at
  before update on public.driver_profiles
  for each row
  execute function public.update_driver_profile_updated_at();

-- =====================================================
-- 8. Comments for documentation
-- =====================================================

comment on table public.driver_profiles is 'Driver profiles for delivery personnel - includes authentication and vehicle information';
comment on column public.driver_profiles.status is 'Driver status: pending (invited, not confirmed), active (can be assigned routes), suspended (access revoked)';
comment on column public.driver_profiles.invited_by is 'Admin user who invited this driver';
comment on column public.driver_profiles.confirmed_at is 'Timestamp when driver confirmed email and completed onboarding';
