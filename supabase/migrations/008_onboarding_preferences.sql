alter table public.profiles
  add column if not exists household_size integer,
  add column if not exists preferred_delivery_day text,
  add column if not exists preferred_time_window text,
  add column if not exists dietary_restrictions text[];
