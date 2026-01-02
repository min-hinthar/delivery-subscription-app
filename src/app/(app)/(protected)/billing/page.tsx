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
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              View plans
            </Link>
          )
        }
      />
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              Subscribe
            </Link>
          )}
          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Back to account
          </Link>
        </div>
      </Card>
      <div className="rounded-xl border border-border/70 bg-muted px-5 py-4 text-sm text-muted-foreground shadow-sm">
        Billing changes apply immediately. If you need help, email
        support@morningstardelivery.com.
      </div>
    </div>
  );
}
