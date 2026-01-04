"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CalendarPicker } from "@/components/schedule/calendar-picker";
import { DeliverySummaryCard } from "@/components/schedule/delivery-summary-card";
import { TimeSlotSelector } from "@/components/schedule/time-slot-selector";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { parseApiResponse } from "@/lib/api/client";
import { isAfterCutoff } from "@/lib/scheduling";

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
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isInteractionDisabled = isSchedulingDisabled || isPending;
  const selected = useMemo(
    () => windows.find((window) => window.id === selectedWindow),
    [selectedWindow, windows],
  );
  const selectedWeekIndex = useMemo(
    () => weekOptions.findIndex((option) => option.value === selectedWeek),
    [selectedWeek, weekOptions],
  );
  const nextWeekOption =
    selectedWeekIndex >= 0 && selectedWeekIndex + 1 < weekOptions.length
      ? weekOptions[selectedWeekIndex + 1]
      : weekOptions[0];

  const isFull = selected ? selected.available <= 0 : false;
  const availableWindows = windows.filter((window) => window.available > 0);
  const alternativeWindows = availableWindows.filter((window) => window.id !== selectedWindow);

  useEffect(() => {
    const windowIds = new Set(windows.map((window) => window.id));
    if (appointment?.delivery_window_id && windowIds.has(appointment.delivery_window_id)) {
      setSelectedWindow(appointment.delivery_window_id);
      return;
    }
    if (selectedWindow && windowIds.has(selectedWindow)) {
      return;
    }
    setSelectedWindow(windows[0]?.id ?? "");
  }, [appointment?.delivery_window_id, selectedWindow, windows]);

  const calendarWeeks = useMemo(
    () =>
      weekOptions.map((option) => {
        const date = new Date(`${option.value}T00:00:00Z`);
        return {
          ...option,
          date,
          isCutoffPassed: isAfterCutoff(date),
        };
      }),
    [weekOptions],
  );

  const selectedWeekLabel =
    weekOptions.find((option) => option.value === selectedWeek)?.label ?? selectedWeek;

  const selectedWindowLabel = selected
    ? `${selected.day_of_week} ${selected.start_time}–${selected.end_time}`
    : null;

  function handleWeekChange(value: string) {
    setError(null);
    setStatus(null);
    const params = new URLSearchParams();
    params.set("week_of", value);
    startTransition(() => {
      router.push(`/schedule?${params.toString()}`);
    });
  }

  async function handleSubmit() {
    if (isSaving) {
      return;
    }

    if (!selectedWindow) {
      setError("Select a delivery window to continue.");
      return;
    }

    setStatus(null);
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/delivery/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_of: selectedWeek,
          delivery_window_id: selectedWindow,
        }),
      });

      const result = await parseApiResponse<{ appointment: unknown }>(response);

      if (!result.ok) {
        setError(result.message);
        setStatus(null);
        toast({
          title: "Unable to save appointment",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      setStatus("Appointment saved!");
      toast({
        title: "Appointment saved",
        description: "Your delivery window is confirmed.",
      });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to save appointment.";
      setError(message);
      toast({
        title: "Unable to save appointment",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <CalendarPicker
          weeks={calendarWeeks}
          selectedWeek={selectedWeek}
          onSelect={handleWeekChange}
          disabled={isInteractionDisabled}
          helperText={
            nextEligibleWeekLabel
              ? `Next eligible week: ${nextEligibleWeekLabel}`
              : undefined
          }
        />
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Delivery windows</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Availability updates as other subscribers book.
          </p>
        </div>
        <TimeSlotSelector
          windows={windows}
          selectedWindow={selectedWindow}
          onSelect={(value) => {
            setSelectedWindow(value);
            setError(null);
          }}
          disabled={isInteractionDisabled || isSchedulingDisabled}
          nextWeekOption={
            nextWeekOption && nextWeekOption.value !== selectedWeek ? nextWeekOption : undefined
          }
          onSelectWeek={handleWeekChange}
        />
        {isFull ? (
          <p className="text-xs text-rose-600">
            Selected window is full. Try{" "}
            {alternativeWindows.length > 0
              ? alternativeWindows
                  .map(
                    (window) => `${window.day_of_week} ${window.start_time}–${window.end_time}`,
                  )
                  .join(", ")
              : "another week"}{" "}
            instead.
          </p>
        ) : null}
      </Card>

      <DeliverySummaryCard
        selectedWeekLabel={selectedWeekLabel}
        selectedWindowLabel={selectedWindowLabel}
        cutoffAt={cutoffAt}
        status={status}
        error={error}
        hasAppointment={Boolean(appointment)}
        isCutoffPassed={isCutoffPassed}
        isSchedulingDisabled={isSchedulingDisabled}
        isSaving={isSaving}
        confirmDisabled={
          !selectedWindow ||
          windows.length === 0 ||
          isFull ||
          isCutoffPassed ||
          isSchedulingDisabled ||
          isSaving
        }
        onConfirm={handleSubmit}
      />
    </div>
  );
}
