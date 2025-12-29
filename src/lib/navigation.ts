export function getSafeRedirectPath(value: string | null | undefined, fallback = "/account") {
  if (!value) {
    return fallback;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      return getSafeRedirectPath(
        `${parsed.pathname}${parsed.search}${parsed.hash}`,
        fallback,
      );
    } catch {
      return fallback;
    }
  }

  if (value.startsWith("/")) {
    if (value.startsWith("//")) {
      return fallback;
    }

    return value;
  }

  return fallback;
}
