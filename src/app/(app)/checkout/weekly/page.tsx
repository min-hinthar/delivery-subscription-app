import Link from "next/link";

import { WeeklyCheckout } from "@/components/menu/weekly-checkout";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Weekly Checkout | Mandalay Morning Star",
  description: "Confirm your weekly menu package and delivery details.",
};

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

type WeeklyCheckoutPageProps = {
  searchParams: { menu?: string; package?: string };
};

export default async function WeeklyCheckoutPage({ searchParams }: WeeklyCheckoutPageProps) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          weekly checkout.
        </p>
      </div>
    );
  }

  const weeklyMenuId = searchParams.menu;
  const packageId = searchParams.package;

  if (!weeklyMenuId || !packageId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-2xl font-semibold">Missing order details</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Please choose a menu package before checking out.
        </p>
        <Link href="/menu/weekly" className="text-sm font-medium text-[#D4A574]">
          Return to weekly menu
        </Link>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: menu } = await supabase
    .from("weekly_menus")
    .select("id, week_start_date, delivery_date, status")
    .eq("id", weeklyMenuId)
    .maybeSingle();

  const { data: mealPackage } = await supabase
    .from("meal_packages")
    .select(
      "id, name, name_my, description, description_my, dishes_per_day, total_dishes, price_cents, display_order, badge_text, badge_text_my, is_active, created_at, updated_at",
    )
    .eq("id", packageId)
    .maybeSingle();

  const { data: addresses } = await supabase
    .from("addresses")
    .select(
      "id, line1, line2, city, state, postal_code, country, instructions, is_primary",
    )
    .eq("user_id", user.id);

  const primaryAddressId = addresses?.find((address) => address.is_primary)?.id ?? null;

  if (!menu || !mealPackage) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-2xl font-semibold">Unable to load checkout</h1>
        <p className="text-slate-600 dark:text-slate-400">
          We couldn&apos;t find that menu or package. Please try again.
        </p>
        <Link href="/menu/weekly" className="text-sm font-medium text-[#D4A574]">
          Return to weekly menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly checkout</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Confirm your package and delivery preferences.
          </p>
        </div>

        <Card className="p-6">
          <WeeklyCheckout
            menu={menu}
            mealPackage={mealPackage}
            addresses={addresses ?? []}
            defaultAddressId={primaryAddressId}
          />
        </Card>
      </div>
    </div>
  );
}
