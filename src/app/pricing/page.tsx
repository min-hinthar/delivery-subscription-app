import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { BillingActionButton } from "@/components/billing/billing-action-button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export default async function PricingPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = hasSupabaseConfig ? await createSupabaseServerClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const { data: subscriptionRows } = user
    ? await supabase!
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
    : { data: [] };

  const subscriptionStatus = subscriptionRows?.[0]?.status ?? null;
  const hasActiveSubscription = subscriptionStatus
    ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
    : false;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader
        title="Pricing"
        description="Weekly delivery plans built for easy weekend meal prep."
        cta={
          hasActiveSubscription ? (
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
            >
              Go to account
            </Link>
          ) : null
        }
      />
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weekly Subscription
          </p>
          <h2 className="text-2xl font-semibold text-foreground">$69 / week</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Includes chef-curated meals, weekend delivery, and real-time tracking.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <span role="img" aria-label="Calendar">
              📆
            </span>
            Saturday 11:00–19:00 PT or Sunday 11:00–15:00 PT
          </li>
          <li className="flex items-center gap-2">
            <span role="img" aria-label="Cutoff">
              ⏱️
            </span>
            Cutoff Friday 5:00 PM PT for upcoming weekend
          </li>
          <li className="flex items-center gap-2">
            <span role="img" aria-label="Pause">
              ⏸️
            </span>
            Pause or cancel anytime in the billing portal
          </li>
          <li className="flex items-center gap-2">
            <span role="img" aria-label="Box">
              📦
            </span>
            Manage deliveries from your account dashboard
          </li>
        </ul>
        <div className="flex flex-col gap-3">
          {user ? (
            hasActiveSubscription ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <BillingActionButton
                  endpoint="/api/subscriptions/portal"
                  label="Manage billing"
                  loadingLabel="Opening portal…"
                />
                <Link
                  href="/schedule"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                >
                  Schedule delivery
                </Link>
              </div>
            ) : (
              <BillingActionButton
                endpoint="/api/subscriptions/checkout"
                label="Subscribe"
                loadingLabel="Redirecting to Stripe…"
                className="w-full sm:w-auto"
              />
            )
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
            >
              Sign in to subscribe
            </Link>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need help? Email support@morningstardelivery.com.
          </p>
        </div>
      </Card>
      <div className="rounded-xl border border-slate-200/60 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
        Customers receive a reminder before the Friday 5:00 PM PT cutoff. Schedule early
        to guarantee your preferred window.
      </div>
    </div>
  );
}
