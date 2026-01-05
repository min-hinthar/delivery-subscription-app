-- ============================================
-- WEEKLY MENU SYSTEM (PR #25)
-- ============================================

-- ============================================
-- MENU TEMPLATES (Reusable weekly menus)
-- ============================================

create table if not exists public.menu_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_my text,
  description text,
  description_my text,
  theme text check (theme in ('traditional', 'street_food', 'regional', 'fusion', 'vegetarian')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_templates_active
  on public.menu_templates(is_active, created_at desc);

alter table public.menu_templates enable row level security;

drop policy if exists "menu_templates_public_select_active" on public.menu_templates;
drop policy if exists "menu_templates_admin_access" on public.menu_templates;

create policy "menu_templates_public_select_active"
  on public.menu_templates for select
  using (is_active = true);

create policy "menu_templates_admin_access"
  on public.menu_templates for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- TEMPLATE DISHES (21 dishes per template)
-- ============================================

create table if not exists public.template_dishes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.menu_templates(id) on delete cascade,
  dish_id uuid not null references public.meal_items(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_position int not null check (meal_position between 1 and 3),
  created_at timestamptz not null default now(),

  unique(template_id, day_of_week, meal_position)
);

create index if not exists idx_template_dishes_template
  on public.template_dishes(template_id);

create index if not exists idx_template_dishes_day
  on public.template_dishes(template_id, day_of_week);

alter table public.template_dishes enable row level security;

drop policy if exists "template_dishes_public_select_active" on public.template_dishes;
drop policy if exists "template_dishes_admin_access" on public.template_dishes;

create policy "template_dishes_public_select_active"
  on public.template_dishes for select
  using (
    exists (
      select 1 from public.menu_templates
      where menu_templates.id = template_dishes.template_id
        and menu_templates.is_active = true
    )
  );

create policy "template_dishes_admin_access"
  on public.template_dishes for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- WEEKLY MENUS (Generated from templates)
-- ============================================

alter table public.weekly_menus
  add column if not exists template_id uuid references public.menu_templates(id) on delete set null,
  add column if not exists week_start_date date,
  add column if not exists week_number int,
  add column if not exists order_deadline timestamptz,
  add column if not exists delivery_date date,
  add column if not exists status text,
  add column if not exists published_at timestamptz;

alter table public.weekly_menus
  alter column week_of drop not null;

alter table public.weekly_menus
  alter column status set default 'draft';

create unique index if not exists idx_weekly_menus_week_start
  on public.weekly_menus(week_start_date);

create index if not exists idx_weekly_menus_status
  on public.weekly_menus(status, week_start_date desc);

create index if not exists idx_weekly_menus_delivery
  on public.weekly_menus(delivery_date);

alter table public.weekly_menus enable row level security;

drop policy if exists "weekly_menus_public_select_published" on public.weekly_menus;
drop policy if exists "weekly_menus_admin_access" on public.weekly_menus;

create policy "weekly_menus_public_select_published"
  on public.weekly_menus for select
  using (status in ('published', 'closed', 'completed'));

create policy "weekly_menus_admin_access"
  on public.weekly_menus for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- WEEKLY MENU ITEMS (7 days × 3 dishes = 21)
-- ============================================

alter table public.weekly_menu_items
  add column if not exists dish_id uuid references public.meal_items(id) on delete cascade,
  add column if not exists day_of_week int,
  add column if not exists meal_position int,
  add column if not exists is_available boolean not null default true,
  add column if not exists max_portions int,
  add column if not exists current_orders int not null default 0;

alter table public.weekly_menu_items
  alter column name drop not null;

alter table public.weekly_menu_items
  alter column price_cents drop not null;

alter table public.weekly_menu_items
  alter column sort_order drop not null;

create unique index if not exists idx_weekly_menu_items_unique_slot
  on public.weekly_menu_items(weekly_menu_id, day_of_week, meal_position);

create index if not exists idx_weekly_menu_items_menu
  on public.weekly_menu_items(weekly_menu_id);

create index if not exists idx_weekly_menu_items_dish
  on public.weekly_menu_items(dish_id);

alter table public.weekly_menu_items enable row level security;

drop policy if exists "weekly_menu_items_public_select_published" on public.weekly_menu_items;
drop policy if exists "weekly_menu_items_admin_access" on public.weekly_menu_items;

create policy "weekly_menu_items_public_select_published"
  on public.weekly_menu_items for select
  using (
    exists (
      select 1
      from public.weekly_menus
      where weekly_menus.id = weekly_menu_items.weekly_menu_id
        and weekly_menus.status in ('published', 'closed', 'completed')
    )
  );

create policy "weekly_menu_items_admin_access"
  on public.weekly_menu_items for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- MEAL PACKAGES (A, B, C)
-- ============================================

create table if not exists public.meal_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_my text,
  description text not null,
  description_my text,
  dishes_per_day int not null check (dishes_per_day between 1 and 3),
  total_dishes int not null,
  price_cents int not null,
  is_active boolean not null default true,
  display_order int not null default 0,
  badge_text text,
  badge_text_my text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.meal_packages (name, name_my, description, description_my, dishes_per_day, total_dishes, price_cents, display_order, badge_text)
values
  ('Package A', 'အစီအစဉ် A', '1 delicious Burmese dish per day for a week', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၁ မျိုး', 1, 7, 8500, 1, null),
  ('Package B', 'အစီအစဉ် B', '2 authentic dishes per day - perfect variety!', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၂ မျိုး', 2, 14, 15500, 2, 'Most Popular'),
  ('Package C', 'အစီအစဉ် C', '3 amazing dishes daily - the ultimate feast', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၃ မျိုး', 3, 21, 22000, 3, 'Best Value')
on conflict do nothing;

alter table public.meal_packages enable row level security;

drop policy if exists "meal_packages_public_select_active" on public.meal_packages;
drop policy if exists "meal_packages_admin_access" on public.meal_packages;

create policy "meal_packages_public_select_active"
  on public.meal_packages for select
  using (is_active = true);

create policy "meal_packages_admin_access"
  on public.meal_packages for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- WEEKLY ORDERS (Customer package orders)
-- ============================================

create table if not exists public.weekly_orders (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references public.weekly_menus(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  package_id uuid not null references public.meal_packages(id) on delete restrict,
  total_amount_cents int not null,
  status text not null check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')) default 'pending',
  delivery_address_id uuid references public.addresses(id) on delete set null,
  delivery_instructions text,
  delivery_window text,
  driver_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  delivered_at timestamptz,
  unique(weekly_menu_id, customer_id)
);

create index if not exists idx_weekly_orders_menu
  on public.weekly_orders(weekly_menu_id, status);

create index if not exists idx_weekly_orders_customer
  on public.weekly_orders(customer_id, created_at desc);

create index if not exists idx_weekly_orders_driver
  on public.weekly_orders(driver_id, status);

create index if not exists idx_weekly_orders_delivery
  on public.weekly_orders(weekly_menu_id, delivery_window);

alter table public.weekly_orders enable row level security;

drop policy if exists "weekly_orders_customer_select" on public.weekly_orders;
drop policy if exists "weekly_orders_customer_insert" on public.weekly_orders;
drop policy if exists "weekly_orders_customer_update_pending" on public.weekly_orders;
drop policy if exists "weekly_orders_driver_select" on public.weekly_orders;
drop policy if exists "weekly_orders_driver_update" on public.weekly_orders;
drop policy if exists "weekly_orders_admin_access" on public.weekly_orders;

create policy "weekly_orders_customer_select"
  on public.weekly_orders for select
  using (customer_id = auth.uid());

create policy "weekly_orders_customer_insert"
  on public.weekly_orders for insert
  with check (customer_id = auth.uid());

create policy "weekly_orders_customer_update_pending"
  on public.weekly_orders for update
  using (customer_id = auth.uid() and status = 'pending');

create policy "weekly_orders_driver_select"
  on public.weekly_orders for select
  using (driver_id = auth.uid());

create policy "weekly_orders_driver_update"
  on public.weekly_orders for update
  using (driver_id = auth.uid() and driver_id is not null);

create policy "weekly_orders_admin_access"
  on public.weekly_orders for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

create or replace function public.auto_close_weekly_menu()
returns trigger as $$
begin
  if NEW.status = 'published' and NEW.order_deadline < now() then
    NEW.status := 'closed';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trigger_auto_close_menu on public.weekly_menus;

create trigger trigger_auto_close_menu
  before update on public.weekly_menus
  for each row
  execute function public.auto_close_weekly_menu();

create or replace function public.increment_menu_item_orders()
returns trigger as $$
declare
  dishes_per_day_count int;
begin
  if NEW.status = 'confirmed' and (OLD.status is null or OLD.status != 'confirmed') then
    select dishes_per_day into dishes_per_day_count
    from public.meal_packages
    where id = NEW.package_id;

    update public.weekly_menu_items
    set current_orders = current_orders + 1
    where weekly_menu_id = NEW.weekly_menu_id
      and meal_position <= dishes_per_day_count;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trigger_increment_orders on public.weekly_orders;
drop trigger if exists menu_templates_set_updated_at on public.menu_templates;
drop trigger if exists meal_packages_set_updated_at on public.meal_packages;
drop trigger if exists weekly_orders_set_updated_at on public.weekly_orders;

create trigger trigger_increment_orders
  after insert or update on public.weekly_orders
  for each row
  execute function public.increment_menu_item_orders();

create trigger menu_templates_set_updated_at
  before update on public.menu_templates
  for each row execute function public.set_updated_at();

create trigger meal_packages_set_updated_at
  before update on public.meal_packages
  for each row execute function public.set_updated_at();

create trigger weekly_orders_set_updated_at
  before update on public.weekly_orders
  for each row execute function public.set_updated_at();

