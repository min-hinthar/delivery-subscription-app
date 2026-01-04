"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

type EtaDisplayProps = {
  estimatedArrival: string | null;
  totalStops: number;
  completedStops: number;
  currentStopIndex: number;
  lastUpdated: Date | null;
  isReconnecting?: boolean;
  className?: string;
};

function formatMinutes(minutes: number) {
  if (minutes <= 1) {
    return "Arriving soon";
  }
  return `Arriving in ${minutes} minutes`;
}

export function EtaDisplay({
  estimatedArrival,
  totalStops,
  completedStops,
  currentStopIndex,
  lastUpdated,
  isReconnecting = false,
  className,
}: EtaDisplayProps) {
  const now = lastUpdated?.getTime() ?? 0;

  const etaLabel = useMemo(() => {
    if (!estimatedArrival || now === 0) {
      return "ETA updating";
    }

    const diffMs = new Date(estimatedArrival).getTime() - now;
    const minutes = Math.max(0, Math.round(diffMs / 60000));
    return formatMinutes(minutes);
  }, [estimatedArrival, now]);

  const progress = useMemo(() => {
    if (totalStops <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((completedStops / totalStops) * 100));
  }, [completedStops, totalStops]);

  const stopLabel = totalStops > 0 ? `Stop ${Math.max(currentStopIndex + 1, 1)} of ${totalStops}` : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Live ETA
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {etaLabel}
          </p>
          {stopLabel ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stopLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for updates"}
        </div>
      </div>

      <div className="mt-4 h-3 w-full rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{progress}% route complete</span>
        <span>Updates every ~10 seconds</span>
      </div>

      {isReconnecting ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          Reconnecting to live updates…
        </div>
      ) : null}
    </div>
  );
}
