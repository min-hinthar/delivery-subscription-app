"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateYYYYMMDD } from "@/lib/scheduling";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

type CalendarWeek = {
  value: string;
  label: string;
  date: Date;
  isCutoffPassed: boolean;
};

export type CalendarPickerProps = {
  weeks: CalendarWeek[];
  selectedWeek: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthDays(currentMonth: Date) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days: Array<Date | null> = [];

  for (let i = 0; i < start.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  }

  return days;
}

export function CalendarPicker({
  weeks,
  selectedWeek,
  onSelect,
  disabled,
  helperText,
}: CalendarPickerProps) {
  const selectedDate = React.useMemo(() => {
    const selected = weeks.find((week) => week.value === selectedWeek)?.date;
    return selected ?? weeks[0]?.date ?? new Date();
  }, [selectedWeek, weeks]);

  const [viewMonth, setViewMonth] = React.useState<Date>(() => startOfMonth(selectedDate));

  React.useEffect(() => {
    setViewMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const weeksByDate = React.useMemo(() => {
    return new Map(weeks.map((week) => [formatDateYYYYMMDD(week.date), week]));
  }, [weeks]);

  const days = React.useMemo(() => getMonthDays(viewMonth), [viewMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Pick a delivery weekend</h3>
          <p className="text-sm text-muted-foreground">
            Available Saturdays are highlighted. Tap a date to confirm your week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/80 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <span className="text-xs text-muted-foreground">
            {weeks.length} upcoming weekend{weeks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-xs text-muted-foreground">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="text-center">
              {weekday}
            </span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1" role="grid">
          {days.map((date, index) => {
            if (!date) {
              return <span key={`empty-${index}`} />;
            }

            const key = formatDateYYYYMMDD(date);
            const week = weeksByDate.get(key);
            const isSelectable = Boolean(week);
            const isLocked = week?.isCutoffPassed ?? false;
            const isSelected = selectedWeek === key;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isDisabled = disabled || !isSelectable || isLocked;

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelect(key)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-sm transition",
                  isWeekend && !isSelected && "text-foreground",
                  !isSelectable && "text-muted-foreground",
                  isLocked && "cursor-not-allowed text-rose-400",
                  isSelectable && !isDisabled && "border-primary/30 hover:bg-muted",
                  isSelected && "border-primary bg-primary text-primary-foreground shadow-sm"
                )}
                aria-pressed={isSelected}
                aria-label={
                  week
                    ? `${week.label}${isLocked ? " (locked)" : ""}`
                    : date.toDateString()
                }
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Selected week
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            Available weekend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-200" />
            Locked after cutoff
          </div>
        </div>
      </div>

      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
    </div>
  );
}
