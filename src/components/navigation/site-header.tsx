"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarCheck,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogIn,
  MapPinned,
  Menu,
  Route,
  Sparkles,
  UtensilsCrossed,
  Truck,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Locale } from "@/i18n";
import { stripLocaleFromPathname } from "@/lib/i18n-helpers";
import { getMotionTransition, getSlideMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type NavLink = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

const PUBLIC_LINKS: NavLink[] = [
  { labelKey: "nav.howItWorks", href: "/#how-it-works", icon: Sparkles },
  { labelKey: "nav.pricing", href: "/pricing", icon: BadgeDollarSign },
  { labelKey: "nav.login", href: "/login", icon: LogIn },
];

const AUTH_LINKS: NavLink[] = [
  { labelKey: "nav.account", href: "/account", icon: User },
  { labelKey: "nav.menu", href: "/menu/weekly", icon: UtensilsCrossed },
  { labelKey: "nav.schedule", href: "/schedule", icon: CalendarCheck },
  { labelKey: "nav.track", href: "/track", icon: MapPinned },
  { labelKey: "nav.billing", href: "/billing", icon: CreditCard },
];

const ADMIN_LINKS: NavLink[] = [
  { labelKey: "nav.dashboard", href: "/admin", icon: LayoutDashboard },
  { labelKey: "nav.deliveries", href: "/admin/deliveries", icon: Truck },
  { labelKey: "nav.routes", href: "/admin/routes", icon: Route },
  { labelKey: "nav.menus", href: "/admin/menus", icon: ChefHat },
  { labelKey: "nav.meals", href: "/admin/meals", icon: ChefHat },
  { labelKey: "nav.subscriptions", href: "/admin/subscriptions", icon: BadgeDollarSign },
];

const APP_ROUTES = new Set([
  "/account",
  "/menu",
  "/schedule",
  "/track",
  "/billing",
  "/onboarding",
]);

function isActiveRoute(pathname: string, href: string) {
  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const normalizedPathname = stripLocaleFromPathname(pathname ?? "/", locale);
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = openPathname === pathname;
  const shouldReduceMotion = useReducedMotion() ?? false;
  const transition = getMotionTransition(shouldReduceMotion);
  const { initial: panelInitial, animate: panelAnimate, exit: panelExit } = getSlideMotion(
    shouldReduceMotion,
    32,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPathname(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isAdminRoute =
    normalizedPathname.startsWith("/admin") && normalizedPathname !== "/admin/login";
  const isAppRoute = useMemo(
    () =>
      APP_ROUTES.has(normalizedPathname) ||
      Array.from(APP_ROUTES).some((route) => normalizedPathname.startsWith(`${route}/`)),
    [normalizedPathname],
  );

  const navLinks = isAdminRoute ? ADMIN_LINKS : isAppRoute ? AUTH_LINKS : PUBLIC_LINKS;
  const showLogout = isAdminRoute || isAppRoute;

  return (
    <header className="border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-foreground">
          {t("branding.appName")}
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none",
                  isActiveRoute(normalizedPathname, link.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(link.labelKey)}
              </Link>
            );
          })}
          {showLogout ? <LogoutButton /> : null}
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
        <button
          onClick={() => setOpenPathname(pathname)}
          className="h-11 w-11 rounded-full border border-border bg-background p-0 text-foreground shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpenPathname(null)}
              aria-hidden="true"
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
              transition={transition}
            />
            <motion.div
              className="absolute right-0 top-0 flex h-full w-80 flex-col gap-6 border-l border-border bg-background p-6 shadow-2xl"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={transition}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {t("common.navigation")}
                </p>
                <button
                  onClick={() => setOpenPathname(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  aria-label="Close navigation menu"
                  ref={closeButtonRef}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenPathname(null)}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium transition motion-reduce:transition-none",
                        isActiveRoute(normalizedPathname, link.href)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3">
                {showLogout ? <LogoutButton /> : null}
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              <p className="mt-auto text-xs text-muted-foreground">
                {t("support.needHelp")}
              </p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
