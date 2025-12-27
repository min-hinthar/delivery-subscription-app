"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RouteMap } from "@/components/maps/route-map";
import { KITCHEN_ORIGIN } from "@/lib/maps/route";

type Stop = {
  id: string;
  stop_order: number;
  status: string;
  eta: string | null;
};

type RouteSummary = {
  id: string;
  status: string;
  polyline: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
};

type TrackingDashboardProps = {
  route: RouteSummary | null;
  initialStops: Stop[];
};

export function TrackingDashboard({ route, initialStops }: TrackingDashboardProps) {
  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [status, setStatus] = useState<string | null>(null);
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.stop_order - b.stop_order),
    [stops],
  );

  useEffect(() => {
    if (!route?.id) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("delivery-stops")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_stops",
          filter: `route_id=eq.${route.id}`,
        },
        (payload) => {
          setStatus("Live update received.");
          const updated = payload.new as Stop;
          setStops((prev) => {
            const existing = prev.find((stop) => stop.id === updated.id);
            if (!existing) {
              return [...prev, updated];
            }
            return prev.map((stop) => (stop.id === updated.id ? updated : stop));
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [route?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Track delivery</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Follow your driver progress and upcoming stop ETAs in real time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-900/70 dark:to-blue-950/30">
          <p className="font-medium">Route overview</p>
          <p className="text-slate-500 dark:text-slate-400">
            Status: {route?.status ?? "Pending"}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Distance: {route?.distance_meters ? `${route.distance_meters} m` : "TBD"}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Duration: {route?.duration_seconds ? `${route.duration_seconds} s` : "TBD"}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {route?.polyline ? "Live route synced from operations." : "Waiting for route build."}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white via-amber-50/80 to-rose-50/70 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-amber-950/30 dark:to-rose-950/30">
          <p className="font-medium">Realtime updates</p>
          <p className="text-slate-500 dark:text-slate-400">
            {status ?? "Waiting for driver updates."}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            We&apos;ll refresh ETAs as each stop status changes.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Delivery map
          </p>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            {sortedStops.length} stops
          </span>
        </div>
        <div className="mt-3">
          <RouteMap polyline={route?.polyline ?? null} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Origin: {KITCHEN_ORIGIN}</span>
          <span>Distance: {route?.distance_meters ?? 0} m</span>
          <span>Duration: {route?.duration_seconds ?? 0} s</span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedStops.map((stop) => (
          <div
            key={stop.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-medium">Stop {stop.stop_order}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status: {stop.status}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ETA: {stop.eta ? new Date(stop.eta).toLocaleTimeString() : "TBD"}
            </span>
          </div>
        ))}
        {sortedStops.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tracking data available yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
