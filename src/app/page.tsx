import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Morning Star Weekly Delivery"
            title="Burmese meal prep delivered every weekend with smart scheduling and real-time tracking."
            description="Subscribe once, choose your Saturday or Sunday delivery window, and track your driver in real time. Admins get route planning, manifests, and prep totals."
            className="border-none pb-0"
            cta={
              <Link
                href="/signup?next=/onboarding"
                className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
              >
                Check coverage
              </Link>
            }
            secondaryAction={
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              >
                View plans
              </Link>
            }
          />
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-800">
              Sat 11:00–19:00 PT
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-800">
              Sun 11:00–15:00 PT
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-800">
              Cutoff Friday 5:00 PM PT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Questions? Email support@morningstardelivery.com.
          </p>
        </div>
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-900/40 dark:to-slate-800/30" />
          <div className="relative space-y-6">
            <div>
              <h2 className="text-lg font-semibold">What’s included</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li>• Weekend delivery windows with capacity caps.</li>
                <li>• Stripe billing + self-serve portal.</li>
                <li>• Customer scheduling + live tracking view.</li>
                <li>• Admin manifests, routes, and prep summaries.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:text-slate-400">
              Phase 1 foundation complete — wiring live data next.
            </div>
          </div>
        </Card>
      </section>

      <section id="how-it-works" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A simple three-step flow from signup to delivery day.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Choose your plan",
              description: "Subscribe once to lock in weekly delivery windows.",
            },
            {
              title: "Complete onboarding",
              description: "Confirm your profile and delivery address details.",
            },
            {
              title: "Schedule and track",
              description: "Pick a window and follow your driver in real time.",
            },
          ].map((item) => (
            <Card key={item.title} className="space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
          >
            View pricing
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          >
            Start onboarding
          </Link>
        </div>
      </section>
    </div>
  );
}
