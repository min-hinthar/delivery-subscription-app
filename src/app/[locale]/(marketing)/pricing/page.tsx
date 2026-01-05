import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { BillingActionButton } from "@/components/billing/billing-action-button";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-v2";
import { cn } from "@/lib/utils";
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

  const planHighlights = [
    {
      icon: CalendarCheck,
      title: "Weekend delivery windows",
      description: "Choose Saturday 11:00–19:00 PT or Sunday 11:00–15:00 PT.",
    },
    {
      icon: Clock,
      title: "Friday cutoff reminders",
      description: "Get a friendly nudge before the Friday 5:00 PM PT cutoff.",
    },
    {
      icon: Sparkles,
      title: "Chef-crafted Burmese menus",
      description: "Rotating seasonal dishes inspired by Mandalay home cooking.",
    },
  ];

  const servicePerks = [
    {
      icon: Truck,
      title: "Real-time delivery tracking",
      description: "Follow your driver with live ETA updates all the way to your door.",
    },
    {
      icon: ShieldCheck,
      title: "Subscription flexibility",
      description: "Pause, reschedule, or cancel anytime from the billing portal.",
    },
    {
      icon: Package,
      title: "Freshly packaged meals",
      description: "Temperature-controlled packaging keeps each dish travel-ready.",
    },
  ];

  const billingSteps = [
    "Subscribe once and reserve your spot for weekly weekend delivery.",
    "Choose a delivery window and confirm your address each week.",
    "Manage billing or pause your plan anytime in the customer portal.",
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D4A574] via-[#C19663] to-[#8B4513] px-6 py-14 text-white shadow-2xl sm:px-10 sm:py-16 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/burmese-pattern.svg')] opacity-10" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
                Weekend delivery subscription
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Simple weekly pricing for authentic Burmese cuisine.
              </h1>
              <p className="text-lg text-white/90 sm:text-xl">
                Subscribe once to reserve a standing delivery window, then enjoy a rotating
                menu of Burmese favorites designed for effortless weekend meals.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {planHighlights.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl bg-white/10 p-4 text-sm backdrop-blur">
                  <highlight.icon className="mb-3 h-5 w-5 text-white" aria-hidden="true" />
                  <p className="font-semibold">{highlight.title}</p>
                  <p className="mt-2 text-xs text-white/80">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="space-y-6 border-white/20 bg-white/95 text-slate-900 shadow-2xl dark:bg-slate-900">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Weekly Plan
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold">$69</span>
                <span className="text-sm text-slate-500">per week</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Includes chef-curated meals, weekend delivery, and real-time tracking.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#D4A574]" aria-hidden="true" />
                Saturday 11:00–19:00 PT or Sunday 11:00–15:00 PT
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#DC143C]" aria-hidden="true" />
                Friday 5:00 PM PT cutoff for weekend delivery
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#8B4513]" aria-hidden="true" />
                Pause or cancel anytime in the billing portal
              </li>
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#D4A574]" aria-hidden="true" />
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
              )}
              <p className="text-xs text-slate-500">
                Need help? Email support@morningstardelivery.com.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            What you get
          </p>
          <h2 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
            A premium delivery experience, every weekend.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Each subscription includes live delivery tracking, flexible scheduling, and a menu
            curated by Burmese chefs rooted in Mandalay&apos;s flavors.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {servicePerks.map((perk) => (
            <Card key={perk.title} className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A574]/10 text-[#8B4513]">
                <perk.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {perk.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {perk.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg dark:border-slate-800/80 dark:bg-slate-900/60 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Billing &amp; flexibility
          </p>
          <h2 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
            You stay in control of every delivery.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We keep billing simple and give you the freedom to adjust your delivery cadence
            as your weekend plans change.
          </p>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {billingSteps.map((step) => (
              <li key={step} className="flex items-start gap-3">
                <Star className="mt-0.5 h-4 w-4 text-[#D4A574]" aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-dashed border-[#D4A574]/40 bg-[#D4A574]/10 p-5 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Reminder before every cutoff
          </p>
          <p className="mt-2">
            We&apos;ll message you before Friday 5:00 PM PT so you can confirm your weekend
            delivery and lock in your preferred time window.
          </p>
        </div>
      </section>
    </div>
  );
}
