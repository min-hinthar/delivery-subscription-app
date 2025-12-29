import Link from "next/link";
import { redirect } from "next/navigation";

import { BillingActionButton } from "@/components/billing/billing-action-button";
import { PageHeader } from "@/components/layout/page-header";
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

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
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

  const subscription = subscriptionRows?.[0] ?? null;
  const hasStripeCustomer = Boolean(customerRows?.length);
  const statusLabel = subscription?.status
    ? STATUS_LABELS[subscription.status] ?? subscription.status
    : "Not subscribed";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Billing"
        description="Manage payment methods, invoices, and subscription status."
        cta={
          hasStripeCustomer ? (
            <BillingActionButton
              endpoint="/api/subscriptions/portal"
              label="Open billing portal"
              loadingLabel="Opening portal…"
            />
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
            >
              View plans
            </Link>
          )
        }
      />
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Subscription status
          </p>
          <p className="text-lg font-semibold text-foreground">{statusLabel}</p>
          {subscription?.cancel_at_period_end ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Cancels at period end.
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
            >
              Subscribe
            </Link>
          )}
          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          >
            Back to account
          </Link>
        </div>
      </Card>
      <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-300">
        Billing changes apply immediately. If you need help, email
        support@morningstardelivery.com.
      </div>
    </div>
  );
}
