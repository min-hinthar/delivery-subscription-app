"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  MapPin,
  UtensilsCrossed,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  labelMy?: string;
  matchPaths?: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/menu",
    icon: UtensilsCrossed,
    label: "Menu",
    labelMy: "မီနူး",
    matchPaths: ["/menu/weekly", "/menu/dish"],
  },
  {
    href: "/schedule",
    icon: Calendar,
    label: "Schedule",
    labelMy: "အချိန်",
    matchPaths: ["/schedule/new"],
  },
  {
    href: "/track",
    icon: MapPin,
    label: "Track",
    labelMy: "ခြေရာ",
    matchPaths: ["/track/active"],
  },
  {
    href: "/account",
    icon: User,
    label: "Account",
    labelMy: "အကောင့်",
    matchPaths: ["/account/orders", "/account/settings", "/account/profile"],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY < 10) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/driver")) {
    return null;
  }

  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-slate-200 bg-white/95 backdrop-blur-lg",
          "shadow-[0_-2px_10px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-in-out",
          "dark:border-slate-800 dark:bg-slate-950/95",
          "md:hidden",
          isVisible ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              item.matchPaths?.some((path) => pathname?.startsWith(path)) ||
              false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors",
                  isActive
                    ? "text-[#D4A574]"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                )}
                style={{
                  minHeight: "56px",
                  minWidth: "56px",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-6 w-6 transition-transform", isActive && "scale-110")}
                  aria-hidden="true"
                />
                <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="absolute bottom-0 h-1 w-12 rounded-t-full bg-[#D4A574]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
