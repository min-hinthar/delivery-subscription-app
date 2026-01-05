# 🍜 Weekly Menu Template System - Implementation Guide

**For:** Mandalay Morning Star Burmese Kitchen
**Business Model:** Weekly Meal Delivery + À la Carte Options
**Priority:** P0 (Critical for Business Operations)
**Estimated Effort:** 3-4 hours
**Business Impact:** Enables core business model

---

## 🎯 Business Context

**Mandalay Morning Star's Business Model:**

### Primary: Weekly Meal Packages
- **Package A**: 7 dishes (one per day) - $85/week
- **Package B**: 14 dishes (two per day) - $155/week
- **Package C**: 21 dishes (three per day) - $220/week

### Secondary: À la Carte Orders
- Single dishes from weekly menu - $14-$18/dish
- Extras (rice, sides, desserts) - $3-$8/item

### Weekly Rotation:
- **New menu every Sunday**
- **Order deadline: Wednesday 11:59 PM**
- **Delivery: Saturday 10 AM - 4 PM**
- **Menu themes:** Traditional, Fusion, Regional specialties

---

## 🏗️ Database Schema

### New Tables

#### 1. `menu_templates`

```sql
create table if not exists public.menu_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_my text, -- Burmese name
  description text,
  description_my text,
  theme text, -- 'traditional', 'fusion', 'regional'
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_menu_templates_active on public.menu_templates(is_active);
create index idx_menu_templates_theme on public.menu_templates(theme);
```

#### 2. `menu_template_items`

```sql
create table if not exists public.menu_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.menu_templates(id) on delete cascade,
  dish_id uuid not null references public.menu_items(id),
  day_of_week int check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  meal_slot int check (meal_slot between 1 and 3), -- 1=breakfast, 2=lunch, 3=dinner
  position int not null default 0, -- Order within the template
  created_at timestamptz not null default now()
);

create index idx_menu_template_items_template on public.menu_template_items(template_id);
create index idx_menu_template_items_day on public.menu_template_items(day_of_week);
create unique index idx_menu_template_items_unique
  on public.menu_template_items(template_id, day_of_week, meal_slot, position);
```

#### 3. `weekly_menus`

```sql
create table if not exists public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.menu_templates(id),
  week_start_date date not null unique, -- Sunday of the week
  week_end_date date not null, -- Saturday of the week
  order_deadline timestamptz not null, -- Wednesday 11:59 PM
  delivery_date date not null, -- Saturday
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_weekly_menus_week_start on public.weekly_menus(week_start_date);
create index idx_weekly_menus_status on public.weekly_menus(status);
create index idx_weekly_menus_delivery on public.weekly_menus(delivery_date);
```

#### 4. `weekly_menu_items`

```sql
create table if not exists public.weekly_menu_items (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references public.weekly_menus(id) on delete cascade,
  dish_id uuid not null references public.menu_items(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_slot int check (meal_slot between 1 and 3),
  position int not null default 0,
  is_available boolean not null default true,
  max_quantity int, -- Inventory limit
  current_orders int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_weekly_menu_items_menu on public.weekly_menu_items(weekly_menu_id);
create index idx_weekly_menu_items_day on public.weekly_menu_items(day_of_week);
create index idx_weekly_menu_items_available on public.weekly_menu_items(is_available);
```

#### 5. `meal_packages`

```sql
create table if not exists public.meal_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- 'Package A', 'Package B', 'Package C'
  name_my text,
  description text,
  description_my text,
  dishes_per_day int not null, -- 1, 2, or 3
  total_dishes int not null, -- 7, 14, or 21
  price_cents int not null, -- 8500, 15500, 22000
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_meal_packages_active on public.meal_packages(is_active, sort_order);
```

#### 6. `package_orders`

```sql
create table if not exists public.package_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  weekly_menu_id uuid not null references public.weekly_menus(id),
  package_id uuid not null references public.meal_packages(id),
  total_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  delivery_address_id uuid references public.addresses(id),
  delivery_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index idx_package_orders_user on public.package_orders(user_id);
create index idx_package_orders_menu on public.package_orders(weekly_menu_id);
create index idx_package_orders_status on public.package_orders(status);
```

---

## 📋 API Endpoints

### Admin Endpoints

#### 1. `POST /api/admin/menu-templates`

**Purpose:** Create a menu template

```typescript
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { ok, bad } from "@/lib/api/response";

const templateSchema = z.object({
  name: z.string().min(1),
  name_my: z.string().optional(),
  description: z.string().optional(),
  description_my: z.string().optional(),
  theme: z.enum(["traditional", "fusion", "regional"]),
  dishes: z.array(z.object({
    dish_id: z.string().uuid(),
    day_of_week: z.number().min(0).max(6),
    meal_slot: z.number().min(1).max(3),
    position: z.number().min(0),
  })),
});

export async function POST(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin) return bad("Admin access required", { status: 403 });

  const body = templateSchema.parse(await request.json());

  // Create template
  const { data: template, error: templateError } = await supabase
    .from("menu_templates")
    .insert({
      name: body.name,
      name_my: body.name_my,
      description: body.description,
      description_my: body.description_my,
      theme: body.theme,
      created_by: user!.id,
    })
    .select()
    .single();

  if (templateError) return bad("Failed to create template", { status: 500 });

  // Add dishes to template
  const items = body.dishes.map((dish) => ({
    template_id: template.id,
    ...dish,
  }));

  const { error: itemsError } = await supabase
    .from("menu_template_items")
    .insert(items);

  if (itemsError) return bad("Failed to add dishes", { status: 500 });

  return ok({ template });
}
```

#### 2. `POST /api/admin/weekly-menus/generate`

**Purpose:** Generate a weekly menu from a template

```typescript
import { addDays, startOfWeek, endOfWeek, setHours } from "date-fns";

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return bad("Admin access required", { status: 403 });

  const { template_id, week_start } = await request.json();

  // Calculate dates
  const weekStart = new Date(week_start);
  const weekEnd = endOfWeek(weekStart);
  const deliveryDate = addDays(weekStart, 6); // Saturday
  const orderDeadline = setHours(addDays(weekStart, 3), 23); // Wednesday 11:59 PM

  // Create weekly menu
  const { data: weeklyMenu, error: menuError } = await supabase
    .from("weekly_menus")
    .insert({
      template_id,
      week_start_date: weekStart.toISOString().split('T')[0],
      week_end_date: weekEnd.toISOString().split('T')[0],
      order_deadline: orderDeadline.toISOString(),
      delivery_date: deliveryDate.toISOString().split('T')[0],
      status: "draft",
    })
    .select()
    .single();

  if (menuError) return bad("Failed to create weekly menu", { status: 500 });

  // Copy template items to weekly menu
  const { data: templateItems } = await supabase
    .from("menu_template_items")
    .select("*")
    .eq("template_id", template_id);

  if (templateItems && templateItems.length > 0) {
    const weeklyItems = templateItems.map((item) => ({
      weekly_menu_id: weeklyMenu.id,
      dish_id: item.dish_id,
      day_of_week: item.day_of_week,
      meal_slot: item.meal_slot,
      position: item.position,
      is_available: true,
    }));

    await supabase.from("weekly_menu_items").insert(weeklyItems);
  }

  return ok({ weekly_menu: weeklyMenu });
}
```

#### 3. `PATCH /api/admin/weekly-menus/[id]/publish`

**Purpose:** Publish a weekly menu

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return bad("Admin access required", { status: 403 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("weekly_menus")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return bad("Failed to publish menu", { status: 500 });

  // TODO: Send email notifications to subscribers

  return ok({ weekly_menu: data });
}
```

### Customer Endpoints

#### 4. `GET /api/customer/weekly-menu/current`

**Purpose:** Get current week's published menu

```typescript
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const today = new Date();
  const weekStart = startOfWeek(today);

  const { data: menu, error } = await supabase
    .from("weekly_menus")
    .select(`
      *,
      items:weekly_menu_items(
        *,
        dish:menu_items(*)
      )
    `)
    .eq("status", "published")
    .gte("week_start_date", weekStart.toISOString().split('T')[0])
    .lte("week_start_date", today.toISOString().split('T')[0])
    .maybeSingle();

  if (error || !menu) {
    return bad("No menu available for this week", { status: 404 });
  }

  // Group items by day
  const itemsByDay: Record<number, any[]> = {};
  menu.items?.forEach((item: any) => {
    if (!itemsByDay[item.day_of_week]) {
      itemsByDay[item.day_of_week] = [];
    }
    itemsByDay[item.day_of_week].push(item);
  });

  return ok({
    menu: {
      ...menu,
      items_by_day: itemsByDay,
    },
  });
}
```

#### 5. `POST /api/customer/package-orders`

**Purpose:** Order a meal package

```typescript
const packageOrderSchema = z.object({
  weekly_menu_id: z.string().uuid(),
  package_id: z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Authentication required", { status: 401 });

  const body = packageOrderSchema.parse(await request.json());

  // Get package details
  const { data: package } = await supabase
    .from("meal_packages")
    .select("*")
    .eq("id", body.package_id)
    .single();

  if (!package) return bad("Package not found", { status: 404 });

  // Get weekly menu details
  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("id", body.weekly_menu_id)
    .single();

  if (!menu) return bad("Menu not found", { status: 404 });

  // Check if order deadline has passed
  if (new Date() > new Date(menu.order_deadline)) {
    return bad("Order deadline has passed", { status: 400 });
  }

  // Create package order
  const { data: order, error } = await supabase
    .from("package_orders")
    .insert({
      user_id: user.id,
      weekly_menu_id: body.weekly_menu_id,
      package_id: body.package_id,
      total_cents: package.price_cents,
      delivery_address_id: body.delivery_address_id,
      delivery_date: menu.delivery_date,
      notes: body.notes,
      status: "pending",
    })
    .select()
    .single();

  if (error) return bad("Failed to create order", { status: 500 });

  // TODO: Process payment via Stripe
  // TODO: Send order confirmation email

  return ok({ order });
}
```

---

## 🎨 UI Components

### 1. Weekly Menu Display

**`src/app/(app)/(protected)/menu/weekly/page.tsx`**

```typescript
import { WeeklyMenuGrid } from "@/components/menu/weekly-menu-grid";
import { PackageSelector } from "@/components/menu/package-selector";

export default async function WeeklyMenuPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/customer/weekly-menu/current`);
  const { menu } = await response.json();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold">This Week's Menu</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Week of {new Date(menu.week_start_date).toLocaleDateString()} -{" "}
          {new Date(menu.week_end_date).toLocaleDateString()}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Order deadline: {new Date(menu.order_deadline).toLocaleString()}
        </p>
      </div>

      {/* Package options */}
      <PackageSelector menuId={menu.id} />

      {/* Weekly menu grid */}
      <WeeklyMenuGrid menu={menu} />
    </div>
  );
}
```

### 2. Package Selector Component

**`src/components/menu/package-selector.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PACKAGES = [
  {
    id: "package-a",
    name: "Package A",
    nameMy: "အစီအစဉ် A",
    dishesPerDay: 1,
    totalDishes: 7,
    price: 85,
    description: "Perfect for one person",
    descriptionMy: "တစ်ဦးတည်းအတွက် အကောင်းဆုံး",
    popular: false,
  },
  {
    id: "package-b",
    name: "Package B",
    nameMy: "အစီအစဉ် B",
    dishesPerDay: 2,
    totalDishes: 14,
    price: 155,
    description: "Great for couples or variety lovers",
    descriptionMy: "စုံတွဲများ သို့မဟုတ် အမျိုးမျိုးကြိုက်သူများအတွက်",
    popular: true,
  },
  {
    id: "package-c",
    name: "Package C",
    nameMy: "အစီအစဉ် C",
    dishesPerDay: 3,
    totalDishes: 21,
    price: 220,
    description: "Best for families or meal prep enthusiasts",
    descriptionMy: "မိသားစုများ သို့မဟုတ် အစားအစာကြိုပြင်ဆင်သူများအတွက်",
    popular: false,
  },
];

export function PackageSelector({ menuId }: { menuId: string }) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Choose Your Package</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all",
              selectedPackage === pkg.id
                ? "border-[#D4A574] bg-[#D4A574]/5"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
            )}
          >
            {pkg.popular && (
              <div className="absolute right-4 top-4 rounded-full bg-[#DC143C] px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
            )}

            {selectedPackage === pkg.id && (
              <div className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A574]">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-xl font-bold">{pkg.name}</h3>
              <p className="text-sm text-slate-500">{pkg.nameMy}</p>

              <div className="my-4">
                <span className="text-3xl font-bold text-[#D4A574]">
                  ${pkg.price}
                </span>
                <span className="text-slate-500">/week</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#D4A574]" />
                  <span>{pkg.totalDishes} dishes total</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#D4A574]" />
                  <span>{pkg.dishesPerDay} dish{pkg.dishesPerDay > 1 ? "es" : ""} per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#D4A574]" />
                  <span>Saturday delivery</span>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {pkg.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedPackage && (
        <div className="flex justify-center">
          <Button size="lg" className="px-12">
            Order {PACKAGES.find((p) => p.id === selectedPackage)?.name}
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 3. Weekly Menu Grid

**`src/components/menu/weekly-menu-grid.tsx`**

```typescript
"use client";

import { DishCard } from "@/components/menu/dish-card";

const DAYS = [
  { value: 0, label: "Sunday", labelMy: "တနင်္ဂနွေ" },
  { value: 1, label: "Monday", labelMy: "တနင်္လာ" },
  { value: 2, label: "Tuesday", labelMy: "အင်္ဂါ" },
  { value: 3, label: "Wednesday", labelMy: "ဗုဒ္ဓဟူး" },
  { value: 4, label: "Thursday", labelMy: "ကြာသပတေး" },
  { value: 5, label: "Friday", labelMy: "သောကြာ" },
  { value: 6, label: "Saturday", labelMy: "စနေ" },
];

export function WeeklyMenuGrid({ menu }: { menu: any }) {
  return (
    <div className="space-y-8">
      {DAYS.map((day) => {
        const dayItems = menu.items_by_day[day.value] || [];

        if (dayItems.length === 0) return null;

        return (
          <div key={day.value} className="space-y-4">
            <div className="sticky top-16 z-10 border-b border-slate-200 bg-white/95 pb-2 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95">
              <h2 className="text-2xl font-bold">{day.label}</h2>
              <p className="text-sm text-slate-500">{day.labelMy}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayItems
                .sort((a: any, b: any) => a.position - b.position)
                .map((item: any) => (
                  <DishCard
                    key={item.id}
                    dish={item.dish}
                    dayLabel={day.label}
                    isAvailable={item.is_available}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 📧 Email Notifications

### Weekly Menu Announcement

**Template:** `emails/weekly-menu-announcement.tsx`

```typescript
import { Html, Head, Preview, Body, Container, Section, Text, Link, Button } from "@react-email/components";

export default function WeeklyMenuAnnouncement({
  weekStart,
  orderDeadline,
  menuUrl,
}: {
  weekStart: string;
  orderDeadline: string;
  menuUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>This Week's Menu is Here! 🍜</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={heading}>Mingalaba! မင်္ဂလာပါ</Text>
            <Text style={subheading}>This Week's Menu is Ready</Text>
          </Section>

          <Section style={content}>
            <Text>
              Our new menu for the week of <strong>{weekStart}</strong> is now available!
            </Text>

            <Text>
              Browse this week's delicious Burmese dishes and place your order before{" "}
              <strong>{new Date(orderDeadline).toLocaleString()}</strong>.
            </Text>

            <Button style={button} href={menuUrl}>
              View This Week's Menu
            </Button>

            <Text style={note}>
              🕐 Order deadline: {new Date(orderDeadline).toLocaleString()}<br />
              🚚 Delivery: Saturday, 10 AM - 4 PM
            </Text>
          </Section>

          <Section style={footer}>
            <Text>
              Mandalay Morning Star Burmese Kitchen<br />
              Serving the Los Angeles Burmese Community
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#D4A574",
  color: "#ffffff",
  textAlign: "center" as const,
};

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const subheading = {
  fontSize: "18px",
  margin: "0",
};

const content = {
  padding: "24px",
};

const button = {
  backgroundColor: "#D4A574",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "24px 0",
};

const note = {
  fontSize: "14px",
  color: "#666",
  marginTop: "24px",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
  color: "#666",
  fontSize: "12px",
};
```

---

## 🧪 Testing Plan

### Unit Tests:
- [ ] Menu template creation
- [ ] Weekly menu generation from template
- [ ] Package order validation
- [ ] Date calculations (week start/end, deadlines)
- [ ] Inventory tracking

### Integration Tests:
- [ ] Full weekly menu workflow (create → publish → order)
- [ ] À la carte orders alongside package orders
- [ ] Order deadline enforcement
- [ ] Payment processing with Stripe

### E2E Tests:
- [ ] Customer views weekly menu
- [ ] Customer selects package
- [ ] Customer places order
- [ ] Admin creates menu template
- [ ] Admin generates and publishes weekly menu

---

## 🚀 Implementation Timeline

**Week 1:**
- Day 1-2: Database schema + migrations
- Day 3: Admin menu template CRUD
- Day 4: Weekly menu generation
- Day 5: Customer menu display

**Week 2:**
- Day 1-2: Package selection + ordering
- Day 3: À la carte option
- Day 4: Email notifications
- Day 5: Testing + bug fixes

---

**This system enables Mandalay Morning Star's core weekly delivery business model!** 🍜✨
