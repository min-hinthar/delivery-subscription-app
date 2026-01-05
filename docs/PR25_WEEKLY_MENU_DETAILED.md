# 🍜 PR #25: Weekly Menu System - Step-by-Step Implementation

**For:** Codex
**Priority:** P0 (CRITICAL - Core Business Feature)
**Estimated Time:** 10-12 hours
**Business Model:** Weekly meal packages (A/B/C) with Saturday delivery
**Branch:** `codex/weekly-menu-system`

---

## 🎯 What We're Building

The **heart of Mandalay Morning Star's business model**:

- **Admin** creates menu templates once (e.g., "Traditional Mandalay Week", "Street Food Week")
- **System** generates weekly menus from templates every week
- **Customers** choose Package A ($85), B ($155), or C ($220) for the week
- **Orders** close Wednesday 11:59 PM, delivery Saturday
- **Tracking** shows order counts, revenue projections, delivery prep

**Without this feature, the business cannot operate.**

---

## 📋 Business Requirements

### Package Structure:
- **Package A:** 7 dishes (1 per day) - $85/week
- **Package B:** 14 dishes (2 per day) - $155/week ⭐ Most Popular
- **Package C:** 21 dishes (3 per day) - $220/week

### Weekly Cycle:
- **Monday-Tuesday:** Next week's menu published
- **Wednesday 11:59 PM:** Order deadline (STRICT)
- **Thursday-Friday:** Kitchen prep, driver scheduling
- **Saturday:** All deliveries (8 AM - 8 PM)
- **Sunday:** Customer feedback, next week planning

### Menu Template System:
- Admins create reusable templates (e.g., "Week 1", "Week 2", "Week 3", "Week 4")
- Each template has 7 days × 3 dishes = 21 dishes
- Templates rotate (Week 1 → Week 2 → Week 3 → Week 4 → Week 1...)
- Easy to swap dishes for seasonal ingredients

---

## 🗄️ Database Schema (6 New Tables)

### Step 1: Database Migration (2 hours)

#### 1.1 Create Migration File

**Create:** `supabase/migrations/20260104000001_weekly_menu_system.sql`

```sql
-- ============================================
-- MENU TEMPLATES (Reusable weekly menus)
-- ============================================

create table menu_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- "Traditional Mandalay Week", "Street Food Week"
  name_my text, -- Burmese name
  description text,
  description_my text,
  theme text check (theme in ('traditional', 'street_food', 'regional', 'fusion', 'vegetarian')),
  is_active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for admin queries
create index idx_menu_templates_active on menu_templates(is_active, created_at desc);

-- RLS policies
alter table menu_templates enable row level security;

create policy "Anyone can view active templates"
  on menu_templates for select
  using (is_active = true);

create policy "Admins can manage templates"
  on menu_templates for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- TEMPLATE DISHES (21 dishes per template)
-- ============================================

create table template_dishes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references menu_templates(id) on delete cascade,
  dish_id uuid not null references dishes(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  meal_position int not null check (meal_position between 1 and 3), -- 1=first dish, 2=second, 3=third
  created_at timestamptz default now(),

  -- Ensure no duplicate dish positions
  unique(template_id, day_of_week, meal_position)
);

-- Indexes for efficient queries
create index idx_template_dishes_template on template_dishes(template_id);
create index idx_template_dishes_day on template_dishes(template_id, day_of_week);

-- RLS policies
alter table template_dishes enable row level security;

create policy "Anyone can view template dishes"
  on template_dishes for select
  using (
    exists (
      select 1 from menu_templates
      where menu_templates.id = template_dishes.template_id
      and menu_templates.is_active = true
    )
  );

create policy "Admins can manage template dishes"
  on template_dishes for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- WEEKLY MENUS (Generated from templates)
-- ============================================

create table weekly_menus (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references menu_templates(id) on delete set null,
  week_start_date date not null, -- The Sunday that starts this week
  week_number int not null, -- Week 1, 2, 3, 4 (for rotating templates)
  order_deadline timestamptz not null, -- Wednesday 11:59 PM
  delivery_date date not null, -- Saturday
  status text not null check (status in ('draft', 'published', 'closed', 'completed', 'archived')) default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Only one menu per week
  unique(week_start_date)
);

-- Indexes
create index idx_weekly_menus_status on weekly_menus(status, week_start_date desc);
create index idx_weekly_menus_delivery on weekly_menus(delivery_date);

-- RLS policies
alter table weekly_menus enable row level security;

create policy "Anyone can view published menus"
  on weekly_menus for select
  using (status in ('published', 'closed', 'completed'));

create policy "Admins can manage all menus"
  on weekly_menus for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- WEEKLY MENU ITEMS (7 days × 3 dishes = 21)
-- ============================================

create table weekly_menu_items (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references weekly_menus(id) on delete cascade,
  dish_id uuid not null references dishes(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_position int not null check (meal_position between 1 and 3),
  is_available boolean default true, -- Can be toggled if ingredient shortage
  max_portions int, -- Optional: limit portions for this dish
  current_orders int default 0, -- Track how many ordered
  created_at timestamptz default now(),

  unique(weekly_menu_id, day_of_week, meal_position)
);

-- Indexes
create index idx_weekly_menu_items_menu on weekly_menu_items(weekly_menu_id);
create index idx_weekly_menu_items_dish on weekly_menu_items(dish_id);

-- RLS policies
alter table weekly_menu_items enable row level security;

create policy "Anyone can view available menu items"
  on weekly_menu_items for select
  using (
    exists (
      select 1 from weekly_menus
      where weekly_menus.id = weekly_menu_items.weekly_menu_id
      and weekly_menus.status in ('published', 'closed', 'completed')
    )
  );

create policy "Admins can manage menu items"
  on weekly_menu_items for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- MEAL PACKAGES (A, B, C)
-- ============================================

create table meal_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- "Package A", "Package B", "Package C"
  name_my text, -- Burmese name
  description text not null,
  description_my text,
  dishes_per_day int not null check (dishes_per_day between 1 and 3),
  total_dishes int not null, -- 7, 14, or 21
  price_cents int not null,
  is_active boolean default true,
  display_order int default 0, -- For ordering in UI
  badge_text text, -- e.g., "Most Popular", "Best Value"
  badge_text_my text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default packages
insert into meal_packages (name, name_my, description, description_my, dishes_per_day, total_dishes, price_cents, display_order, badge_text) values
  ('Package A', 'အစီအစဉ် A', '1 delicious Burmese dish per day for a week', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၁ မျိုး', 1, 7, 8500, 1, null),
  ('Package B', 'အစီအစဉ် B', '2 authentic dishes per day - perfect variety!', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၂ မျိုး', 2, 14, 15500, 2, 'Most Popular'),
  ('Package C', 'အစီအစဉ် C', '3 amazing dishes daily - the ultimate feast', 'တစ်ရက်လျှင် မြန်မာ့အစားအစာ ၃ မျိုး', 3, 21, 22000, 3, 'Best Value');

-- RLS policies
alter table meal_packages enable row level security;

create policy "Anyone can view active packages"
  on meal_packages for select
  using (is_active = true);

create policy "Admins can manage packages"
  on meal_packages for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- WEEKLY ORDERS (Customer package orders)
-- ============================================

create table weekly_orders (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references weekly_menus(id) on delete restrict,
  customer_id uuid not null references profiles(id) on delete restrict,
  package_id uuid not null references meal_packages(id) on delete restrict,

  -- Order details
  total_amount_cents int not null,
  status text not null check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')) default 'pending',

  -- Delivery details
  delivery_address_id uuid references customer_addresses(id) on delete set null,
  delivery_instructions text,
  delivery_window text, -- e.g., "8 AM - 12 PM", "12 PM - 4 PM", "4 PM - 8 PM"

  -- Driver assignment
  driver_id uuid references profiles(id) on delete set null,
  assigned_at timestamptz,

  -- Payment
  stripe_payment_intent_id text,
  paid_at timestamptz,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  cancelled_at timestamptz,
  delivered_at timestamptz,

  -- One order per customer per week
  unique(weekly_menu_id, customer_id)
);

-- Indexes
create index idx_weekly_orders_menu on weekly_orders(weekly_menu_id, status);
create index idx_weekly_orders_customer on weekly_orders(customer_id, created_at desc);
create index idx_weekly_orders_driver on weekly_orders(driver_id, status);
create index idx_weekly_orders_delivery on weekly_orders(weekly_menu_id, delivery_window);

-- RLS policies
alter table weekly_orders enable row level security;

create policy "Customers can view their own orders"
  on weekly_orders for select
  using (customer_id = auth.uid());

create policy "Customers can create their own orders"
  on weekly_orders for insert
  with check (customer_id = auth.uid());

create policy "Customers can update their pending orders"
  on weekly_orders for update
  using (customer_id = auth.uid() and status = 'pending');

create policy "Drivers can view their assigned orders"
  on weekly_orders for select
  using (driver_id = auth.uid());

create policy "Drivers can update their assigned orders"
  on weekly_orders for update
  using (driver_id = auth.uid() and driver_id is not null);

create policy "Admins can manage all orders"
  on weekly_orders for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-close menu when deadline passes
create or replace function auto_close_weekly_menu()
returns trigger as $$
begin
  if NEW.status = 'published' and NEW.order_deadline < now() then
    NEW.status := 'closed';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_auto_close_menu
  before update on weekly_menus
  for each row
  execute function auto_close_weekly_menu();


-- Function to increment order count on menu items
create or replace function increment_menu_item_orders()
returns trigger as $$
begin
  if NEW.status = 'confirmed' and (OLD.status is null or OLD.status != 'confirmed') then
    -- Get the package to know how many dishes per day
    declare
      dishes_per_day_count int;
    begin
      select dishes_per_day into dishes_per_day_count
      from meal_packages
      where id = NEW.package_id;

      -- Increment current_orders for each dish in the package
      update weekly_menu_items
      set current_orders = current_orders + 1
      where weekly_menu_id = NEW.weekly_menu_id
        and meal_position <= dishes_per_day_count;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_increment_orders
  after insert or update on weekly_orders
  for each row
  execute function increment_menu_item_orders();


-- Function to update weekly_menus.updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger update_weekly_menus_updated_at
  before update on weekly_menus
  for each row
  execute function update_updated_at_column();

create trigger update_menu_templates_updated_at
  before update on menu_templates
  for each row
  execute function update_updated_at_column();

create trigger update_meal_packages_updated_at
  before update on meal_packages
  for each row
  execute function update_updated_at_column();

create trigger update_weekly_orders_updated_at
  before update on weekly_orders
  for each row
  execute function update_updated_at_column();


-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- This will be inserted via admin UI in production,
-- but here's an example for development:

-- Sample menu template
insert into menu_templates (name, name_my, description, theme)
values (
  'Traditional Mandalay Week',
  'ရိုးရာ မန္တလေး အပတ်',
  'Classic dishes from Mandalay, the cultural heart of Myanmar',
  'traditional'
);

-- Sample dishes would be linked via template_dishes table
-- (This requires dishes to exist first - will be done in admin UI)
```

#### 1.2 Run Migration

```bash
# Apply migration
supabase db push

# Verify tables created
supabase db diff
```

#### 1.3 Test Checklist

- [ ] All 6 tables created successfully
- [ ] RLS policies applied
- [ ] Triggers created (auto-close, order count)
- [ ] Default packages inserted (A, B, C)
- [ ] No migration errors

---

## 🎨 Frontend Implementation

### Step 2: Type Definitions (30 minutes)

#### 2.1 Create Types File

**Create:** `src/types/weekly-menu.ts`

```typescript
export type MenuTheme = 'traditional' | 'street_food' | 'regional' | 'fusion' | 'vegetarian';

export type WeeklyMenuStatus = 'draft' | 'published' | 'closed' | 'completed' | 'archived';

export type WeeklyOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type DeliveryWindow = '8 AM - 12 PM' | '12 PM - 4 PM' | '4 PM - 8 PM';

export interface MenuTemplate {
  id: string;
  name: string;
  name_my?: string;
  description?: string;
  description_my?: string;
  theme?: MenuTheme;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateDish {
  id: string;
  template_id: string;
  dish_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  meal_position: number; // 1-3
  created_at: string;
  dish?: Dish; // Joined data
}

export interface WeeklyMenu {
  id: string;
  template_id?: string;
  week_start_date: string; // ISO date
  week_number: number;
  order_deadline: string; // ISO timestamp
  delivery_date: string; // ISO date
  status: WeeklyMenuStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  template?: MenuTemplate; // Joined data
  items?: WeeklyMenuItem[]; // Joined data
}

export interface WeeklyMenuItem {
  id: string;
  weekly_menu_id: string;
  dish_id: string;
  day_of_week: number;
  meal_position: number;
  is_available: boolean;
  max_portions?: number;
  current_orders: number;
  created_at: string;
  dish?: Dish; // Joined data
}

export interface MealPackage {
  id: string;
  name: string;
  name_my?: string;
  description: string;
  description_my?: string;
  dishes_per_day: number;
  total_dishes: number;
  price_cents: number;
  is_active: boolean;
  display_order: number;
  badge_text?: string;
  badge_text_my?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyOrder {
  id: string;
  weekly_menu_id: string;
  customer_id: string;
  package_id: string;
  total_amount_cents: number;
  status: WeeklyOrderStatus;
  delivery_address_id?: string;
  delivery_instructions?: string;
  delivery_window?: DeliveryWindow;
  driver_id?: string;
  assigned_at?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  delivered_at?: string;
  // Joined data
  weekly_menu?: WeeklyMenu;
  package?: MealPackage;
  customer?: Profile;
  driver?: Profile;
  delivery_address?: CustomerAddress;
}

// Helper type for grouping dishes by day
export interface DayMenu {
  dayOfWeek: number;
  dayName: string;
  date: string; // Actual date for this day
  dishes: (WeeklyMenuItem & { dish: Dish })[];
}

// Helper type for order summary
export interface WeeklyOrderSummary {
  week_start_date: string;
  delivery_date: string;
  total_orders: number;
  total_revenue_cents: number;
  orders_by_package: {
    package_name: string;
    count: number;
    revenue_cents: number;
  }[];
  orders_by_window: {
    window: DeliveryWindow;
    count: number;
  }[];
}
```

#### 2.2 Update Main Types File

**Edit:** `src/types/index.ts`

```typescript
export * from './weekly-menu';
```

---

### Step 3: API Routes (3 hours)

#### 3.1 Get Current Week's Menu

**Create:** `src/app/api/menu/weekly/current/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current week's published menu
    const { data: menu, error } = await supabase
      .from("weekly_menus")
      .select(`
        *,
        template:menu_templates(*),
        items:weekly_menu_items(
          *,
          dish:dishes(*)
        )
      `)
      .eq("status", "published")
      .gte("order_deadline", new Date().toISOString())
      .order("week_start_date", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No menu found
        return NextResponse.json(
          { error: "No menu available for this week" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Group items by day
    const dayMenus = groupMenuItemsByDay(menu.items, menu.week_start_date);

    return NextResponse.json({
      menu: {
        ...menu,
        day_menus: dayMenus,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly menu" },
      { status: 500 }
    );
  }
}

// Helper function to group menu items by day
function groupMenuItemsByDay(items: any[], weekStartDate: string) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const startDate = new Date(weekStartDate);

  const grouped: Record<number, any> = {};

  items.forEach((item) => {
    if (!grouped[item.day_of_week]) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + item.day_of_week);

      grouped[item.day_of_week] = {
        dayOfWeek: item.day_of_week,
        dayName: days[item.day_of_week],
        date: date.toISOString().split("T")[0],
        dishes: [],
      };
    }

    grouped[item.day_of_week].dishes.push(item);
  });

  // Sort dishes within each day by meal_position
  Object.values(grouped).forEach((day: any) => {
    day.dishes.sort((a: any, b: any) => a.meal_position - b.meal_position);
  });

  return Object.values(grouped).sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);
}
```

#### 3.2 Get Meal Packages

**Create:** `src/app/api/menu/packages/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: packages, error } = await supabase
      .from("meal_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}
```

#### 3.3 Create Weekly Order

**Create:** `src/app/api/orders/weekly/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const createOrderSchema = z.object({
  weekly_menu_id: z.string().uuid(),
  package_id: z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  delivery_instructions: z.string().optional(),
  delivery_window: z.enum(["8 AM - 12 PM", "12 PM - 4 PM", "4 PM - 8 PM"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Check if menu is still accepting orders
    const { data: menu, error: menuError } = await supabase
      .from("weekly_menus")
      .select("*, items:weekly_menu_items(*)")
      .eq("id", validatedData.weekly_menu_id)
      .single();

    if (menuError) throw menuError;

    if (menu.status !== "published") {
      return NextResponse.json(
        { error: "This menu is no longer accepting orders" },
        { status: 400 }
      );
    }

    if (new Date(menu.order_deadline) < new Date()) {
      return NextResponse.json(
        { error: "Order deadline has passed" },
        { status: 400 }
      );
    }

    // Check if customer already ordered for this week
    const { data: existingOrder } = await supabase
      .from("weekly_orders")
      .select("id")
      .eq("weekly_menu_id", validatedData.weekly_menu_id)
      .eq("customer_id", user.id)
      .single();

    if (existingOrder) {
      return NextResponse.json(
        { error: "You already have an order for this week" },
        { status: 400 }
      );
    }

    // Get package details
    const { data: mealPackage, error: packageError } = await supabase
      .from("meal_packages")
      .select("*")
      .eq("id", validatedData.package_id)
      .single();

    if (packageError) throw packageError;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: mealPackage.price_cents,
      currency: "usd",
      metadata: {
        customer_id: user.id,
        weekly_menu_id: validatedData.weekly_menu_id,
        package_id: validatedData.package_id,
      },
    });

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("weekly_orders")
      .insert({
        weekly_menu_id: validatedData.weekly_menu_id,
        customer_id: user.id,
        package_id: validatedData.package_id,
        total_amount_cents: mealPackage.price_cents,
        delivery_address_id: validatedData.delivery_address_id,
        delivery_instructions: validatedData.delivery_instructions,
        delivery_window: validatedData.delivery_window,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    return NextResponse.json({
      order,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating weekly order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer's weekly orders
    const { data: orders, error } = await supabase
      .from("weekly_orders")
      .select(`
        *,
        weekly_menu:weekly_menus(*),
        package:meal_packages(*),
        delivery_address:customer_addresses(*)
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
```

#### 3.4 Confirm Payment Webhook

**Create:** `src/app/api/webhooks/stripe/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const supabase = await createClient();

      // Update order status to confirmed
      const { error } = await supabase
        .from("weekly_orders")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }

      // TODO: Send confirmation email
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
```

---

### Step 4: Customer-Facing UI (4 hours)

#### 4.1 Weekly Menu Page

**Create:** `src/app/(app)/menu/weekly/page.tsx`

```typescript
import { Suspense } from "react";
import { WeeklyMenuView } from "@/components/menu/weekly-menu-view";
import { WeeklyMenuSkeleton } from "@/components/menu/weekly-menu-skeleton";

export const metadata = {
  title: "This Week's Menu | Mandalay Morning Star",
  description: "View this week's authentic Burmese dishes and order your package",
};

export default function WeeklyMenuPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<WeeklyMenuSkeleton />}>
        <WeeklyMenuView />
      </Suspense>
    </div>
  );
}
```

#### 4.2 Weekly Menu Component

**Create:** `src/components/menu/weekly-menu-view.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Clock, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklyMenu, DayMenu } from "@/types";
import { PackageSelector } from "./package-selector";

export function WeeklyMenuView() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [dayMenus, setDayMenus] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    fetchWeeklyMenu();
  }, []);

  const fetchWeeklyMenu = async () => {
    try {
      const response = await fetch("/api/menu/weekly/current");
      const data = await response.json();

      if (response.ok) {
        setMenu(data.menu);
        setDayMenus(data.menu.day_menus);
        // Auto-select today or first day
        const today = new Date().getDay();
        setSelectedDay(today);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!menu) {
    return (
      <div className="text-center py-12">
        <ChefHat className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-xl font-semibold">No Menu Available</h2>
        <p className="mt-2 text-slate-600">
          This week's menu hasn't been published yet. Check back soon!
        </p>
      </div>
    );
  }

  const deadline = new Date(menu.order_deadline);
  const timeRemaining = deadline.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          This Week's Menu
        </h1>
        {menu.template?.name && (
          <p className="mt-2 text-xl text-[#D4A574]">{menu.template.name}</p>
        )}
        {menu.template?.description && (
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {menu.template.description}
          </p>
        )}
      </div>

      {/* Order Deadline Banner */}
      <Card className="border-l-4 border-l-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900 dark:text-orange-200">
              Order by Wednesday 11:59 PM
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {hoursRemaining > 0
                ? `${hoursRemaining} hours remaining`
                : "Orders closed"}
            </p>
          </div>
          <Badge variant="secondary">
            Delivery: {new Date(menu.delivery_date).toLocaleDateString()}
          </Badge>
        </div>
      </Card>

      {/* Day Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max md:justify-center">
          {dayMenus.map((day) => (
            <button
              key={day.dayOfWeek}
              onClick={() => setSelectedDay(day.dayOfWeek)}
              className={`px-4 py-3 rounded-lg transition-colors ${
                selectedDay === day.dayOfWeek
                  ? "bg-[#D4A574] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <div className="text-sm font-medium">{day.dayName}</div>
              <div className="text-xs opacity-80">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dishes for Selected Day */}
      <div className="space-y-4">
        {dayMenus
          .find((d) => d.dayOfWeek === selectedDay)
          ?.dishes.map((item, index) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Dish Image */}
                {item.dish.image_url && (
                  <div className="relative h-48 w-full md:h-auto md:w-64">
                    <Image
                      src={item.dish.image_url}
                      alt={item.dish.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Dish Details */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-2">Dish {index + 1}</Badge>
                      <h3 className="text-xl font-semibold">
                        {item.dish.name}
                      </h3>
                      {item.dish.name_my && (
                        <p className="text-slate-500">{item.dish.name_my}</p>
                      )}
                    </div>
                    {!item.is_available && (
                      <Badge variant="destructive">Sold Out</Badge>
                    )}
                  </div>

                  <p className="mt-3 text-slate-700 dark:text-slate-300">
                    {item.dish.description}
                  </p>

                  {/* Tags */}
                  {item.dish.tags && item.dish.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.dish.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Availability */}
                  {item.max_portions && (
                    <p className="mt-4 text-sm text-slate-600">
                      {item.max_portions - item.current_orders} portions
                      remaining
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Package Selector */}
      <PackageSelector weeklyMenuId={menu.id} />
    </div>
  );
}
```

#### 4.3 Package Selector Component

**Create:** `src/components/menu/package-selector.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MealPackage } from "@/types";
import { hapticSelection, hapticMedium } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type PackageSelectorProps = {
  weeklyMenuId: string;
};

export function PackageSelector({ weeklyMenuId }: PackageSelectorProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<MealPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/menu/packages");
      const data = await response.json();
      setPackages(data.packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (packageId: string) => {
    hapticSelection();
    setSelectedPackageId(packageId);
  };

  const handleContinueToCheckout = () => {
    if (!selectedPackageId) return;

    hapticMedium();
    router.push(`/checkout/weekly?menu=${weeklyMenuId}&package=${selectedPackageId}`);
  };

  if (loading) return null;

  return (
    <div className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Choose Your Package</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Select how many dishes you'd like each day
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const isMostPopular = pkg.badge_text === "Most Popular";

          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isSelected && "border-2 border-[#D4A574] shadow-xl",
                isMostPopular && "scale-105 md:scale-110"
              )}
              onClick={() => handleSelectPackage(pkg.id)}
              role="button"
              tabIndex={0}
            >
              {/* Badge */}
              {pkg.badge_text && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#D4A574] text-white">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {pkg.badge_text}
                  </Badge>
                </div>
              )}

              <div className="p-6">
                {/* Package Name */}
                <h3 className="text-2xl font-bold text-center">
                  {pkg.name}
                </h3>
                {pkg.name_my && (
                  <p className="text-center text-slate-500 mt-1">
                    {pkg.name_my}
                  </p>
                )}

                {/* Price */}
                <div className="my-6 text-center">
                  <span className="text-4xl font-bold text-[#D4A574]">
                    ${(pkg.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-slate-600">/week</span>
                </div>

                {/* Description */}
                <p className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {pkg.description}
                </p>

                {/* Features */}
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{pkg.dishes_per_day} dish{pkg.dishes_per_day > 1 ? 'es' : ''} per day</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{pkg.total_dishes} total dishes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Saturday delivery</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Fresh & authentic</span>
                  </li>
                </ul>

                {/* Select Button */}
                <Button
                  className={cn(
                    "mt-6 w-full",
                    isSelected && "bg-[#D4A574] hover:bg-[#C4956B]"
                  )}
                  variant={isSelected ? "default" : "outline"}
                >
                  {isSelected ? "Selected" : "Select Package"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Continue Button */}
      {selectedPackageId && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="burmese"
            onClick={handleContinueToCheckout}
            className="min-w-[280px]"
          >
            Continue to Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Step 5: Admin UI (3 hours)

#### 5.1 Menu Template Creator

**Create:** `src/app/(app)/(admin)/admin/menus/templates/new/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DishSelector } from "@/components/admin/dish-selector";
import type { MenuTheme } from "@/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function NewMenuTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameMy, setNameMy] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<MenuTheme>("traditional");
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>({});
  // selectedDishes structure: { "0-1": "dish-id", "0-2": "dish-id", ... }
  // Key format: "{day_of_week}-{meal_position}"

  const handleSave = async () => {
    try {
      // Create template
      const templateResponse = await fetch("/api/admin/menu-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name_my: nameMy,
          description,
          theme,
        }),
      });

      const { template } = await templateResponse.json();

      // Add dishes to template
      const templateDishes = Object.entries(selectedDishes).map(([key, dishId]) => {
        const [dayOfWeek, mealPosition] = key.split("-").map(Number);
        return {
          template_id: template.id,
          dish_id: dishId,
          day_of_week: dayOfWeek,
          meal_position: mealPosition,
        };
      });

      await fetch("/api/admin/template-dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishes: templateDishes }),
      });

      router.push("/admin/menus/templates");
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Menu Template</h1>

      <div className="space-y-8">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Template Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Traditional Mandalay Week"
              />
            </div>

            <div>
              <Label htmlFor="nameMy">Burmese Name (Optional)</Label>
              <Input
                id="nameMy"
                value={nameMy}
                onChange={(e) => setNameMy(e.target.value)}
                placeholder="e.g., ရိုးရာ မန္တလေး အပတ်"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this menu theme..."
              />
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as MenuTheme)}
              >
                <option value="traditional">Traditional</option>
                <option value="street_food">Street Food</option>
                <option value="regional">Regional</option>
                <option value="fusion">Fusion</option>
                <option value="vegetarian">Vegetarian</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Dish Selection Grid */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Dishes (7 days × 3 dishes)</h2>

          <div className="space-y-6">
            {DAYS.map((day, dayIndex) => (
              <div key={dayIndex} className="border-b pb-6 last:border-b-0">
                <h3 className="font-semibold mb-3">{day}</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((position) => (
                    <div key={position}>
                      <Label className="text-sm text-slate-600">
                        Dish {position}
                      </Label>
                      <DishSelector
                        value={selectedDishes[`${dayIndex}-${position}`]}
                        onChange={(dishId) =>
                          setSelectedDishes({
                            ...selectedDishes,
                            [`${dayIndex}-${position}`]: dishId,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create Template</Button>
        </div>
      </div>
    </div>
  );
}
```

#### 5.2 Weekly Menu Generator

**Create:** `src/app/(app)/(admin)/admin/menus/generate/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { MenuTemplate } from "@/types";

export default function GenerateWeeklyMenuPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // Auto-set next Sunday
    const nextSunday = getNextSunday();
    setWeekStartDate(nextSunday.toISOString().split("T")[0]);
  }, []);

  const fetchTemplates = async () => {
    const response = await fetch("/api/admin/menu-templates");
    const data = await response.json();
    setTemplates(data.templates);
  };

  const getNextSunday = () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/menus/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          week_start_date: weekStartDate,
        }),
      });

      const { menu } = await response.json();
      router.push(`/admin/menus/${menu.id}`);
    } catch (error) {
      console.error("Error generating menu:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Weekly Menu</h1>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <Label htmlFor="template">Select Template</Label>
            <Select
              id="template"
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="weekStart">Week Start Date (Sunday)</Label>
            <input
              type="date"
              id="weekStart"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplateId || generating}
              className="w-full"
            >
              {generating ? "Generating..." : "Generate Weekly Menu"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Database Testing:
- [ ] All 6 tables created
- [ ] RLS policies working
- [ ] Triggers fire correctly
- [ ] Default packages inserted
- [ ] Unique constraints enforced

### API Testing:
- [ ] GET /api/menu/weekly/current returns menu
- [ ] GET /api/menu/packages returns packages
- [ ] POST /api/orders/weekly creates order
- [ ] Stripe webhook confirms payment
- [ ] Order deadline validation works

### UI Testing:
- [ ] Weekly menu displays all 7 days
- [ ] Day tabs work smoothly
- [ ] Package selector highlights selection
- [ ] Checkout flow completes
- [ ] Admin can create templates
- [ ] Admin can generate weekly menus

### Business Logic Testing:
- [ ] Can't order after deadline
- [ ] Can't order same week twice
- [ ] Package prices correct
- [ ] Delivery date calculation correct
- [ ] Order count increments

---

## 🚀 Deployment Steps

1. **Run migration** in production
2. **Create initial menu templates** (Week 1, 2, 3, 4)
3. **Generate first weekly menu**
4. **Test complete order flow**
5. **Set up Stripe webhook** in production
6. **Test email notifications**
7. **Publish menu to customers**

---

## 📊 Success Metrics

- **Order Conversion Rate:** Target >30%
- **Average Package Selected:** Expect Package B to be 60%+
- **Orders Per Week:** Start with 10-15, grow to 100+
- **Order Deadline Compliance:** >95% before Wednesday

---

## 💡 Next Steps

After PR #25:
1. **PR #26:** Burmese language support
2. **Email templates:** Order confirmation, delivery reminder
3. **Driver dashboard:** View assigned deliveries
4. **Kitchen prep sheet:** Generate shopping list

---

**This is the core of Mandalay Morning Star! Let's build it! 🍜**
