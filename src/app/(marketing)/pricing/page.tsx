import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Go to account
            </Link>
          ) : null
        }
      />
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Weekly Subscription
          </p>
          <h2 className="text-2xl font-semibold text-foreground">$69 / week</h2>
          <p className="text-sm text-muted-foreground">
            Includes chef-curated meals, weekend delivery, and real-time tracking.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Saturday 11:00–19:00 PT or Sunday 11:00–15:00 PT
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Cutoff Friday 5:00 PM PT for upcoming weekend
          </li>
          <li className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Pause or cancel anytime in the billing portal
          </li>
          <li className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Manage deliveries from your account dashboard
          </li>
        </ul>
        <div className="flex flex-col gap-3">
          {user ? (
            hasActiveSubscription ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <BillingActionButton
                  endpoint="/api/subscriptions/portal"
                  label={
                    <span className="inline-flex items-center gap-2">
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Manage billing
                    </span>
                  }
                  loadingLabel="Opening portal…"
                />
                <Link
                  href="/schedule"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Schedule delivery
                </Link>
              </div>
            ) : (
              <BillingActionButton
                endpoint="/api/subscriptions/checkout"
                label={
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Subscribe
                  </span>
                }
                loadingLabel="Redirecting to Stripe…"
                className="w-full sm:w-auto"
              />
            )
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Sign in to subscribe
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            Need help? Email support@morningstardelivery.com.
          </p>
        </div>
      </Card>
      <div className="rounded-xl border border-border/60 bg-muted px-5 py-4 text-sm text-muted-foreground shadow-sm">
        Customers receive a reminder before the Friday 5:00 PM PT cutoff. Schedule early
        to guarantee your preferred window.
      </div>
    </div>
  );
}
