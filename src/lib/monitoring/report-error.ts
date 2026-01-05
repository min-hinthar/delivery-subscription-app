export type ErrorContext = {
  scope?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export function reportError(error: unknown, context?: ErrorContext) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const payload = {
    error,
    scope: context?.scope,
    metadata: context?.metadata,
  };

  console.error("reported_error", payload);
}
