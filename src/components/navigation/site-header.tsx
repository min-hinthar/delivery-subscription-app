"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: string;
};

const PUBLIC_LINKS: NavLink[] = [
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Login", href: "/login" },
];

const AUTH_LINKS: NavLink[] = [
  { label: "Account", href: "/account" },
  { label: "Schedule", href: "/schedule" },
  { label: "Track", href: "/track" },
  { label: "Billing", href: "/billing" },
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

  const isAppRoute = useMemo(
    () => APP_ROUTES.has(pathname) || Array.from(APP_ROUTES).some((route) => pathname.startsWith(`${route}/`)),
    [pathname],
  );

  const navLinks = isAppRoute ? AUTH_LINKS : PUBLIC_LINKS;

  return (
    <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Morning Star Delivery
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5",
                isActiveRoute(pathname, link.href)
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAppRoute ? <LogoutButton /> : null}
          <ThemeToggle />
        </nav>
        <button
          onClick={() => setOpenPathname(pathname)}
          className="h-11 w-11 rounded-full border border-slate-200 bg-white p-0 text-slate-900 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpenPathname(null)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-80 flex-col gap-6 bg-white p-6 shadow-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Menu</p>
              <button
                onClick={() => setOpenPathname(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-200 dark:focus-visible:ring-slate-100"
                aria-label="Close navigation menu"
                ref={closeButtonRef}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpenPathname(null)}
                  className={cn(
                    "flex h-11 items-center rounded-lg px-4 text-sm font-medium",
                    isActiveRoute(pathname, link.href)
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {isAppRoute ? <LogoutButton /> : null}
              <ThemeToggle />
            </div>
            <p className="mt-auto text-xs text-slate-500 dark:text-slate-400">
              Need help? Email support@morningstardelivery.com
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
