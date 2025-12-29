"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { RouteMap } from "@/components/maps/route-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KITCHEN_ORIGIN } from "@/lib/maps/route";

type Appointment = {
  id: string;
  customer: string;
  window: string;
  address: string;
  hasAddress: boolean;
};

type RouteBuilderProps = {
  weekOptions: string[];
  selectedWeek: string;
  appointments: Appointment[];
  initialRoutes: RouteSummary[];
};

type RouteSummary = {
  id: string;
  status: string;
  name?: string | null;
  polyline: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  created_at?: string;
};

export function RouteBuilder({
  weekOptions,
  selectedWeek,
  appointments,
  initialRoutes,
}: RouteBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stopOrders, setStopOrders] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [routeName, setRouteName] = useState("Weekend Route");
  const [routes, setRoutes] = useState<RouteSummary[]>(() => initialRoutes ?? []);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [optimizeRoute, setOptimizeRoute] = useState(true);
  const [routeStops, setRouteStops] = useState<
    Array<{ appointment_id: string; stop_order: number; address: string; name: string }>
  >([]);
  const routeSummary = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );
  const activeRouteStops = useMemo(
    () => (routeSummary ? routeStops : []),
    [routeStops, routeSummary],
  );

  const orderedStops = useMemo(() => {
    return appointments
      .map((appointment) => ({
        appointment_id: appointment.id,
        order: stopOrders[appointment.id] ?? 0,
      }))
      .filter((stop) => stop.order > 0)
      .sort((a, b) => a.order - b.order);
  }, [appointments, stopOrders]);

  const stopLabels = useMemo(() => {
    if (activeRouteStops.length === 0) {
      return [];
    }
    return activeRouteStops.map((stop) => ({
      label: String(stop.stop_order),
      address: stop.address,
    }));
  }, [activeRouteStops]);

  const stopLabelByAppointment = useMemo(() => {
    if (activeRouteStops.length === 0) {
      return new Map<string, string>();
    }
    return new Map(
      activeRouteStops.map((stop) => [stop.appointment_id, String(stop.stop_order)]),
    );
  }, [activeRouteStops]);

  const prebuildStops = useMemo(() => {
    if (routeSummary || activeRouteStops.length > 0) {
      return [];
    }
    return appointments
      .filter((appointment) => appointment.address)
      .map((appointment) => {
        const initials = appointment.customer
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("");
        return {
          label: initials || "S",
          address: appointment.address,
        };
      });
  }, [appointments, activeRouteStops.length, routeSummary]);

  const shareUrl = useMemo(() => {
    if (!routeSummary || activeRouteStops.length === 0) {
      return null;
    }

    const sortedStops = [...activeRouteStops].sort((a, b) => a.stop_order - b.stop_order);
    const origin = encodeURIComponent(KITCHEN_ORIGIN);
    const destination = encodeURIComponent(sortedStops[sortedStops.length - 1].address);
    const waypointAddresses = sortedStops
      .slice(0, -1)
      .map((stop) => stop.address)
      .filter(Boolean);

    const waypointParam = waypointAddresses.length
      ? `&waypoints=${encodeURIComponent(waypointAddresses.join("|"))}`
      : "";

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointParam}`;
  }, [activeRouteStops, routeSummary]);

  const missingAddressCount = useMemo(
    () => appointments.filter((appointment) => !appointment.hasAddress).length,
    [appointments],
  );

  const hasDuplicateOrders = useMemo(() => {
    const values = orderedStops.map((stop) => stop.order);
    return new Set(values).size !== values.length;
  }, [orderedStops]);

  const hasManualOrderInput = useMemo(
    () => Object.values(stopOrders).some((value) => Number.isFinite(value) && value > 0),
    [stopOrders],
  );
  const hasCompleteManualOrder =
    !optimizeRoute && orderedStops.length === appointments.length && orderedStops.length > 0;
  const canBuild =
    appointments.length >= 1 &&
    missingAddressCount === 0 &&
    (optimizeRoute || (hasCompleteManualOrder && !hasDuplicateOrders));

  const distanceMiles = routeSummary?.distance_meters
    ? (routeSummary.distance_meters / 1609.34).toFixed(1)
    : "0";
  const durationSeconds = routeSummary?.duration_seconds ?? 0;
  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.round((durationSeconds % 3600) / 60);
  const durationLabel = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes}m`;

  function handleWeekChange(value: string) {
    startTransition(() => {
      router.replace(`/admin/routes?week_of=${value}`);
    });
  }

  async function fetchRouteStops(routeId: string) {
    try {
      const response = await fetch(`/api/admin/routes/stops?route_id=${routeId}`);
      const payload = await response.json();
      if (payload.ok) {
        setRouteStops(payload.data.stops ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function buildStopOrderPayload() {
    if (!optimizeRoute && orderedStops.length === 0) {
      return [];
    }

    if (optimizeRoute && !hasManualOrderInput) {
      return appointments.map((appointment, index) => ({
        appointment_id: appointment.id,
        order: index + 1,
      }));
    }

    return orderedStops;
  }

  async function handleBuild() {
    if (!canBuild) {
      if (!optimizeRoute && orderedStops.length < 1) {
        setStatus("Enter a stop order for each appointment.");
      } else if (!optimizeRoute && hasDuplicateOrders) {
        setStatus("Stop order values must be unique.");
      } else if (missingAddressCount > 0) {
        setStatus("Add delivery addresses for all stops before building.");
      }
      return;
    }

    setStatus(null);

    try {
      const response = await fetch("/api/admin/routes/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_of: selectedWeek,
          name: routeName,
          optimize: optimizeRoute,
          stop_order: buildStopOrderPayload(),
        }),
      });

      const payload = await response.json();

      if (!payload.ok) {
        setStatus(payload.error?.message ?? "Unable to build route.");
        return;
      }

      setStatus("Route created and directions synced.");
      if (payload.data?.route) {
        setRoutes((prev) => [payload.data.route, ...prev]);
        setSelectedRouteId(payload.data.route.id);
        setRouteStops([]);
        if (payload.data?.ordered_stop_ids) {
          const reordered: Record<string, number> = {};
          payload.data.ordered_stop_ids.forEach((id: string, index: number) => {
            reordered[id] = index + 1;
          });
          setStopOrders(reordered);
        }
        await fetchRouteStops(payload.data.route.id);
      } else {
        setStatus("Route saved, but details are unavailable.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Unable to build route. Check server logs for details.");
    }
  }

  async function handleDeleteRoute() {
    if (!selectedRouteId) {
      return;
    }

    const confirmed = window.confirm("Delete this saved route? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/admin/routes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: selectedRouteId }),
      });
      const payload = await response.json();
      if (!payload.ok) {
        setStatus(payload.error?.message ?? "Unable to delete route.");
        return;
      }
      setRoutes((prev) => prev.filter((route) => route.id !== selectedRouteId));
      setSelectedRouteId(null);
      setRouteStops([]);
      setStatus("Route deleted.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to delete route. Check server logs for details.");
    }
  }

  function handleSelectRoute(routeId: string | null) {
    setSelectedRouteId(routeId);
    setRouteStops([]);
    setStopOrders({});
    if (routeId) {
      void fetchRouteStops(routeId);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Route planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Order stops and build directions for the delivery week.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex flex-col gap-1 font-medium">
            Week of
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={selectedWeek}
              onChange={(event) => handleWeekChange(event.target.value)}
              disabled={isPending}
            >
              {weekOptions.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Route name
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
            />
          </label>
          <div className="flex items-end">
            <Button onClick={handleBuild} disabled={!canBuild}>
              Build directions
            </Button>
          </div>
          <div className="flex items-end">
            {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={optimizeRoute}
            onChange={(event) => setOptimizeRoute(event.target.checked)}
          />
          Recommend fastest order (Google Maps optimization)
        </label>
        {optimizeRoute ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manual stop order is optional while optimization is enabled.
          </p>
        ) : null}
        {missingAddressCount > 0 ? (
          <p className="text-xs text-rose-600">
            Add a delivery address for every appointment before building a route.
          </p>
        ) : null}
        {hasDuplicateOrders ? (
          <p className="text-xs text-amber-600">
            Stop order values must be unique.
          </p>
        ) : null}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Routes always start from {KITCHEN_ORIGIN}.
        </p>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Route map</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Directions sync after routes are built.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Saved routes
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={selectedRouteId ?? ""}
              onChange={(event) => handleSelectRoute(event.target.value || null)}
            >
              <option value="">Select a saved route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name ?? "Weekend Route"} ·{" "}
                  {route.created_at ? new Date(route.created_at).toLocaleString() : route.status}
                </option>
              ))}
            </select>
          </label>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            {routeSummary?.status ?? "Draft"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Button
            onClick={handleDeleteRoute}
            disabled={!selectedRouteId}
            className="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-200"
          >
            Delete saved route
          </Button>
          {shareUrl ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
            >
              Share Google Maps trip
            </a>
          ) : null}
        </div>
        <RouteMap
          polyline={routeSummary?.polyline ?? null}
          stops={stopLabels.length > 0 ? stopLabels : prebuildStops}
        />
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Origin: {KITCHEN_ORIGIN}</span>
          <span>Distance: {distanceMiles} mi</span>
          <span>Duration: {durationLabel}</span>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Stops</h2>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-medium">
                  {stopLabelByAppointment.has(appointment.id)
                    ? `${stopLabelByAppointment.get(appointment.id)} · `
                    : ""}
                  {appointment.customer}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {appointment.window}
                </p>
                <p
                  className={`text-xs ${
                    appointment.hasAddress
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-rose-600"
                  }`}
                >
                  {appointment.hasAddress ? appointment.address : "Missing address"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium">
                Stop order
                <input
                  type="number"
                  min={1}
                  disabled={optimizeRoute}
                  className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  value={stopOrders[appointment.id] ?? ""}
                  onChange={(event) =>
                    setStopOrders((prev) => ({
                      ...prev,
                      [appointment.id]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
          ))}
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No appointments scheduled yet.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
