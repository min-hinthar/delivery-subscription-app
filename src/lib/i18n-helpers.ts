import { locales, type Locale } from "@/i18n";

export function getLocalizedField<T extends object>(
  item: T,
  fieldName: keyof T,
  locale: Locale,
): string {
  const record = item as Record<string, unknown>;
  if (locale === "my") {
    const burmeseField = `${String(fieldName)}_my` as keyof T;
    const burmeseValue = record[burmeseField as string];
    if (typeof burmeseValue === "string" && burmeseValue.length > 0) {
      return burmeseValue;
    }
  }

  const fallbackValue = record[fieldName as string];
  return typeof fallbackValue === "string" ? fallbackValue : "";
}

export function stripLocaleFromPathname(pathname: string, locale?: Locale) {
  if (!pathname) {
    return "/";
  }

  const resolvedLocale =
    locale ??
    locales.find((candidate) => pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`));

  if (!resolvedLocale) {
    return pathname;
  }

  const prefix = `/${resolvedLocale}`;
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
    return pathname;
  }
  const stripped = pathname.slice(prefix.length);

  return stripped.length > 0 ? stripped : "/";
}

export function getLocaleFromPathname(pathname: string) {
  return locales.find(
    (candidate) => pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`),
  );
}

export function getLocalizedPathname(pathname: string, locale: Locale) {
  if (!pathname || !pathname.startsWith("/") || locale === "en") {
    return pathname;
  }

  const existingLocale = getLocaleFromPathname(pathname);
  if (existingLocale) {
    return pathname;
  }

  const [pathWithQuery, hash] = pathname.split("#");
  const [pathOnly, query] = pathWithQuery.split("?");
  const localizedPath = `/${locale}${pathOnly === "/" ? "" : pathOnly}`;
  const withQuery = query ? `${localizedPath}?${query}` : localizedPath;

  return hash ? `${withQuery}#${hash}` : withQuery;
}
