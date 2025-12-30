import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, UserCheck } from "lucide-react";

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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Check coverage
              </Link>
            }
            secondaryAction={
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
              >
                View plans
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              Sat 11:00–19:00 PT
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              Sun 11:00–15:00 PT
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              Cutoff Friday 5:00 PM PT
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Questions? Email support@morningstardelivery.com.</p>
        </div>
        <Card className="relative overflow-hidden rounded-2xl border border-border bg-background p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:transform-none">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-muted/60 via-transparent to-muted/30" />
          <div className="relative space-y-6">
            <div>
              <h2 className="text-lg font-semibold">What’s included</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>• Weekend delivery windows with capacity caps.</li>
                <li>• Stripe billing + self-serve portal.</li>
                <li>• Customer scheduling + live tracking view.</li>
                <li>• Admin manifests, routes, and prep summaries.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground shadow-sm">
              Chef-curated menus refresh weekly, with delivery reminders before cutoff.
            </div>
          </div>
        </Card>
      </section>

      <section id="how-it-works" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
          <p className="text-sm text-muted-foreground">A simple three-step flow from signup to delivery day.</p>
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
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            View pricing
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Start onboarding
          </Link>
        </div>
      </section>
    </div>
  );
}
