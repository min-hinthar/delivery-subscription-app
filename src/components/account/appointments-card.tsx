import { Card } from "@/components/ui/card";
import { getCutoffForWeek, PT_TIME_ZONE } from "@/lib/scheduling";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

type Appointment = {
  id: string;
  week_of: string;
  status: string;
  delivery_window: {
    day_of_week: string | null;
    start_time: string | null;
    end_time: string | null;
  } | null;
};

type RouteSummary = {
  polyline: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
};

type AppointmentsCardProps = {
  appointments: Appointment[];
  route?: RouteSummary | null;
};

function formatWeek(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    timeZone: PT_TIME_ZONE,
    month: "short",
    day: "numeric",
  });
}

function formatCutoff(date: string) {
  const cutoff = getCutoffForWeek(new Date(`${date}T00:00:00Z`));
  return cutoff.toLocaleString("en-US", {
    timeZone: PT_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatWindow(window: Appointment["delivery_window"]) {
  if (!window?.day_of_week || !window.start_time || !window.end_time) {
    return "Window TBD";
  }

  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

export function AppointmentsCard({ appointments, route }: AppointmentsCardProps) {
  return (
    <Card className="space-y-4 bg-gradient-to-br from-white/90 via-white to-rose-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-rose-950/20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Upcoming deliveries</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep tabs on your scheduled delivery windows and cutoff times.
          </p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 shadow-sm dark:bg-rose-900/40 dark:text-rose-200">
          {appointments.length} scheduled
        </span>
      </div>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No appointments yet. Pick a delivery window to get started.
          </p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white/80 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Week of {formatWeek(appointment.week_of)}
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {formatWindow(appointment.delivery_window)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cutoff {formatCutoff(appointment.week_of)} PT
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  STATUS_STYLES[appointment.status] ??
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {appointment.status ?? "scheduled"}
              </span>
            </div>
          ))
        )}
      </div>
      {route ? (
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Route distance: {route.distance_meters ?? 0} m</span>
          <span>Route duration: {route.duration_seconds ?? 0} s</span>
        </div>
      ) : null}
      <p className="text-xs text-slate-400">
        Cutoff times are calculated in Pacific Time and lock at Friday 5:00 PM PT.
      </p>
    </Card>
  );
}

export type { Appointment as ScheduledAppointment };
