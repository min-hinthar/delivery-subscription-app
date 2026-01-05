"use client";

import { useMemo, memo } from "react";
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

// Memoized timeline item for better performance with long routes
const TimelineItem = memo(
  ({
    stop,
    isCurrent,
    isCompleted,
  }: {
    stop: TrackingStop;
    isCurrent: boolean;
    isCompleted: boolean;
  }) => {
    return (
      <div className="flex items-start gap-3">
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
                  isCurrent ? "animate-pulse bg-emerald-500" : "bg-slate-400 dark:bg-slate-600",
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
            {isCompleted ? "Delivered" : isCurrent ? "On the way to this stop" : "Upcoming"}
          </p>
          {stop.isCustomerStop && stop.photoUrl && isCompleted ? (
            <div className="mt-2 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote storage URL not optimized. */}
              <img
                src={stop.photoUrl}
                alt="Delivery proof"
                className="max-h-40 w-full rounded-md border border-slate-200 object-cover dark:border-slate-800"
              />
              <a
                href={stop.photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-300"
              >
                View full-size photo
              </a>
            </div>
          ) : null}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {formatTime(stop.estimatedArrival)}
        </div>
      </div>
    );
  },
);

TimelineItem.displayName = "TimelineItem";

export function DeliveryTimeline({ stops, currentStopIndex, className }: DeliveryTimelineProps) {
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.stopOrder - b.stopOrder),
    [stops],
  );

  // For very long routes (>20 stops), only show nearby stops to improve performance
  const visibleStops = useMemo(() => {
    if (sortedStops.length <= 20) {
      return sortedStops;
    }

    // Always show customer's stop
    const customerStop = sortedStops.find((s) => s.isCustomerStop);
    const customerStopIndex = customerStop
      ? sortedStops.findIndex((s) => s.id === customerStop.id)
      : -1;

    // Show 5 stops before and 15 stops after current position (or customer stop if closer)
    const focusIndex = customerStopIndex >= 0 ? customerStopIndex : currentStopIndex;
    const startIndex = Math.max(0, focusIndex - 5);
    const endIndex = Math.min(sortedStops.length, focusIndex + 15);

    return sortedStops.slice(startIndex, endIndex);
  }, [sortedStops, currentStopIndex]);

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
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {sortedStops.length} stops
          </span>
          {sortedStops.length > 20 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (showing {visibleStops.length} nearby)
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {visibleStops.map((stop) => {
          const actualIndex = sortedStops.findIndex((s) => s.id === stop.id);
          const isCompleted = Boolean(stop.completedAt) || COMPLETED_STATUSES.has(stop.status);
          const isCurrent = !isCompleted && actualIndex === currentStopIndex;

          return (
            <TimelineItem
              key={stop.id}
              stop={stop}
              isCurrent={isCurrent}
              isCompleted={isCompleted}
            />
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
