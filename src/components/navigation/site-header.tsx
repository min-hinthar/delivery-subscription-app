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
    <header className="sticky top-0 z-50 border-b border-border/40 bg-gradient-to-r from-background/98 via-background/95 to-background/98 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-bold tracking-tight transition-all hover:scale-105"
        >
          <span className="bg-gradient-to-r from-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {t("branding.appName")}
          </span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none",
                  isActiveRoute(normalizedPathname, link.href)
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-accent/70 hover:to-accent/50 hover:text-foreground",
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
          className="group h-11 w-11 rounded-full border border-border/40 bg-gradient-to-br from-background to-muted/30 p-0 text-foreground shadow-md transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
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
              className="absolute right-0 top-0 flex h-full w-80 flex-col gap-6 border-l border-border/60 bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-2xl backdrop-blur-md"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={transition}
            >
              <div className="flex items-center justify-between">
                <p className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-sm font-bold text-transparent">
                  {t("common.navigation")}
                </p>
                <button
                  onClick={() => setOpenPathname(null)}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-border/40 bg-gradient-to-br from-background to-muted/30 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  aria-label="Close navigation menu"
                  ref={closeButtonRef}
                >
                  <X className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
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
                        "group relative flex h-11 items-center gap-3 overflow-hidden rounded-lg px-4 text-sm font-medium transition-all hover:pl-5 motion-reduce:transition-none",
                        isActiveRoute(normalizedPathname, link.href)
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-gradient-to-r hover:from-accent/70 hover:to-accent/50 hover:text-foreground",
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
