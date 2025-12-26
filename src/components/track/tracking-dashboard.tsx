"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
        <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
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
          {route?.polyline ? (
            <p className="mt-2 break-all text-xs text-slate-400">
              Polyline: {route.polyline}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
          <p className="font-medium">Realtime updates</p>
          <p className="text-slate-500 dark:text-slate-400">
            {status ?? "Waiting for driver updates."}
          </p>
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
