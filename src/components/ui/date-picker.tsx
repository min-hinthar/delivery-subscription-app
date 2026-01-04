"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRange = {
  start: Date | null;
  end: Date | null;
};

export interface DatePickerProps {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: Date | DateRange | null;
  defaultValue?: Date | DateRange | null;
  onChange?: (value: Date | DateRange | null) => void;
  mode?: "single" | "range";
  disabledDates?: Date[] | ((date: Date) => boolean);
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function isDateDisabled(
  date: Date,
  disabledDates?: Date[] | ((value: Date) => boolean),
  minDate?: Date,
  maxDate?: Date
) {
  if (minDate && date < minDate) {
    return true;
  }
  if (maxDate && date > maxDate) {
    return true;
  }
  if (!disabledDates) {
    return false;
  }
  if (typeof disabledDates === "function") {
    return disabledDates(date);
  }
  return disabledDates.some((disabled) => isSameDay(disabled, date));
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      placeholder = "Select a date",
      value,
      defaultValue,
      onChange,
      mode = "single",
      disabledDates,
      minDate,
      maxDate,
      className,
      disabled,
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<
      Date | DateRange | null | undefined
    >(defaultValue);

    const currentValue = value ?? internalValue ?? null;

    const [viewMonth, setViewMonth] = React.useState<Date>(() => {
      if (currentValue instanceof Date) {
        return startOfMonth(currentValue);
      }
      if (currentValue && "start" in currentValue && currentValue.start) {
        return startOfMonth(currentValue.start);
      }
      return startOfMonth(new Date());
    });

    React.useEffect(() => {
      if (!open) {
        return;
      }
      if (currentValue instanceof Date) {
        setViewMonth(startOfMonth(currentValue));
      } else if (currentValue && "start" in currentValue && currentValue.start) {
        setViewMonth(startOfMonth(currentValue.start));
      }
    }, [currentValue, open]);

    function emitChange(next: Date | DateRange | null) {
      if (value === undefined) {
        setInternalValue(next ?? null);
      }
      onChange?.(next ?? null);
    }

    function handleSelect(date: Date) {
      if (mode === "single") {
        emitChange(date);
        setOpen(false);
        return;
      }

      const range: DateRange =
        currentValue && "start" in currentValue
          ? currentValue
          : { start: null, end: null };

      if (!range.start || (range.start && range.end)) {
        emitChange({ start: date, end: null });
        return;
      }

      if (range.start && !range.end) {
        if (date < range.start) {
          emitChange({ start: date, end: range.start });
        } else {
          emitChange({ start: range.start, end: date });
        }
      }
    }

    const hasError = Boolean(error);
    const days = getMonthDays(viewMonth);

    const selectedDates = React.useMemo(() => {
      if (currentValue instanceof Date) {
        return { start: currentValue, end: currentValue };
      }
      if (currentValue && "start" in currentValue) {
        return currentValue;
      }
      return { start: null, end: null };
    }, [currentValue]);

    const displayValue = React.useMemo(() => {
      if (!currentValue) {
        return placeholder;
      }
      if (currentValue instanceof Date) {
        return formatDate(currentValue);
      }
      if (currentValue.start && currentValue.end) {
        return `${formatDate(currentValue.start)} – ${formatDate(
          currentValue.end
        )}`;
      }
      if (currentValue.start) {
        return `${formatDate(currentValue.start)} –`;
      }
      return placeholder;
    }, [currentValue, placeholder]);

    function isInRange(date: Date) {
      if (!selectedDates.start || !selectedDates.end) {
        return false;
      }
      return date >= selectedDates.start && date <= selectedDates.end;
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <button
          id={inputId}
          type="button"
          ref={ref}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-[#D4A574]",
            className
          )}
        >
          <span
            className={cn(
              "truncate",
              !currentValue && "text-gray-400 dark:text-gray-500"
            )}
          >
            {displayValue}
          </span>
          <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </button>

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {viewMonth.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-xs text-gray-500 dark:text-gray-400">
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

                  const disabledDate = isDateDisabled(
                    date,
                    disabledDates,
                    minDate,
                    maxDate
                  );
                  const isSelectedStart =
                    selectedDates.start && isSameDay(date, selectedDates.start);
                  const isSelectedEnd =
                    selectedDates.end && isSameDay(date, selectedDates.end);
                  const isSelected =
                    (selectedDates.start && isSameDay(date, selectedDates.start)) ||
                    (selectedDates.end && isSameDay(date, selectedDates.end));
                  const inRange = isInRange(date);

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      disabled={disabledDate}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                        disabledDate
                          ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        inRange && !isSelected && "bg-[#F3E7D3] dark:bg-[#3D2C1D]",
                        (isSelectedStart || isSelectedEnd) &&
                          "bg-[#D4A574] text-white",
                        isSelected && "font-semibold"
                      )}
                      onClick={() => !disabledDate && handleSelect(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mode === "range"
                    ? "Select a start and end date"
                    : "Select a date"}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#D4A574]"
                  onClick={() => setOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}

        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
