import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n";
import { PageTransition } from "@/components/page-transition";
import { SiteHeader } from "@/components/navigation/site-header";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
  setRequestLocale(resolvedLocale);
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
