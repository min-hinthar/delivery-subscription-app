import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SubscriptionRow = {
  id: string;
  status: string;
  stripe_subscription_id: string;
  current_period_end: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminSubscriptionsPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load
          subscription operations.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, stripe_subscription_id, current_period_end, profile:profiles(full_name,email)")
    .order("updated_at", { ascending: false })
    .limit(12);

  const formatted = (subscriptions ?? []) as unknown as SubscriptionRow[];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-purple-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-purple-950/30">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Billing ops
          </div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor billing health, renewals, and subscriber status changes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="rounded-md border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <Card className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-purple-50/40 dark:from-slate-950 dark:via-slate-900/70 dark:to-purple-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recent subscriptions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Latest updates synced from Stripe webhooks.
            </p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
            {formatted.length} records
          </span>
        </div>
        <div className="space-y-3">
          {formatted.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No subscription records yet. Stripe webhooks will populate this list.
            </p>
          ) : (
            formatted.map((subscription) => (
              <div
                key={subscription.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white/80 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {subscription.profile?.full_name ?? "Subscriber"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subscription.profile?.email ?? subscription.stripe_subscription_id}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Renewal {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {subscription.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
