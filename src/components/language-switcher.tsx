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

    // Update html lang attribute
    const html = document.documentElement;
    html.setAttribute("lang", locale);
  }, [locale]);

  const switchLocale = async (newLocale: Locale) => {
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch {
      // Ignore cookie write failures and proceed with navigation.
    }

    const pathnameWithoutLocale = stripLocaleFromPathname(pathname, locale);
    const nextPath = pathnameWithoutLocale || "/";

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="group relative flex items-center gap-1.5 rounded-full border border-border/40 bg-gradient-to-br from-background/95 to-muted/30 p-1 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md">
      <Globe className="ml-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      {locales.map((loc) => (
        <Button
          key={loc}
          variant={locale === loc ? "secondary" : "ghost"}
          size="sm"
          onClick={() => switchLocale(loc)}
          className={`
            rounded-full px-3.5 py-1.5 text-xs font-medium transition-all
            ${
              locale === loc
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }
          `}
          aria-pressed={locale === loc}
        >
          <span className="md:hidden">{loc.toUpperCase()}</span>
          <span className="hidden md:inline">{localeNames[loc]}</span>
        </Button>
      ))}
    </div>
  );
}
