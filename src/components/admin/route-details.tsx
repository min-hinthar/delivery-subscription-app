"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RouteStopCard } from "@/components/admin/route-stop-card";
import type { DriverOption, RouteMetrics, RouteStop } from "@/components/admin/route-builder-types";
import { cn } from "@/lib/utils";

type RouteDetailsProps = {
  stops: RouteStop[];
  metrics: RouteMetrics;
  driverOptions: DriverOption[];
  driverId: string;
  startTime: string;
  optimized: boolean;
  isSaving: boolean;
  statusMessage: string | null;
  onDriverChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onOptimize: () => void;
  onSave: () => void;
  onExport: () => void;
};

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

export function RouteDetails({
  stops,
  metrics,
  driverOptions,
  driverId,
  startTime,
  optimized,
  isSaving,
  statusMessage,
  onDriverChange,
  onStartTimeChange,
  onOptimize,
  onSave,
  onExport,
}: RouteDetailsProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "route" });
  const distanceMiles = useMemo(() => (metrics.distanceMeters / 1609.34).toFixed(1), [metrics]);
  const durationLabel = useMemo(
    () => formatDuration(metrics.durationSeconds),
    [metrics.durationSeconds],
  );

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Route details</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assign driver, adjust start time, and finalize the route.
        </p>
      </div>

      <div className="grid gap-3 text-xs">
        <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">Stops</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {stops.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">Distance</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {metrics.distanceMeters > 0 ? `${distanceMiles} mi` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">Duration</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {metrics.durationSeconds > 0 ? durationLabel : "—"}
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Driver assignment
        <select
          className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
          value={driverId}
          onChange={(event) => onDriverChange(event.target.value)}
        >
          <option value="">Select driver</option>
          {driverOptions.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Start time
        <input
          type="time"
          className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={onOptimize}
          disabled={stops.length < 2}
        >
          Optimize route
        </Button>
        <Button onClick={onSave} disabled={!optimized || stops.length === 0 || isSaving}>
          {isSaving ? "Saving..." : "Save route"}
        </Button>
        <Button variant="ghost" onClick={onExport} disabled={!optimized}>
          Export PDF
        </Button>
      </div>

      {statusMessage ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{statusMessage}</p>
      ) : null}

      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Stop sequence</span>
          <span className={cn(
            "rounded-full px-2 py-0.5",
            optimized
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
          )}>
            {optimized ? "Optimized" : "Needs optimization"}
          </span>
        </div>
        <div
          ref={setNodeRef}
          className={cn(
            "mt-3 space-y-3 rounded-lg border border-dashed border-slate-200 p-3 transition dark:border-slate-800",
            isOver && "border-blue-400 bg-blue-50/50 dark:border-blue-500/60 dark:bg-blue-950/30",
          )}
        >
          <SortableContext items={stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
            {stops.map((stop, index) => (
              <RouteStopCard key={stop.id} stop={stop} index={index} showIndex />
            ))}
          </SortableContext>
          {stops.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag stops here to start building a route.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
