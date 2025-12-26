import Link from "next/link";

import { BillingActionButton } from "@/components/billing/billing-action-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  paused: "Paused",
};

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

  const subscription = subscriptionRows?.[0] ?? null;
  const hasStripeCustomer = Boolean(customerRows?.length);
  const statusLabel = subscription?.status
    ? STATUS_LABELS[subscription.status] ?? subscription.status
    : "Not subscribed";
  const renewalDate = formatDate(subscription?.current_period_end ?? null);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Account</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your profile, addresses, and subscription status.
        </p>
      </div>
      <Card className="space-y-4">
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
            className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:-translate-y-0.5 hover:underline dark:text-slate-100"
          >
            Track delivery
          </Link>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
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
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span role="img" aria-label="Home">
              🏡
            </span>
            Primary delivery address
          </div>
          {address ? (
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-100">{address.line1}</p>
              {address.line2 ? <p>{address.line2}</p> : null}
              <p>
                {address.city}, {address.state} {address.postal_code}
              </p>
              <p>{address.country}</p>
              {address.instructions ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notes: {address.instructions}
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
