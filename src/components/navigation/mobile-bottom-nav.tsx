"use client";

import { useEffect, useRef, useState } from "react";
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
  matchPaths?: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/menu",
    icon: UtensilsCrossed,
    label: "Menu",
    matchPaths: ["/menu/weekly", "/menu/dish"],
  },
  {
    href: "/schedule",
    icon: Calendar,
    label: "Schedule",
    matchPaths: ["/schedule/new"],
  },
  {
    href: "/track",
    icon: MapPin,
    label: "Track",
    matchPaths: ["/track/active"],
  },
  {
    href: "/account",
    icon: User,
    label: "Account",
    matchPaths: ["/account/orders", "/account/settings", "/account/profile"],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const normalizedPathname = pathname ?? "/";
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY < 10) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (normalizedPathname.startsWith("/admin") || normalizedPathname.startsWith("/driver")) {
    return null;
  }

  if (normalizedPathname.startsWith("/login") || normalizedPathname.startsWith("/signup")) {
    return null;
  }

  if (!NAV_ITEMS.some((item) => normalizedPathname.startsWith(item.href))) {
    return null;
  }

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-border bg-background/95 backdrop-blur-lg",
          "shadow-[0_-2px_10px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-in-out",
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
              normalizedPathname === item.href ||
              item.matchPaths?.some((path) => normalizedPathname.startsWith(path)) ||
              false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
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
                    className="absolute bottom-0 h-1 w-12 rounded-t-full bg-primary"
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
