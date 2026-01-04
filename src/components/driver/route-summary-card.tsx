import Link from "next/link";
import { MapPin, Route, Timer } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DriverRouteSummary } from "@/lib/driver/route-summary";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
};

export function RouteSummaryCard({ route }: { route: DriverRouteSummary }) {
  const badgeStyle = STATUS_STYLES[route.status] ?? STATUS_STYLES.pending;
  const remainingStops = Math.max(route.stop_count - route.completed_count, 0);

  return (
    <Card className="space-y-4 border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-foreground">{route.name}</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {route.stop_count} stops • {remainingStops} remaining
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", badgeStyle)}>
          {route.status}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span>
            {route.start_time
              ? `Start ${new Date(route.start_time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Start time pending"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span>
            {route.next_stop
              ? `Next: ${route.next_stop.address}`
              : "No remaining stops"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/driver/route/${route.id}`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          View route
        </Link>
      </div>
    </Card>
  );
}
