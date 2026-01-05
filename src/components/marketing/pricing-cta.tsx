"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { BillingActionButton } from "@/components/billing/billing-action-button";
import { buttonVariants } from "@/components/ui/button-v2";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type PricingCtaState = {
  isReady: boolean;
  hasUser: boolean;
  hasActiveSubscription: boolean;
};

export function PricingCta() {
  const [state, setState] = useState<PricingCtaState>({
    isReady: false,
    hasUser: false,
    hasActiveSubscription: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;

        if (!user) {
          setState({ isReady: true, hasUser: false, hasActiveSubscription: false });
          return;
        }

        const { data: subscriptionRows } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        const subscriptionStatus = subscriptionRows?.[0]?.status ?? null;
        const hasActiveSubscription = subscriptionStatus
          ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
          : false;

        setState({ isReady: true, hasUser: true, hasActiveSubscription });
      } catch {
        setState({ isReady: true, hasUser: false, hasActiveSubscription: false });
      }
    };

    void load();
  }, []);

  if (!state.isReady) {
    return (
      <div className="h-11 w-full rounded-lg bg-slate-100/80 animate-pulse sm:w-48" />
    );
  }

  if (!state.hasUser) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants({
            variant: "secondary",
            className: "bg-slate-900 text-white hover:bg-slate-800",
          }),
        )}
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Sign in to subscribe
      </Link>
    );
  }

  if (state.hasActiveSubscription) {
    return (
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
          className={cn(
            buttonVariants({
              variant: "outline",
              className: "border-slate-200 bg-white text-slate-900",
            }),
          )}
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Schedule delivery
        </Link>
      </div>
    );
  }

  return (
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
  );
}
