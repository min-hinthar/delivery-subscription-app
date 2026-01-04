"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrackingStop } from "@/components/track/tracking-dashboard";

type DeliveryTimelineProps = {
  stops: TrackingStop[];
  currentStopIndex: number;
  className?: string;
};

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);

function formatTime(value: string | null) {
  if (!value) {
    return "ETA updating";
  }
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DeliveryTimeline({ stops, currentStopIndex, className }: DeliveryTimelineProps) {
  const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Delivery timeline
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track completed, current, and upcoming stops.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {sortedStops.length} stops
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {sortedStops.map((stop, index) => {
          const isCompleted = Boolean(stop.completedAt) || COMPLETED_STATUSES.has(stop.status);
          const isCurrent = !isCompleted && index === currentStopIndex;

          return (
            <div key={stop.id} className="flex items-start gap-3">
              <div className="mt-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      isCurrent
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                        : "border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-2 w-2 rounded-full",
                        isCurrent
                          ? "animate-pulse bg-emerald-500"
                          : "bg-slate-400 dark:bg-slate-600",
                      )}
                    />
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {stop.isCustomerStop ? "Your delivery" : `Stop ${stop.stopOrder}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isCompleted
                    ? "Delivered"
                    : isCurrent
                    ? "On the way to this stop"
                    : "Upcoming"}
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {formatTime(stop.estimatedArrival)}
              </div>
            </div>
          );
        })}
        {sortedStops.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            We’ll show your route timeline once a driver is assigned.
          </div>
        ) : null}
      </div>
    </div>
  );
}
