import Link from "next/link";

import {
  AppointmentsCard,
  type ScheduledAppointment,
} from "@/components/account/appointments-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { BillingActionButton } from "@/components/billing/billing-action-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  paused: "Paused",
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function maskLine1(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const [first, ...rest] = trimmed.split(" ");
  const maskedFirst = /\d/.test(first) ? "••••" : first;
  return [maskedFirst, ...rest].join(" ");
}

export default async function AccountPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          billing.
        </p>
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

  const { data: subscriptionRows } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const { data: customerRows } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const { data: address } = await supabase
    .from("addresses")
    .select("line1, line2, city, state, postal_code, country, instructions, is_primary")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select(
      "id, week_of, status, delivery_window:delivery_windows(day_of_week,start_time,end_time)",
    )
    .eq("user_id", user.id)
    .order("week_of", { ascending: true })
    .limit(3);

  const { data: weeklyOrders } = await supabase
    .from("weekly_orders")
    .select(
      `
      id,
      status,
      created_at,
      weekly_menu:weekly_menus(week_start_date, delivery_date),
      package:meal_packages(name)
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const normalizedWeeklyOrders =
    weeklyOrders?.map((order) => ({
      ...order,
      package: Array.isArray(order.package) ? order.package[0] ?? null : order.package ?? null,
      weekly_menu: Array.isArray(order.weekly_menu)
        ? order.weekly_menu[0] ?? null
        : order.weekly_menu ?? null,
    })) ?? [];

  const { data: recentRoute } = await supabase
    .from("delivery_routes")
    .select("polyline, distance_meters, duration_seconds")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = subscriptionRows?.[0] ?? null;
  const hasStripeCustomer = Boolean(customerRows?.length);
  const statusLabel = subscription?.status
    ? STATUS_LABELS[subscription.status] ?? subscription.status
    : "Not subscribed";
  const renewalDate = formatDate(subscription?.current_period_end ?? null);
  const hasActiveSubscription = subscription?.status
    ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    : false;
  const maskedLine1 = maskLine1(address?.line1 ?? null);
  const cityState = [address?.city, address?.state].filter(Boolean).join(", ");
  const postalHint = address?.postal_code
    ? `ZIP ••${address.postal_code.slice(-2)}`
    : null;

  const subscriptionNote = (() => {
    switch (subscription?.status) {
      case "past_due":
        return "Payment issue — update your payment method to keep deliveries on schedule.";
      case "canceled":
        return "Subscription canceled — resubscribe to keep receiving deliveries.";
      case "paused":
        return "Subscription paused — resume in billing to restart deliveries.";
      case "unpaid":
        return "Payment required — update billing to resume deliveries.";
      default:
        return null;
    }
  })();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Account"
        description="Manage your profile, addresses, and subscription status."
        cta={
          hasActiveSubscription ? (
            <Link
              href="/schedule"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              Schedule delivery
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              View plans
            </Link>
          )
        }
      />
      <Card className="space-y-4 bg-gradient-to-br from-white via-amber-50/80 to-rose-50/70 dark:from-slate-950 dark:via-slate-900/80 dark:to-rose-950/30">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Subscription status
          </p>
          <p className="text-lg font-semibold text-foreground">{statusLabel}</p>
          {subscription?.cancel_at_period_end ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Cancels at period end.
            </p>
          ) : null}
          {renewalDate ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Next renewal {renewalDate}
            </p>
          ) : null}
          {subscriptionNote ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">{subscriptionNote}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {hasStripeCustomer ? (
            <BillingActionButton
              endpoint="/api/subscriptions/portal"
              label="Manage billing"
              loadingLabel="Opening portal…"
            />
          ) : (
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
            >
              View plans
            </Link>
          )}
          <LogoutButton />
          <Link
            href="/schedule"
            className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
          >
            Schedule delivery
          </Link>
          <Link
            href="/track"
            className="text-sm font-medium text-foreground underline-offset-4 transition hover:-translate-y-0.5 hover:underline motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Track delivery
          </Link>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Billing overview</p>
          <p className="text-sm text-muted-foreground">
            Keep payment methods up to date and manage your subscription status.
          </p>
          {hasStripeCustomer ? (
            <BillingActionButton
              endpoint="/api/subscriptions/portal"
              label="Open billing portal"
              loadingLabel="Opening portal…"
            />
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              View plans
            </Link>
          )}
        </Card>
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Schedule next delivery</p>
          <p className="text-sm text-muted-foreground">
            Choose your weekend window before the Friday 5 PM cutoff.
          </p>
          <Link
            href="/schedule"
            className={`inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none ${
              hasActiveSubscription
                ? "border-border text-foreground hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md"
                : "pointer-events-none border-border text-muted-foreground"
            }`}
            aria-disabled={!hasActiveSubscription}
          >
            {hasActiveSubscription ? "Pick a window" : "Subscription required"}
          </Link>
          {!hasActiveSubscription ? (
            <p className="text-xs text-muted-foreground">Subscribe to unlock scheduling.</p>
          ) : null}
        </Card>
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Track your driver</p>
          <p className="text-sm text-muted-foreground">
            Real-time updates appear after your appointment is assigned to a route.
          </p>
          <Link
            href="/track"
            className={`inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none ${
              hasActiveSubscription
                ? "border-border text-foreground hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md"
                : "pointer-events-none border-border text-muted-foreground"
            }`}
            aria-disabled={!hasActiveSubscription}
          >
            {hasActiveSubscription ? "Open tracking" : "Subscription required"}
          </Link>
          {!hasActiveSubscription ? (
            <p className="text-xs text-muted-foreground">
              Activate your subscription to track deliveries.
            </p>
          ) : null}
        </Card>
      </div>
      <AppointmentsCard
        appointments={(appointments ?? []) as unknown as ScheduledAppointment[]}
        route={recentRoute}
      />
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Weekly orders
            </p>
            <p className="text-lg font-semibold text-foreground">Recent weekly orders</p>
          </div>
          <Link
            href="/orders/weekly"
            className="text-sm font-medium text-[#D4A574] hover:underline"
          >
            View all
          </Link>
        </div>
        {normalizedWeeklyOrders.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No weekly orders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {normalizedWeeklyOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {order.package?.name ?? "Weekly package"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Week of {formatDate(order.weekly_menu?.week_start_date ?? null)} • Delivery{" "}
                    {formatDate(order.weekly_menu?.delivery_date ?? null)}
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
                  {order.status ?? "pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 dark:from-slate-950 dark:via-slate-900/70 dark:to-emerald-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span role="img" aria-label="Profile">
              🧑‍🍳
            </span>
            Profile details
          </div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="text-slate-500 dark:text-slate-400">Name</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {profile?.full_name ?? "Add your name in onboarding"}
            </p>
          </div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="text-slate-500 dark:text-slate-400">Phone</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {profile?.phone ?? "Add your phone for delivery updates"}
            </p>
          </div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="text-slate-500 dark:text-slate-400">Email</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {profile?.email ?? user.email ?? "Add an email address"}
            </p>
          </div>
          <Link
            href="/account/profile"
            className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
          >
            Update profile details
          </Link>
        </Card>
        <Card className="space-y-3 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 dark:from-slate-950 dark:via-slate-900/70 dark:to-sky-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span role="img" aria-label="Home">
              🏡
            </span>
            Primary delivery address
          </div>
          {address ? (
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {maskedLine1 ?? "Address on file"}
              </p>
              {address.line2 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unit details on file
                </p>
              ) : null}
              {cityState ? <p>{cityState}</p> : null}
              {!cityState && postalHint ? <p>{postalHint}</p> : null}
              {address.country ? <p>{address.country}</p> : null}
              {address.instructions ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delivery notes on file
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add a delivery address to start scheduling.
            </p>
          )}
          <Link
            href="/account/profile"
            className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
          >
            Update delivery address
          </Link>
        </Card>
      </div>
    </div>
  );
}
