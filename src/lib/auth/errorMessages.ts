export function friendlyAuthError(
  err: unknown,
  fallback = "Login failed. Please try again.",
): string {
  const msg =
    typeof err === "object" && err && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  // Supabase commonly returns "Invalid login credentials"
  if (msg.toLowerCase().includes("invalid login credentials")) {
    return "No active account found or credentials are incorrect. Please sign up.";
  }

  if (msg.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  return fallback;
}
