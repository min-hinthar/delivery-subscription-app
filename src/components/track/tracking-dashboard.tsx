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
  const polyline = route?.polyline ?? null;

  const mapImage = useMemo(() => {
    if (!polyline) {
      return null;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!apiKey) {
      return null;
    }

    const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
    url.searchParams.set("size", "640x360");
    url.searchParams.set("scale", "2");
    url.searchParams.set("maptype", "roadmap");
    url.searchParams.set("path", `weight:4|color:0x3b82f6|enc:${polyline}`);
    url.searchParams.set("key", apiKey);

    return url.toString();
  }, [polyline]);

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
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          {mapImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapImage} alt="Delivery route map" className="h-full w-full" />
          ) : (
            <div className="flex h-56 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              Map preview unavailable. Add NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY and build
              routes.
            </div>
          )}
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
