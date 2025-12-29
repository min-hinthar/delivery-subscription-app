"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WeekOption = {
  value: string;
  label: string;
};

type DeliveryWindow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available: number;
};

type Appointment = {
  delivery_window_id: string | null;
};

type SchedulePlannerProps = {
  weekOptions: WeekOption[];
  selectedWeek: string;
  windows: DeliveryWindow[];
  appointment: Appointment | null;
  cutoffAt: string;
  isCutoffPassed: boolean;
  nextEligibleWeekLabel?: string;
  isSchedulingDisabled?: boolean;
};

export function SchedulePlanner({
  weekOptions,
  selectedWeek,
  windows,
  appointment,
  cutoffAt,
  isCutoffPassed,
  nextEligibleWeekLabel,
  isSchedulingDisabled = false,
}: SchedulePlannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedWindow, setSelectedWindow] = useState(
    appointment?.delivery_window_id ?? windows[0]?.id ?? "",
  );
  const [status, setStatus] = useState<string | null>(null);

  const isInteractionDisabled = isSchedulingDisabled || isPending;
  const selected = useMemo(
    () => windows.find((window) => window.id === selectedWindow),
    [selectedWindow, windows],
  );

  const isFull = selected ? selected.available <= 0 : false;

  function handleWeekChange(value: string) {
    const params = new URLSearchParams();
    params.set("week_of", value);
    startTransition(() => {
      router.push(`/schedule?${params.toString()}`);
    });
  }

  async function handleSubmit() {
    if (!selectedWindow) {
      return;
    }

    setStatus(null);

    const response = await fetch("/api/delivery/appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_of: selectedWeek,
        delivery_window_id: selectedWindow,
      }),
    });

    const payload = await response.json();

    if (!payload.ok) {
      setStatus(payload.error?.message ?? "Unable to save appointment.");
      return;
    }

    setStatus("Appointment saved!");
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold">Schedule delivery</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a weekend delivery window before the Friday 5PM PT cutoff.
          </p>
          {nextEligibleWeekLabel ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Next eligible week: {nextEligibleWeekLabel}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Week of
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
              value={selectedWeek}
              onChange={(event) => handleWeekChange(event.target.value)}
              disabled={isInteractionDisabled}
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Cutoff</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {cutoffAt}
            </span>
            {isCutoffPassed ? (
              <span className="text-xs text-rose-600">
                Cutoff passed — contact support for changes.
              </span>
            ) : null}
            {isSchedulingDisabled ? (
              <span className="text-xs text-rose-600">
                Subscription required — activate a plan to schedule deliveries.
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Delivery windows</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Availability updates as other subscribers book.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {windows.map((window) => {
            const isSelected = window.id === selectedWindow;
            const isUnavailable = window.available <= 0;
            return (
              <label
                key={window.id}
                className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 text-sm transition ${
                  isSelected
                    ? "border-slate-900 bg-slate-50 dark:border-slate-200 dark:bg-slate-900"
                    : "border-slate-200 dark:border-slate-800"
                } ${
                  isUnavailable || isSchedulingDisabled
                    ? "opacity-60"
                    : "hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {window.day_of_week} {window.start_time}–{window.end_time}
                  </span>
                  <input
                    type="radio"
                    name="delivery_window"
                    value={window.id}
                    checked={isSelected}
                    onChange={() => setSelectedWindow(window.id)}
                    disabled={isUnavailable || isSchedulingDisabled}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {window.available} of {window.capacity} slots remaining
                </span>
              </label>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!selectedWindow || isFull || isCutoffPassed || isSchedulingDisabled}
          >
            {appointment ? "Update appointment" : "Confirm appointment"}
          </Button>
          {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
          {isFull ? (
            <p className="text-xs text-rose-600">Selected window is full.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
