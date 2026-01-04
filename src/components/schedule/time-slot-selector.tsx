"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeliveryWindow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available: number;
};

type WeekOption = {
  value: string;
  label: string;
};

export type TimeSlotSelectorProps = {
  windows: DeliveryWindow[];
  selectedWindow: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  nextWeekOption?: WeekOption;
  onSelectWeek?: (value: string) => void;
};

function formatWindowLabel(window: DeliveryWindow) {
  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

export function TimeSlotSelector({
  windows,
  selectedWindow,
  onSelect,
  disabled,
  nextWeekOption,
  onSelectWeek,
}: TimeSlotSelectorProps) {
  if (windows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No delivery windows published yet.</p>
        <p className="mt-1">
          Try another week or check back once the operations team opens windows for this
          schedule.
        </p>
        {nextWeekOption && onSelectWeek ? (
          <Button
            className="mt-3"
            onClick={() => onSelectWeek(nextWeekOption.value)}
            disabled={disabled}
          >
            View {nextWeekOption.label}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {windows.map((window) => {
        const isSelected = window.id === selectedWindow;
        const isUnavailable = window.available <= 0;
        const isDisabled = disabled || isUnavailable;
        const availabilityPercent =
          window.capacity > 0 ? Math.round((window.available / window.capacity) * 100) : 0;

        return (
          <label
            key={window.id}
            className={cn(
              "flex cursor-pointer flex-col gap-3 rounded-lg border p-4 text-sm transition",
              isSelected
                ? "border-primary/80 bg-primary/10"
                : "border-border bg-background",
              isDisabled ? "cursor-not-allowed opacity-60" : "hover:border-primary/60"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">
                {formatWindowLabel(window)}
              </span>
              <input
                type="radio"
                name="delivery_window"
                value={window.id}
                checked={isSelected}
                onChange={() => onSelect(window.id)}
                disabled={isDisabled}
                className="h-4 w-4 text-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    availabilityPercent <= 20 ? "bg-rose-400" : "bg-primary"
                  )}
                  style={{ width: `${availabilityPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {window.available} of {window.capacity} slots remaining
                </span>
                {isUnavailable ? (
                  <span className="font-semibold text-rose-500">Full</span>
                ) : null}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
