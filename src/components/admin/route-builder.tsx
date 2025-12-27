"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
};

type RouteSummary = {
  id: string;
  status: string;
  polyline: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
};

export function RouteBuilder({ weekOptions, selectedWeek, appointments }: RouteBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stopOrders, setStopOrders] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    appointments.forEach((appointment, index) => {
      initial[appointment.id] = index + 1;
    });
    return initial;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [routeName, setRouteName] = useState("Weekend Route");
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  const orderedStops = useMemo(() => {
    return appointments
      .map((appointment) => ({
        appointment_id: appointment.id,
        order: stopOrders[appointment.id] ?? 0,
      }))
      .filter((stop) => stop.order > 0)
      .sort((a, b) => a.order - b.order);
  }, [appointments, stopOrders]);

  const missingAddressCount = useMemo(
    () => appointments.filter((appointment) => !appointment.hasAddress).length,
    [appointments],
  );

  const hasDuplicateOrders = useMemo(() => {
    const values = orderedStops.map((stop) => stop.order);
    return new Set(values).size !== values.length;
  }, [orderedStops]);

  const canBuild = orderedStops.length >= 1 && !hasDuplicateOrders && missingAddressCount === 0;

  function handleWeekChange(value: string) {
    startTransition(() => {
      router.replace(`/admin/routes?week_of=${value}`);
    });
  }

  async function fetchRouteSummary(weekOf: string, onUpdate: (data: RouteSummary | null) => void) {
    const response = await fetch(`/api/admin/routes/summary?week_of=${weekOf}`);
    const payload = await response.json();
    if (payload.ok) {
      onUpdate(payload.data.route);
    }
  }

  async function handleBuild() {
    if (!canBuild) {
      if (orderedStops.length < 1) {
        setStatus("Add at least one stop to build directions.");
      } else if (hasDuplicateOrders) {
        setStatus("Stop order values must be unique.");
      } else if (missingAddressCount > 0) {
        setStatus("Add delivery addresses for all stops before building.");
      }
      return;
    }

    setStatus(null);

    const response = await fetch("/api/admin/routes/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_of: selectedWeek,
        name: routeName,
        stop_order: orderedStops,
      }),
    });

    const payload = await response.json();

    if (!payload.ok) {
      setStatus(payload.error?.message ?? "Unable to build route.");
      return;
    }

    setStatus("Route created and directions synced.");
    if (payload.data?.route) {
      setRouteSummary(payload.data.route);
    } else {
      await fetchRouteSummary(selectedWeek, setRouteSummary);
    }
    await fetchRouteSummary(selectedWeek, setRouteSummary);
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchRouteSummary(selectedWeek, (data) => {
        if (active) {
          setRouteSummary(data);
        }
      });
    };
    void load();
    return () => {
      active = false;
    };
  }, [selectedWeek]);

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
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            {routeSummary?.status ?? "Draft"}
          </span>
        </div>
        <RouteMap polyline={routeSummary?.polyline ?? null} />
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Origin: {KITCHEN_ORIGIN}</span>
          <span>Distance: {routeSummary?.distance_meters ?? 0} m</span>
          <span>Duration: {routeSummary?.duration_seconds ?? 0} s</span>
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
                <p className="font-medium">{appointment.customer}</p>
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
