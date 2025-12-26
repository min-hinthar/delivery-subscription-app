create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  instructions text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_windows (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_of date not null,
  delivery_window_id uuid not null references public.delivery_windows(id),
  address_id uuid references public.addresses(id),
  notes text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_of)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_of date not null,
  appointment_id uuid references public.delivery_appointments(id),
  status text not null default 'pending',
  total_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_of)
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plan_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plan_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.meal_plan_templates(id) on delete cascade,
  meal_item_id uuid not null references public.meal_items(id),
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, meal_item_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  meal_item_id uuid references public.meal_items(id),
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_routes (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,
  name text,
  status text not null default 'draft',
  polyline text,
  distance_meters integer,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.delivery_routes(id) on delete cascade,
  appointment_id uuid not null references public.delivery_appointments(id),
  stop_order integer not null,
  status text not null default 'pending',
  eta timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_id, stop_order)
);

create index if not exists addresses_user_id_idx on public.addresses(user_id);
create index if not exists stripe_customers_user_id_idx on public.stripe_customers(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists delivery_appointments_user_id_idx on public.delivery_appointments(user_id);
create index if not exists delivery_appointments_week_of_idx on public.delivery_appointments(week_of);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_week_of_idx on public.orders(week_of);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists delivery_routes_week_of_idx on public.delivery_routes(week_of);
create index if not exists delivery_stops_route_id_idx on public.delivery_stops(route_id);
create index if not exists meal_plan_template_items_template_id_idx on public.meal_plan_template_items(template_id);
