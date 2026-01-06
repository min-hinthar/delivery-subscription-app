import Link from "next/link";

import { WeeklyOrderHistory, type WeeklyOrderHistoryItem } from "@/components/account/weekly-order-history";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

export default async function WeeklyOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: orders } = await supabase
    .from("weekly_orders")
    .select(
      `
      id,
      status,
      created_at,
      delivery_window,
      weekly_menu:weekly_menus(id, week_start_date, delivery_date),
      package:meal_packages(id, name, price_cents)
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const normalizedOrders =
    orders?.map((order) => ({
      ...order,
      weekly_menu: Array.isArray(order.weekly_menu)
        ? order.weekly_menu[0] ?? null
        : order.weekly_menu ?? null,
      package: Array.isArray(order.package) ? order.package[0] ?? null : order.package ?? null,
    })) ?? [];

  const { data: currentMenu } = await supabase
    .from("weekly_menus")
    .select("id")
    .eq("status", "published")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Weekly orders</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Review your weekly orders, reorder your favorite package, or cancel pending
          orders before they are assigned to a driver.
        </p>
        <Link href="/menu/weekly" className="mt-3 inline-flex text-sm text-[#D4A574]">
          Browse weekly menu
        </Link>
      </Card>

      <WeeklyOrderHistory
        orders={normalizedOrders as WeeklyOrderHistoryItem[]}
        currentMenuId={currentMenu?.id ?? null}
      />
    </div>
  );
}
