"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      placeholder = "Select an option",
      options,
      value,
      defaultValue,
      onChange,
      searchable = false,
      multiple = false,
      disabled = false,
      className,
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const [internalValue, setInternalValue] = React.useState<
      string | string[] | undefined
    >(defaultValue);

    const currentValue = value ?? internalValue;
    const selectedValues = React.useMemo(
      () =>
        Array.isArray(currentValue)
          ? currentValue
          : currentValue
          ? [currentValue]
          : [],
      [currentValue]
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || search.trim().length === 0) {
        return options;
      }
      const term = search.toLowerCase();
      return options.filter((option) =>
        option.label.toLowerCase().includes(term)
      );
    }, [options, search, searchable]);

    const hasError = Boolean(error);

    React.useEffect(() => {
      if (!open) {
        setSearch("");
        setHighlightedIndex(0);
      }
    }, [open]);

    function emitChange(next: string | string[]) {
      if (value === undefined) {
        setInternalValue(next);
      }
      onChange?.(next);
    }

    function toggleOption(optionValue: string) {
      if (multiple) {
        const nextValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((item) => item !== optionValue)
          : [...selectedValues, optionValue];
        emitChange(nextValues);
        return;
      }

      emitChange(optionValue);
      setOpen(false);
    }

    function handleKeyDown(event: React.KeyboardEvent) {
      if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, filteredOptions.length - 1)
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option && !option.disabled) {
          toggleOption(option.value);
        }
      }
    }

    const selectedLabel = React.useMemo(() => {
      if (selectedValues.length === 0) {
        return placeholder;
      }

      const matched = options.filter((option) =>
        selectedValues.includes(option.value)
      );

      if (multiple) {
        return matched.map((option) => option.label).join(", ");
      }

      return matched[0]?.label ?? placeholder;
    }, [multiple, options, placeholder, selectedValues]);

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
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
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
              selectedValues.length === 0 && "text-gray-400 dark:text-gray-500"
            )}
          >
            {selectedLabel}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
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
              className="relative w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handleKeyDown}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {helperText}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-transparent p-2 text-gray-500 hover:border-gray-200 hover:text-gray-700 dark:hover:border-gray-700"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              {searchable && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>
              )}

              <ul
                className="mt-4 max-h-72 overflow-y-auto"
                role="listbox"
                aria-multiselectable={multiple}
              >
                {filteredOptions.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No matches found.
                  </li>
                )}
                {filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm",
                        option.disabled
                          ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        isHighlighted && !option.disabled && "bg-gray-100 dark:bg-gray-800",
                        isSelected && "font-semibold text-gray-900 dark:text-gray-100"
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() =>
                        !option.disabled && toggleOption(option.value)
                      }
                    >
                      <div>
                        <p>{option.label}</p>
                        {option.description && (
                          <p className="text-xs text-gray-500">
                            {option.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="mt-0.5 h-4 w-4 text-[#D4A574]" />
                      )}
                    </li>
                  );
                })}
              </ul>
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

Select.displayName = "Select";

export { Select };
