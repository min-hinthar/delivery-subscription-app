"use client";

import { useMemo, useState } from "react";
import { Phone, Navigation } from "lucide-react";

import { ButtonV2 } from "@/components/ui/button-v2";
import { Card } from "@/components/ui/card";
import { LocationTracker } from "@/components/driver/location-tracker";
import { StopActions } from "@/components/driver/stop-actions";
import { cn } from "@/lib/utils";

type DriverRoute = {
  id: string;
  name: string | null;
  status: string;
  startTime: string | null;
  endTime: string | null;
};

export type DriverStop = {
  id: string;
  stopOrder: number;
  status: string;
  estimatedArrival: string | null;
  completedAt: string | null;
  address: string;
  instructions: string | null;
  customerName: string;
  customerPhone: string | null;
  driverNotes: string | null;
  photoUrl: string | null;
};

type RouteViewProps = {
  route: DriverRoute;
  stops: DriverStop[];
};

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);

function formatTime(value: string | null) {
  if (!value) {
    return "ETA updating";
  }
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function buildNavigationUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(
    address,
  )}`;
}

export function RouteView({ route, stops }: RouteViewProps) {
  const [routeStatus, setRouteStatus] = useState(route.status);
  const [routeStartTime, setRouteStartTime] = useState(route.startTime);
  const [routeEndTime, setRouteEndTime] = useState(route.endTime);
  const [routeStops, setRouteStops] = useState(stops);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [isUpdatingRoute, setIsUpdatingRoute] = useState(false);

  const sortedStops = useMemo(
    () => [...routeStops].sort((a, b) => a.stopOrder - b.stopOrder),
    [routeStops],
  );
  const remainingStops = useMemo(
    () => sortedStops.filter((stop) => !COMPLETED_STATUSES.has(stop.status)),
    [sortedStops],
  );
  const nextStop = remainingStops[0] ?? null;

  async function updateRouteStatus(nextStatus: "active" | "completed") {
    setIsUpdatingRoute(true);
    setRouteMessage(null);
    try {
      const response = await fetch("/api/driver/route-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: route.id, status: nextStatus }),
      });
      const payload = await response.json();
      if (!payload.ok) {
        setRouteMessage(payload.error?.message ?? "Unable to update route status.");
        setIsUpdatingRoute(false);
        return;
      }

      setRouteStatus(nextStatus);
      setRouteStartTime(payload.data?.start_time ?? routeStartTime);
      setRouteEndTime(payload.data?.end_time ?? routeEndTime);
      setRouteMessage(nextStatus === "active" ? "Route started." : "Route completed.");
    } catch {
      setRouteMessage("Unable to update route status.");
    } finally {
      setIsUpdatingRoute(false);
    }
  }

  function handleStopUpdate(stopId: string, update: { status: string; driverNotes: string | null; photoUrl: string | null }) {
    setRouteStops((prev) =>
      prev.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              status: update.status,
              driverNotes: update.driverNotes,
              photoUrl: update.photoUrl,
              completedAt: update.status === "completed" ? new Date().toISOString() : stop.completedAt,
            }
          : stop,
      ),
    );
  }

  const isActive = routeStatus === "active";

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              Driver route
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {route.name ?? "Weekend Route"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sortedStops.length} stops · Next update in 10 seconds while active
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                routeStatus === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : routeStatus === "completed"
                    ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
              )}
            >
              {routeStatus}
            </span>
            {routeStatus !== "active" && routeStatus !== "completed" ? (
              <ButtonV2
                size="sm"
                onClick={() => void updateRouteStatus("active")}
                disabled={isUpdatingRoute}
              >
                Start route
              </ButtonV2>
            ) : null}
            {routeStatus === "active" ? (
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() => void updateRouteStatus("completed")}
                disabled={isUpdatingRoute}
              >
                End route
              </ButtonV2>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-700 dark:text-slate-200">Start time</div>
            <div>{formatDateTime(routeStartTime)}</div>
          </div>
          <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-700 dark:text-slate-200">End time</div>
            <div>{formatDateTime(routeEndTime)}</div>
          </div>
          <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-700 dark:text-slate-200">Remaining</div>
            <div>{remainingStops.length} stops</div>
          </div>
        </div>

        {routeMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {routeMessage}
          </div>
        ) : null}
      </Card>

      <LocationTracker routeId={route.id} isActive={isActive} />

      {nextStop ? (
        <Card className="space-y-4 border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Next stop
              </p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Stop {nextStop.stopOrder} · {nextStop.customerName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{nextStop.address}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ETA {formatTime(nextStop.estimatedArrival)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonV2 asChild size="sm">
                <a href={buildNavigationUrl(nextStop.address)} target="_blank" rel="noreferrer">
                  <Navigation className="mr-2 h-4 w-4" /> Navigate
                </a>
              </ButtonV2>
              {nextStop.customerPhone ? (
                <ButtonV2 asChild size="sm" variant="outline">
                  <a href={`tel:${nextStop.customerPhone}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call
                  </a>
                </ButtonV2>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {sortedStops.map((stop) => {
          const isCompleted = COMPLETED_STATUSES.has(stop.status);
          return (
            <Card
              key={stop.id}
              className={cn(
                "space-y-4 border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60",
                isCompleted
                  ? "opacity-75"
                  : "ring-1 ring-transparent hover:ring-emerald-200 dark:hover:ring-emerald-900/60",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Stop {stop.stopOrder}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300",
                      )}
                    >
                      {isCompleted ? "Delivered" : stop.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{stop.customerName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stop.address}</p>
                  {stop.instructions ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Instructions: {stop.instructions}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>ETA {formatTime(stop.estimatedArrival)}</span>
                  {stop.completedAt ? <span>Completed {formatTime(stop.completedAt)}</span> : null}
                  <div className="flex gap-2">
                    <ButtonV2 asChild size="sm" variant="outline">
                      <a href={buildNavigationUrl(stop.address)} target="_blank" rel="noreferrer">
                        Navigate
                      </a>
                    </ButtonV2>
                    {stop.customerPhone ? (
                      <ButtonV2 asChild size="sm" variant="outline">
                        <a href={`tel:${stop.customerPhone}`}>Call</a>
                      </ButtonV2>
                    ) : null}
                  </div>
                </div>
              </div>

              {!isCompleted ? (
                <StopActions
                  stopId={stop.id}
                  status={stop.status}
                  driverNotes={stop.driverNotes}
                  photoUrl={stop.photoUrl}
                  onUpdate={(update) => handleStopUpdate(stop.id, update)}
                />
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
