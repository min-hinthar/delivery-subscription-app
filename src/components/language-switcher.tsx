"use client";

import { useEffect } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { type Locale, localeNames, locales } from "@/i18n";
import { stripLocaleFromPathname } from "@/lib/i18n-helpers";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
  }, [locale]);

  const switchLocale = (newLocale: Locale) => {
    const pathnameWithoutLocale = stripLocaleFromPathname(pathname, locale);
    const nextPath =
      newLocale === "en"
        ? pathnameWithoutLocale || "/"
        : `/${newLocale}${pathnameWithoutLocale || "/"}`;

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 p-1 text-xs">
      <Globe className="ml-2 h-4 w-4 text-muted-foreground" />
      {locales.map((loc) => (
        <Button
          key={loc}
          variant={locale === loc ? "secondary" : "ghost"}
          size="sm"
          onClick={() => switchLocale(loc)}
          className="rounded-full px-3 text-xs"
          aria-pressed={locale === loc}
        >
          <span className="md:hidden">{loc.toUpperCase()}</span>
          <span className="hidden md:inline">{localeNames[loc]}</span>
        </Button>
      ))}
    </div>
  );
}
