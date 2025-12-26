import { SchedulePlanner } from "@/components/schedule/schedule-planner";
import {
  formatDateYYYYMMDD,
  getCutoffForWeek,
  getUpcomingWeekStarts,
  isAfterCutoff,
  PT_TIME_ZONE,
} from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  searchParams?: { week_of?: string };
}) {
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
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Sign in to schedule deliveries</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Your appointment schedule is tied to your subscriber account.
        </p>
        <div className="flex justify-center">
          <a
            href="/login"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }
  const weekStarts = getUpcomingWeekStarts(4);
  const weekOptions = weekStarts.map((date) => ({
    value: formatDateYYYYMMDD(date),
    label: formatWeekLabel(date),
  }));

  const selectedWeek =
    weekOptions.find((option) => option.value === searchParams?.week_of)?.value ??
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
        .select("delivery_window_id")
        .eq("week_of", selectedWeek)
        .eq("user_id", auth.user.id)
        .maybeSingle()
    : { data: null };

  const cutoffDate = getCutoffForWeek(new Date(`${selectedWeek}T00:00:00Z`));

  return (
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
    />
  );
}
