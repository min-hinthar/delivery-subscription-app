"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Appointment = {
  id: string;
  customer: string;
  window: string;
  address: string;
};

type RouteBuilderProps = {
  weekOptions: string[];
  selectedWeek: string;
  appointments: Appointment[];
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

  const orderedStops = useMemo(() => {
    return appointments
      .map((appointment) => ({
        appointment_id: appointment.id,
        order: stopOrders[appointment.id] ?? 0,
      }))
      .filter((stop) => stop.order > 0)
      .sort((a, b) => a.order - b.order);
  }, [appointments, stopOrders]);

  function handleWeekChange(value: string) {
    startTransition(() => {
      router.replace(`/admin/routes?week_of=${value}`);
    });
  }

  async function handleBuild() {
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
            <Button onClick={handleBuild} disabled={orderedStops.length < 2}>
              Build directions
            </Button>
          </div>
          <div className="flex items-end">
            {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
          </div>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {appointment.address}
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
