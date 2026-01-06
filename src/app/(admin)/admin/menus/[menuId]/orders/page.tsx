import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WeeklyOrdersTable, type WeeklyOrderRow } from "@/components/admin/weekly-orders-table";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WeeklyOrdersPageProps = {
  params: Promise<{ menuId: string }>;
};

export default async function WeeklyOrdersPage({ params }: WeeklyOrdersPageProps) {
  const resolvedParams = await params;
  const menuId = resolvedParams.menuId;

  const supabase = await createSupabaseServerClient();

  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("id, week_start_date, delivery_date, template:menu_templates(name)")
    .eq("id", menuId)
    .maybeSingle();

  const { data: orders } = await supabase
    .from("weekly_orders")
    .select(
      `
      id,
      status,
      delivery_window,
      delivery_instructions,
      total_amount_cents,
      created_at,
      paid_at,
      customer:profiles(full_name, email, phone),
      package:meal_packages(name),
      delivery_address:addresses(line1, line2, city, state, postal_code),
      driver:profiles(id, full_name, email)
    `,
    )
    .eq("weekly_menu_id", menuId)
    .order("created_at", { ascending: true });

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_driver", true)
    .order("full_name", { ascending: true });

  const menuData = menu as
    | {
        template?: { name?: string | null } | { name?: string | null }[] | null;
        week_start_date?: string | null;
        delivery_date?: string | null;
      }
    | null;

  const templateName = Array.isArray(menuData?.template)
    ? menuData?.template?.[0]?.name
    : menuData?.template?.name;

  const normalizedOrders = (orders ?? []).map((order) => ({
    ...order,
    customer: Array.isArray(order.customer) ? order.customer[0] ?? null : order.customer ?? null,
    package: Array.isArray(order.package) ? order.package[0] ?? null : order.package ?? null,
    delivery_address: Array.isArray(order.delivery_address)
      ? order.delivery_address[0] ?? null
      : order.delivery_address ?? null,
    driver: Array.isArray(order.driver) ? order.driver[0] ?? null : order.driver ?? null,
  })) as WeeklyOrderRow[];

  const normalizedDrivers = (drivers ?? []).map((driver) => ({
    id: driver.id,
    full_name: driver.full_name,
    email: driver.email,
  }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Link href="/admin/menus" className="inline-flex items-center text-sm text-slate-500">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to menus
      </Link>

      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Weekly orders</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {templateName ?? "Weekly menu"} • Week of {menuData?.week_start_date ?? "—"} • Delivery{" "}
          {menuData?.delivery_date ?? "—"}
        </p>
      </Card>

      <WeeklyOrdersTable orders={normalizedOrders} drivers={normalizedDrivers} />
    </div>
  );
}
