import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { locales, type Locale } from "@/i18n";
import { PageTransition } from "@/components/page-transition";
import { SiteHeader } from "@/components/navigation/site-header";

// Enable static params generation for all supported locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Generate metadata for each locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  // Validate locale
  if (!locales.includes(locale)) {
    return {};
  }

  // Get branding name for locale-specific title
  const t = await getTranslations({ locale, namespace: "branding" });
  const appName = t("appName");

  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description:
      locale === "my"
        ? "မန္တလေး မနေ့ကြယ် အပတ်စဉ် ပို့ဆောင်ရေး ဝန်ဆောင်မှု"
        : "Weekly delivery subscription app for Mandalay Morning Star.",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const resolvedLocale = resolvedParams.locale as Locale;

  // Validate locale and 404 if invalid
  if (!locales.includes(resolvedLocale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(resolvedLocale);

  // Load messages for this locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 py-10 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
