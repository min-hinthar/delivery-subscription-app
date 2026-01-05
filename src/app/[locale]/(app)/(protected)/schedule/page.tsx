import Link from "next/link";
import { redirect } from "next/navigation";

import { SchedulingErrorBoundary } from "@/components/error-boundary";
import { PageHeader } from "@/components/layout/page-header";
import { SchedulePlanner } from "@/components/schedule/schedule-planner";
import { Card } from "@/components/ui/card";
import {
  formatDateYYYYMMDD,
  getCutoffForWeek,
  getUpcomingWeekStarts,
  isAfterCutoff,
  PT_TIME_ZONE,
} from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function formatWeekLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIME_ZONE,
    month: "short",
    day: "numeric",
  });

  return `Week of ${formatter.format(date)}`;
}

function formatCutoff(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(date)} PT`;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: Promise<{ week_of?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          scheduling.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    const nextPath = resolvedSearchParams?.week_of
      ? `/schedule?week_of=${encodeURIComponent(resolvedSearchParams.week_of)}`
      : "/schedule";
    redirect(`/login?reason=auth&next=${encodeURIComponent(nextPath)}`);
  }

  const { data: subscriptionRows } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const subscriptionStatus = subscriptionRows?.[0]?.status ?? null;
  const hasActiveSubscription = subscriptionStatus
    ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
    : false;

  const weekStarts = getUpcomingWeekStarts(4);
  const weekOptions = weekStarts.map((date) => ({
    value: formatDateYYYYMMDD(date),
    label: formatWeekLabel(date),
  }));

  const selectedWeek =
    weekOptions.find((option) => option.value === resolvedSearchParams?.week_of)?.value ??
    weekOptions[0]?.value;

  if (!selectedWeek) {
    return null;
  }

  const { data: windows } = await supabase
    .from("delivery_windows")
    .select("id, day_of_week, start_time, end_time, capacity")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select("id, delivery_window_id")
    .eq("week_of", selectedWeek);

  const counts = new Map<string, number>();
  for (const appointment of appointments ?? []) {
    const current = counts.get(appointment.delivery_window_id) ?? 0;
    counts.set(appointment.delivery_window_id, current + 1);
  }

  const { data: existingAppointment } = auth.user
    ? await supabase
        .from("delivery_appointments")
        .select("id, delivery_window_id")
        .eq("week_of", selectedWeek)
        .eq("user_id", auth.user.id)
        .maybeSingle()
    : { data: null };

  const cutoffDate = getCutoffForWeek(new Date(`${selectedWeek}T00:00:00Z`));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Schedule"
        description="Choose your weekend delivery window before the Friday 5 PM cutoff."
        cta={
          hasActiveSubscription ? (
            <Link
              href="/track"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              Track delivery
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary/90 to-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-primary/90 hover:via-primary hover:to-primary/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
            >
              Activate subscription
            </Link>
          )
        }
      />
      {!hasActiveSubscription ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          You need an active subscription to schedule deliveries. Subscribe first, then
          come back to pick your delivery window.
        </div>
      ) : null}
      {existingAppointment?.id ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div>
            <p className="text-sm font-medium">Upcoming appointment ready</p>
            <p className="text-xs text-muted-foreground">
              Review notes, address, or delivery window details.
            </p>
          </div>
          <Link
            href={`/appointment/${existingAppointment.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            View appointment
          </Link>
        </Card>
      ) : null}
      <SchedulingErrorBoundary>
        <SchedulePlanner
          weekOptions={weekOptions}
          selectedWeek={selectedWeek}
          windows={
            windows?.map((window) => ({
              ...window,
              available: Math.max(window.capacity - (counts.get(window.id) ?? 0), 0),
            })) ?? []
          }
          appointment={existingAppointment}
          cutoffAt={formatCutoff(cutoffDate)}
          isCutoffPassed={isAfterCutoff(new Date(`${selectedWeek}T00:00:00Z`))}
          nextEligibleWeekLabel={weekOptions[0]?.label}
          isSchedulingDisabled={!hasActiveSubscription}
        />
      </SchedulingErrorBoundary>
    </div>
  );
}
