"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Card } from "@/components/ui/card";
import type { RouteStop } from "@/components/admin/route-builder-types";
import { RouteStopCard } from "@/components/admin/route-stop-card";
import { cn } from "@/lib/utils";

type UnassignedStopsProps = {
  stops: RouteStop[];
};

export function UnassignedStops({ stops }: UnassignedStopsProps) {
  const [dayFilter, setDayFilter] = useState("all");
  const [zipFilter, setZipFilter] = useState("all");
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  const dayOptions = useMemo(() => {
    const days = stops.map((stop) => stop.day).filter(Boolean) as string[];
    return Array.from(new Set(days));
  }, [stops]);

  const zipOptions = useMemo(() => {
    const zips = stops.map((stop) => stop.postalCode).filter(Boolean) as string[];
    return Array.from(new Set(zips));
  }, [stops]);

  const filteredStops = useMemo(() => {
    return stops.filter((stop) => {
      if (dayFilter !== "all" && stop.day !== dayFilter) {
        return false;
      }
      if (zipFilter !== "all" && stop.postalCode !== zipFilter) {
        return false;
      }
      return true;
    });
  }, [stops, dayFilter, zipFilter]);

  return (
    <Card className="space-y-4 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Unassigned stops
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
              {filteredStops.length} of {stops.length} stops {filteredStops.length === 1 ? "is" : "are"} waiting to be assigned.
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="day-filter"
            className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"
          >
            Day
            <select
              id="day-filter"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              aria-label="Filter stops by delivery day"
            >
              <option value="all">All days</option>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label
            htmlFor="zip-filter"
            className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"
          >
            ZIP code
            <select
              id="zip-filter"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={zipFilter}
              onChange={(event) => setZipFilter(event.target.value)}
              aria-label="Filter stops by ZIP code"
            >
              <option value="all">All ZIPs</option>
              {zipOptions.map((zip) => (
                <option key={zip} value={zip}>
                  {zip}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 rounded-lg border border-dashed border-slate-200 p-3 transition dark:border-slate-800",
          isOver && "border-blue-400 bg-blue-50/50 dark:border-blue-500/60 dark:bg-blue-950/30",
        )}
        role="list"
        aria-label="Unassigned delivery stops"
      >
        <SortableContext
          items={filteredStops.map((stop) => stop.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredStops.map((stop) => (
            <div key={stop.id} role="listitem">
              <RouteStopCard stop={stop} />
            </div>
          ))}
        </SortableContext>
        {filteredStops.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
            No stops match these filters.
          </p>
        ) : null}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Drag a stop into the route panel to assign it.
      </p>
    </Card>
  );
}
