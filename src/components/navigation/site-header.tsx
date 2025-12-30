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
  Route as RouteIcon,
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
  { label: "Routes", href: "/admin/routes", icon: RouteIcon },
  { label: "Meals", href: "/admin/meals", icon: ChefHat },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: BadgeDollarSign },
];

const APP_ROUTES = new Set(["/account", "/schedule", "/track", "/billing", "/onboarding"]);

function isActiveRoute(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname === "/";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const shouldReduceMotion = useReducedMotion() ?? false;
  const transition = getMotionTransition(shouldReduceMotion);
  const { initial: panelInitial, animate: panelAnimate, exit: panelExit } = getSlideMotion(
    shouldReduceMotion,
    32,
  );

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAppRoute = useMemo(
    () => APP_ROUTES.has(pathname) || Array.from(APP_ROUTES).some((route) => pathname.startsWith(`${route}/`)),
    [pathname],
  );

  const navLinks = isAdminRoute ? ADMIN_LINKS : isAppRoute ? AUTH_LINKS : PUBLIC_LINKS;
  const showLogout = isAdminRoute || isAppRoute;

  // Close on route change (prevents stale open state)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Focus + ESC + scroll lock
  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-foreground">
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
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 motion-reduce:hover:transform-none",
                  isActiveRoute(pathname, link.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
          onClick={() => setOpen(true)}
          className="h-11 w-11 rounded-full border border-border bg-background text-foreground shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:transform-none md:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.button
              type="button"
              className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
              transition={transition}
            />

            {/* Panel */}
            <motion.div
              className={cn(
                "absolute right-0 top-0 flex h-full w-[20rem] flex-col gap-6",
                "border-l border-border bg-background shadow-2xl",
                "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
              )}
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={transition}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Menu</p>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActiveRoute(pathname, link.href)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent",
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

              <p className="mt-auto text-xs text-muted-foreground">
                Need help? Email support@morningstardelivery.com
              </p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
