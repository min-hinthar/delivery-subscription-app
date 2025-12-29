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
  Truck,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getMotionTransition, getSlideMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const PUBLIC_LINKS: NavLink[] = [
  { label: "How it Works", href: "/#how-it-works", icon: Sparkles },
  { label: "Pricing", href: "/pricing", icon: BadgeDollarSign },
  { label: "Login", href: "/login", icon: LogIn },
];

const AUTH_LINKS: NavLink[] = [
  { label: "Account", href: "/account", icon: User },
  { label: "Schedule", href: "/schedule", icon: CalendarCheck },
  { label: "Track", href: "/track", icon: MapPinned },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

const ADMIN_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
  { label: "Routes", href: "/admin/routes", icon: Route },
  { label: "Meals", href: "/admin/meals", icon: ChefHat },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: BadgeDollarSign },
];

const APP_ROUTES = new Set(["/account", "/schedule", "/track", "/billing", "/onboarding"]);

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
  const pathname = usePathname();
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

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAppRoute = useMemo(
    () => APP_ROUTES.has(pathname) || Array.from(APP_ROUTES).some((route) => pathname.startsWith(`${route}/`)),
    [pathname],
  );

  const navLinks = isAdminRoute ? ADMIN_LINKS : isAppRoute ? AUTH_LINKS : PUBLIC_LINKS;
  const showLogout = isAdminRoute || isAppRoute;

  return (
    <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Morning Star Delivery
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5",
                  isActiveRoute(pathname, link.href)
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          {showLogout ? <LogoutButton /> : null}
          <ThemeToggle />
        </nav>
        <button
          onClick={() => setOpenPathname(pathname)}
          className="h-11 w-11 rounded-full border border-slate-200 bg-white p-0 text-slate-900 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
            <motion.div
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setOpenPathname(null)}
              aria-hidden="true"
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
              transition={transition}
            />
            <motion.div
              className="absolute right-0 top-0 flex h-full w-80 flex-col gap-6 border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={transition}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Menu</p>
                <button
                  onClick={() => setOpenPathname(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-200 dark:focus-visible:ring-slate-100"
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
                        "flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium",
                        isActiveRoute(pathname, link.href)
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3">
                {showLogout ? <LogoutButton /> : null}
                <ThemeToggle />
              </div>
              <p className="mt-auto text-xs text-slate-500 dark:text-slate-400">
                Need help? Email support@morningstardelivery.com
              </p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
