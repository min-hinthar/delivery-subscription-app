import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const locales = ["en", "my"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  my: "မြန်မာ",
};

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? "en";

  if (!locales.includes(resolvedLocale as Locale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
