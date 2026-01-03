import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      className,
      type,
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = Boolean(error);
    const showSuccessIcon = success && !hasError;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
              hasError
                ? "border-red-500 focus:ring-red-500"
                : showSuccessIcon
                ? "border-green-500 focus:ring-green-500"
                : "border-gray-300 focus:ring-[#D4A574] dark:border-gray-700",
              leftIcon ? "pl-10" : "",
              rightIcon || hasError || showSuccessIcon ? "pr-10" : "",
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {!hasError && !showSuccessIcon && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}

          {showSuccessIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 pointer-events-none">
              <CheckCircle2 className="h-5 w-5" aria-label="Success" />
            </div>
          )}

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400 pointer-events-none">
              <AlertCircle className="h-5 w-5" aria-label="Error" />
            </div>
          )}
        </div>

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
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export { InputField };
