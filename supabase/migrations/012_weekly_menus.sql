create table if not exists public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,
  title text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_of)
);

create table if not exists public.weekly_menu_items (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references public.weekly_menus(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_menus enable row level security;
alter table public.weekly_menu_items enable row level security;

create policy "weekly_menus_public_select_published"
  on public.weekly_menus
  for select
  using (is_published = true);

create policy "weekly_menu_items_public_select_published"
  on public.weekly_menu_items
  for select
  using (
    exists (
      select 1
      from public.weekly_menus
      where weekly_menus.id = weekly_menu_items.weekly_menu_id
        and weekly_menus.is_published = true
    )
  );

create policy "weekly_menus_admin_access"
  on public.weekly_menus
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "weekly_menu_items_admin_access"
  on public.weekly_menu_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists weekly_menus_week_of_idx on public.weekly_menus(week_of);
create index if not exists weekly_menu_items_menu_id_idx on public.weekly_menu_items(weekly_menu_id);

create trigger weekly_menus_set_updated_at
before update on public.weekly_menus
for each row execute function public.set_updated_at();

create trigger weekly_menu_items_set_updated_at
before update on public.weekly_menu_items
for each row execute function public.set_updated_at();
