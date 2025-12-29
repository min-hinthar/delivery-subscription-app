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

type StopDetail = Stop & {
  displayAddress: string;
  mapAddress: string;
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
  initialStops: StopDetail[];
};

export function TrackingDashboard({ route, initialStops }: TrackingDashboardProps) {
  const [stops, setStops] = useState<StopDetail[]>(initialStops);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
  >(route?.id ? "connecting" : "idle");
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.stop_order - b.stop_order),
    [stops],
  );

  const mapStops = useMemo(
    () =>
      sortedStops.map((stop, index) => ({
        label: String.fromCharCode(65 + index),
        address: stop.mapAddress,
      })),
    [sortedStops],
  );

  const distanceMiles = route?.distance_meters
    ? (route.distance_meters / 1609.34).toFixed(1)
    : "0";
  const durationSeconds = route?.duration_seconds ?? 0;
  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.round((durationSeconds % 3600) / 60);
  const durationLabel = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes}m`;

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
              return [
                ...prev,
                {
                  ...updated,
                  displayAddress: "Address pending",
                  mapAddress: "",
                },
              ];
            }
            return prev.map((stop) =>
              stop.id === updated.id ? { ...stop, ...updated } : stop,
            );
          });
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (channelStatus === "TIMED_OUT") {
          setConnectionStatus("reconnecting");
        } else if (channelStatus === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else if (channelStatus === "CLOSED") {
          setConnectionStatus("reconnecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [route?.id]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-900/70 dark:to-blue-950/30">
          <p className="font-medium">Route overview</p>
          <p className="text-slate-500 dark:text-slate-400">
            Status: {route?.status ?? "Pending"}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Distance: {route?.distance_meters ? `${distanceMiles} mi` : "TBD"}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Duration: {route?.duration_seconds ? durationLabel : "TBD"}
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
      {connectionStatus === "reconnecting" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          Reconnecting to live updates. We&apos;ll keep retrying in the background.
        </div>
      ) : null}
      {connectionStatus === "error" ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Live updates are temporarily unavailable. You can refresh this page to try again.
        </div>
      ) : null}

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
          <RouteMap polyline={route?.polyline ?? null} stops={mapStops} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Origin: {KITCHEN_ORIGIN}</span>
          <span>Distance: {distanceMiles} mi</span>
          <span>Duration: {durationLabel}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedStops.map((stop, index) => (
          <div
            key={stop.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-medium">Stop {String.fromCharCode(65 + index)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status: {stop.status}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stop.displayAddress}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ETA: {stop.eta ? new Date(stop.eta).toLocaleTimeString() : "TBD"}
            </span>
          </div>
        ))}
        {sortedStops.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-200">Tracking isn’t live yet.</p>
            <p className="mt-1">
              We’ll show your driver route here as soon as your stop is assigned. Check back
              closer to delivery day.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
