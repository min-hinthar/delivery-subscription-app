import Link from "next/link";

import { BillingActionButton } from "@/components/billing/billing-action-button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = hasSupabaseConfig ? await createSupabaseServerClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Pricing</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Weekly delivery plans built for easy weekend meal prep.
        </p>
      </div>
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
            Saturday or Sunday delivery windows
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
            <BillingActionButton
              endpoint="/api/subscriptions/checkout"
              label="Subscribe"
              loadingLabel="Redirecting to Stripe…"
            />
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
            >
              Sign in to subscribe
            </Link>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already subscribed?{" "}
            <Link
              href="/account"
              className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
            >
              Manage your account
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
