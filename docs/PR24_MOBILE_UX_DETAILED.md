# 📱 PR #24: Mobile-First UX - Step-by-Step Implementation

**For:** Codex
**Priority:** P0 (Critical for Launch)
**Estimated Time:** 6-8 hours
**Target Users:** LA Burmese community (students, families, elderly)
**Branch:** `codex/mobile-ux-optimization`

---

## 🎯 What We're Building

A mobile-first experience where:
- **Students** can quickly order between classes (UCLA, USC, Cal State LA)
- **Elderly** can easily navigate with large touch targets
- **Busy families** can order while commuting
- **Everyone** has a fast, smooth, app-like experience

---

## 📋 Acceptance Criteria

- [ ] Bottom navigation works on all mobile devices
- [ ] All tap targets ≥44px (Apple's minimum)
- [ ] Smooth 60fps scrolling and animations
- [ ] Haptic feedback on key actions
- [ ] Swipe gestures work intuitively
- [ ] Pull-to-refresh on lists
- [ ] PWA installable to home screen
- [ ] Works perfectly on iPhone SE, iPhone 14 Pro, Samsung Galaxy
- [ ] Lighthouse Mobile Score: >90
- [ ] No horizontal scrolling issues
- [ ] Safe area support (iPhone notch)

---

## 🚀 Implementation Steps

### Step 1: Bottom Navigation Bar (2 hours)

#### 1.1 Create Component File

**Create:** `src/components/navigation/mobile-bottom-nav.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  MapPin,
  UtensilsCrossed,
  User,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  labelMy?: string; // Burmese label (for future i18n)
  matchPaths?: string[]; // Additional paths that should highlight this nav item
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
    matchPaths: ["/account/orders", "/account/settings"],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always show if at top
          if (currentScrollY < 10) {
            setIsVisible(true);
          }
          // Hide when scrolling down
          else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          }
          // Show when scrolling up
          else if (currentScrollY < lastScrollY) {
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

  // Don't show on admin or driver pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/driver")) {
    return null;
  }

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-slate-200 bg-white/95 backdrop-blur-lg",
          "shadow-[0_-2px_10px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-in-out",
          "dark:border-slate-800 dark:bg-slate-950/95",
          "md:hidden", // Only show on mobile
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          // Safe area support for iPhone notch/home indicator
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            // Check if current path matches this nav item
            const isActive =
              pathname === item.href ||
              item.matchPaths?.some((path) => pathname?.startsWith(path)) ||
              false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors",
                  "relative", // For active indicator
                  isActive
                    ? "text-[#D4A574]" // Burmese golden color
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                )}
                style={{
                  minHeight: "56px", // Large touch target for accessibility
                  minWidth: "56px",
                  touchAction: "manipulation", // Disable double-tap zoom
                  WebkitTapHighlightColor: "transparent", // Remove tap highlight
                }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Icon */}
                <Icon
                  className={cn(
                    "h-6 w-6 transition-transform",
                    isActive && "scale-110"
                  )}
                  aria-hidden="true"
                />

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
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
```

#### 1.2 Add to App Layout

**Edit:** `src/app/(app)/layout.tsx`

```typescript
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

export default function AppLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Existing header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95">
        {/* Your existing header content */}
      </header>

      {/* Main content with bottom padding on mobile for nav clearance */}
      <main className="pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
```

#### 1.3 Test Checklist

**Manual Testing:**
- [ ] Open on iPhone Safari - nav appears at bottom
- [ ] Scroll down - nav hides smoothly
- [ ] Scroll up - nav appears smoothly
- [ ] Tap each nav item - navigates correctly
- [ ] Check active state - correct item highlighted
- [ ] Test on landscape mode - still works
- [ ] Test on iPad - nav should be hidden (md:hidden)
- [ ] Test safe area on iPhone 14 Pro - no overlap with notch

**Code Quality:**
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Accessibility: ARIA labels present
- [ ] Accessibility: aria-current on active items

---

### Step 2: Touch Optimizations (2 hours)

#### 2.1 Global Touch Styles

**Edit:** `src/app/globals.css`

Add this section:

```css
/* ============================================
   MOBILE TOUCH OPTIMIZATIONS
   ============================================ */

@media (max-width: 768px) {
  /* Prevent text size adjustment on iOS */
  html {
    -webkit-text-size-adjust: 100%;
  }

  /* Remove tap highlight on iOS */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Smooth scrolling on iOS */
  body {
    -webkit-overflow-scrolling: touch;
  }

  /* Increase button tap targets to minimum 44px (Apple guideline) */
  button,
  a[role="button"],
  input[type="submit"],
  input[type="button"] {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
  }

  /* Increase form input tap targets */
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="number"],
  input[type="password"],
  select,
  textarea {
    min-height: 48px;
    font-size: 16px; /* Prevents iOS zoom on focus */
    padding: 12px 16px;
  }

  /* Increase checkbox/radio tap targets */
  input[type="checkbox"],
  input[type="radio"] {
    width: 24px;
    height: 24px;
    margin: 8px; /* Additional clickable area */
  }

  /* Make sure select dropdowns are touch-friendly */
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 12px;
    padding-right: 36px;
  }

  /* Card tap targets */
  .card[role="button"],
  .card.clickable {
    min-height: 56px;
    cursor: pointer;
  }

  /* Icon buttons */
  .icon-button {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

/* ============================================
   PULL-TO-REFRESH PREVENTION (for custom impl)
   ============================================ */
body {
  overscroll-behavior-y: contain;
}

/* ============================================
   SAFE AREA SUPPORT (iPhone notch)
   ============================================ */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

/* ============================================
   BURMESE FONT OPTIMIZATIONS
   ============================================ */
[lang="my"] {
  /* Burmese text needs more line height */
  line-height: 1.8;
  letter-spacing: 0.01em;
}

[lang="my"] button,
[lang="my"] input,
[lang="my"] select {
  /* Slightly larger for Burmese readability */
  font-size: 17px;
}
```

#### 2.2 Update Button Component

**Edit:** `src/components/ui/button.tsx`

Add mobile-specific variant:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        burmese: "bg-[#D4A574] text-white hover:bg-[#C4956B] shadow-md", // Special Burmese golden variant
      },
      size: {
        default: "h-10 px-4 py-2 md:h-10",
        sm: "h-9 px-3 md:h-9",
        lg: "h-12 px-8 md:h-11", // Larger on mobile
        icon: "h-10 w-10",
        // Mobile-optimized sizes
        mobile: "h-12 px-6 text-base md:h-10 md:px-4", // Bigger on mobile, normal on desktop
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

#### 2.3 Create Haptic Feedback Utility

**Create:** `src/lib/haptics.ts`

```typescript
/**
 * Haptic feedback utilities for mobile devices
 * Works on iOS Safari and Chrome Android
 */

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}

/**
 * Trigger a light haptic feedback
 * Use for: Button taps, checkbox toggles, small interactions
 */
export function hapticLight() {
  if (isHapticSupported()) {
    navigator.vibrate(10);
  }
}

/**
 * Trigger a medium haptic feedback
 * Use for: Adding items to cart, form submissions, confirmations
 */
export function hapticMedium() {
  if (isHapticSupported()) {
    navigator.vibrate(20);
  }
}

/**
 * Trigger a heavy haptic feedback
 * Use for: Errors, warnings, important actions
 */
export function hapticHeavy() {
  if (isHapticSupported()) {
    navigator.vibrate(30);
  }
}

/**
 * Trigger a success haptic pattern
 * Use for: Successful order, payment confirmation, completion
 */
export function hapticSuccess() {
  if (isHapticSupported()) {
    navigator.vibrate([10, 50, 10]); // Two short vibrations
  }
}

/**
 * Trigger an error haptic pattern
 * Use for: Form errors, payment failures, unavailable items
 */
export function hapticError() {
  if (isHapticSupported()) {
    navigator.vibrate([50, 100, 50, 100, 50]); // Three medium vibrations
  }
}

/**
 * Trigger a warning haptic pattern
 * Use for: Order deadline warnings, delivery delays
 */
export function hapticWarning() {
  if (isHapticSupported()) {
    navigator.vibrate([30, 100, 30]); // Two medium vibrations
  }
}

/**
 * Trigger a selection change haptic (subtle)
 * Use for: Package selection, menu item selection
 */
export function hapticSelection() {
  if (isHapticSupported()) {
    navigator.vibrate(5);
  }
}
```

#### 2.4 Add Haptics to Key Actions

**Example: Add to Cart Button**

**Edit:** `src/components/menu/dish-card.tsx`

```typescript
import { hapticMedium, hapticSuccess } from "@/lib/haptics";
import { useState } from "react";

export function DishCard({ dish }: { dish: Dish }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    // Immediate haptic feedback
    hapticMedium();

    setIsAdding(true);

    try {
      await addToCart(dish.id);

      // Success haptic
      hapticSuccess();

      // Show toast
      toast.success(`${dish.name} added to cart!`);
    } catch (error) {
      hapticError();
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      {/* Dish content */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full"
        style={{ touchAction: "manipulation" }} // Prevents double-tap zoom
      >
        Add to Cart
      </button>
    </div>
  );
}
```

**Example: Package Selection**

**Edit:** `src/components/menu/package-selector.tsx`

```typescript
import { hapticSelection, hapticMedium } from "@/lib/haptics";

export function PackageSelector() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleSelectPackage = (packageId: string) => {
    hapticSelection(); // Subtle feedback
    setSelectedPackage(packageId);
  };

  const handleOrder = () => {
    hapticMedium(); // Confirm action
    // Process order...
  };

  return (
    // Component JSX...
  );
}
```

#### 2.5 Test Checklist

**Manual Testing:**
- [ ] Test on iPhone - haptic works
- [ ] Test on Android - haptic works
- [ ] All buttons have 44px+ minimum size
- [ ] Form inputs don't zoom on focus (iOS)
- [ ] Checkbox/radio buttons easy to tap
- [ ] Select dropdowns work well on mobile

---

### Step 3: Swipeable Modals (1.5 hours)

#### 3.1 Create Swipeable Modal Component

**Create:** `src/components/ui/swipeable-modal.tsx`

```typescript
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

type SwipeableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: string; // e.g., "90vh", "600px"
};

export function SwipeableModal({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "90vh",
}: SwipeableModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const SWIPE_THRESHOLD = 100; // Distance in pixels to trigger close

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const y = e.touches[0].clientY;
    const diff = y - startY;

    // Only allow downward swipe
    if (diff > 0) {
      setCurrentY(diff);

      // Add slight resistance
      if (diff > SWIPE_THRESHOLD) {
        setCurrentY(SWIPE_THRESHOLD + (diff - SWIPE_THRESHOLD) * 0.3);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Close if swiped down more than threshold
    if (currentY > SWIPE_THRESHOLD) {
      hapticLight();
      onClose();
    }

    // Reset position
    setCurrentY(0);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          currentY > 0 ? "opacity-30" : "opacity-50"
        )}
        style={{
          opacity: currentY > 0 ? Math.max(0.3, 0.5 - currentY / 500) : 0.5,
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          "dark:bg-slate-950",
          "md:rounded-2xl" // Rounded on all sides on desktop
        )}
        style={{
          maxHeight,
          transform: `translateY(${currentY}px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 Example Usage: Dish Details Modal

**Create:** `src/components/menu/dish-details-modal.tsx`

```typescript
"use client";

import Image from "next/image";
import { SwipeableModal } from "@/components/ui/swipeable-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dish } from "@/types";

type DishDetailsModalProps = {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (dish: Dish) => void;
};

export function DishDetailsModal({
  dish,
  isOpen,
  onClose,
  onAddToCart,
}: DishDetailsModalProps) {
  if (!dish) return null;

  return (
    <SwipeableModal
      isOpen={isOpen}
      onClose={onClose}
      title={dish.name}
    >
      {/* Dish image */}
      {dish.image_url && (
        <div className="relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden">
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}

      {/* Burmese name */}
      {dish.name_my && (
        <p className="mb-2 text-lg text-slate-500 dark:text-slate-400">
          {dish.name_my}
        </p>
      )}

      {/* Description */}
      <p className="mb-4 text-slate-700 dark:text-slate-300">
        {dish.description}
      </p>

      {/* Tags */}
      {dish.tags && dish.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Ingredients */}
      {dish.ingredients && dish.ingredients.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">Ingredients</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {dish.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Allergens */}
      {dish.allergens && dish.allergens.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 font-semibold text-orange-600 dark:text-orange-400">
            Allergens
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {dish.allergens.join(", ")}
          </p>
        </div>
      )}

      {/* Spice level */}
      {dish.spice_level && (
        <div className="mb-6">
          <h3 className="mb-2 font-semibold">Spice Level</h3>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-8 rounded-full",
                  i < dish.spice_level!
                    ? "bg-red-500"
                    : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price and Add to Cart */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
        <span className="text-2xl font-bold text-[#D4A574]">
          ${dish.price.toFixed(2)}
        </span>
        <Button
          size="lg"
          variant="burmese"
          onClick={() => {
            onAddToCart(dish);
            onClose();
          }}
        >
          Add to Cart
        </Button>
      </div>
    </SwipeableModal>
  );
}
```

#### 3.3 Test Checklist

- [ ] Swipe down to close works smoothly
- [ ] Can't swipe up (only down)
- [ ] Backdrop darkens when swiping
- [ ] Modal closes if swiped > 100px
- [ ] Modal returns if swiped < 100px
- [ ] Escape key closes modal
- [ ] Clicking backdrop closes modal
- [ ] Body scroll prevented when modal open
- [ ] Works on desktop (can close with X button)

---

### Step 4: Pull-to-Refresh (1 hour)

#### 4.1 Create Pull-to-Refresh Component

**Create:** `src/components/ui/pull-to-refresh.tsx`

```typescript
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number; // Distance in pixels to trigger refresh
  maxPullDistance?: number; // Maximum pull distance
  disabled?: boolean;
};

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only activate if scrolled to top
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setCanPull(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPull || isRefreshing || disabled) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);

    if (distance > 0) {
      setIsPulling(true);

      // Apply resistance (diminishing returns)
      const resistance = 2;
      const adjustedDistance = Math.min(
        distance / resistance,
        maxPullDistance
      );

      setPullDistance(adjustedDistance);

      // Trigger haptic when threshold reached
      if (adjustedDistance >= threshold && pullDistance < threshold) {
        hapticLight();
      }
    }
  };

  const handleTouchEnd = async () => {
    setCanPull(false);
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing && !disabled) {
      setIsRefreshing(true);
      hapticLight();

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Calculate rotation angle for spinner
  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute left-0 right-0 top-0 flex justify-center transition-all"
          style={{
            height: `${pullDistance}px`,
            opacity,
          }}
        >
          <div className="flex items-center">
            <RefreshCw
              className={cn(
                "h-8 w-8 text-[#D4A574]",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

#### 4.2 Example Usage: Order History

**Edit:** `src/app/(app)/(protected)/account/orders/page.tsx`

```typescript
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);

  const refreshOrders = async () => {
    const response = await fetch("/api/customer/orders");
    const data = await response.json();
    setOrders(data.orders);
  };

  return (
    <div>
      <h1>Order History</h1>

      <PullToRefresh onRefresh={refreshOrders}>
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </PullToRefresh>
    </div>
  );
}
```

#### 4.3 Test Checklist

- [ ] Pull down from top - indicator appears
- [ ] Release before threshold - snaps back
- [ ] Pull past threshold - triggers refresh
- [ ] Spinner rotates as you pull
- [ ] Haptic feedback when threshold reached
- [ ] Doesn't activate when not at top of page
- [ ] Disabled prop works

---

### Step 5: PWA Support (1.5 hours)

#### 5.1 Create Manifest File

**Create:** `public/manifest.json`

```json
{
  "name": "Mandalay Morning Star - Burmese Kitchen",
  "short_name": "Mandalay Star",
  "description": "Weekly Burmese food delivery in Los Angeles. Authentic Mandalay cuisine delivered every Saturday.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#D4A574",
  "orientation": "portrait",
  "scope": "/",
  "lang": "en-US",
  "dir": "ltr",
  "categories": ["food", "lifestyle"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-apple-touch.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-menu.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Weekly Menu View"
    },
    {
      "src": "/screenshot-tracking.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Live Delivery Tracking"
    }
  ],
  "shortcuts": [
    {
      "name": "This Week's Menu",
      "short_name": "Menu",
      "description": "View this week's Burmese dishes",
      "url": "/menu/weekly",
      "icons": [
        {
          "src": "/icon-menu.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Track Delivery",
      "short_name": "Track",
      "description": "Track your order in real-time",
      "url": "/track",
      "icons": [
        {
          "src": "/icon-track.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

#### 5.2 Add Manifest to Layout

**Edit:** `src/app/layout.tsx`

```typescript
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Mandalay Morning Star - Burmese Kitchen",
  description: "Weekly Burmese food delivery in Los Angeles. Authentic Mandalay cuisine.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mandalay Star",
    startupImage: [
      {
        url: "/splash-2048x2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px)",
      },
      {
        url: "/splash-1668x2388.png",
        media: "(device-width: 834px) and (device-height: 1194px)",
      },
      {
        url: "/splash-1284x2778.png",
        media: "(device-width: 428px) and (device-height: 926px)",
      },
    ],
  },
  formatDetection: {
    telephone: false, // Don't auto-detect phone numbers
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4A574" },
    { media: "(prefers-color-scheme: dark)", color: "#8B4513" },
  ],
};
```

#### 5.3 Create Install Prompt Component

**Create:** `src/components/pwa/install-prompt.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// PWA Install Prompt event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return; // Already installed
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Don't show again for 7 days
      if (daysSince < 7) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 30 seconds (not immediately)
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 z-40 border-2 border-[#D4A574] p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 rounded-full bg-[#D4A574] p-2">
          <Download className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="mb-1 font-semibold">Install Mandalay Star</h3>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            Add to your home screen for quick access to weekly Burmese menus and faster ordering!
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              variant="burmese"
              className="flex-1"
            >
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

#### 5.4 Add Install Prompt to Layout

**Edit:** `src/app/(app)/layout.tsx`

```typescript
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* ... existing layout ... */}

      {/* PWA install prompt */}
      <InstallPrompt />
    </div>
  );
}
```

#### 5.5 Create PWA Icons

You'll need to create these icons:
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/icon-apple-touch.png` (180x180)

Use your Mandalay Morning Star logo with:
- Golden/brown color scheme (#D4A574)
- Burmese-inspired design elements
- Clear, simple design (readable at small sizes)

**Icon Design Tips:**
1. Use a tool like Figma or Canva
2. Make sure logo is centered with padding
3. Use solid background color (white or golden)
4. Test at different sizes
5. Export as PNG with transparency if possible

#### 5.6 Test Checklist

- [ ] Open on mobile browser
- [ ] Install prompt appears after 30 seconds
- [ ] Click "Install App" - adds to home screen
- [ ] Open from home screen - opens in standalone mode
- [ ] Icon appears correctly on home screen
- [ ] Splash screen shows (iOS)
- [ ] Manifest validates (use Lighthouse)

---

## 🧪 Complete Testing Checklist

### Device Testing:
- [ ] iPhone SE (small screen, 4.7")
- [ ] iPhone 14 Pro (notch, 6.1")
- [ ] Samsung Galaxy S23 (Android, 6.1")
- [ ] iPad (tablet, 10.2")
- [ ] Test in landscape mode
- [ ] Test with large font size (accessibility settings)

### Browser Testing:
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Feature Testing:
- [ ] Bottom nav appears/hides on scroll
- [ ] All tap targets ≥44px
- [ ] Haptic feedback works
- [ ] Swipe to close modals
- [ ] Pull-to-refresh works
- [ ] PWA installable
- [ ] No horizontal scroll
- [ ] Safe area respected (notch)

### Performance Testing:
Run Lighthouse Mobile Audit:
- [ ] Performance: >90
- [ ] Accessibility: >95
- [ ] Best Practices: >90
- [ ] SEO: >90
- [ ] PWA: All checks pass

---

## 📊 Success Metrics

After implementation, measure:
- **Mobile Lighthouse Score:** Target >90
- **Time to Interactive:** Target <3s
- **First Input Delay:** Target <100ms
- **Cumulative Layout Shift:** Target <0.1
- **PWA Install Rate:** Track percentage of users who install
- **Mobile Bounce Rate:** Should decrease
- **Mobile Session Duration:** Should increase

---

## 🚀 Next Steps After This PR

1. **Performance optimization** (PR #25)
2. **Weekly menu system** (PR #26)
3. **Burmese language** (PR #27)

---

## 💡 Pro Tips for Codex

1. **Test frequently on real devices** - Simulators don't show haptic/touch issues
2. **Use Chrome DevTools mobile simulation** - But verify on real phones
3. **Check iOS and Android** - They behave differently
4. **Test with slow network** - Use Chrome DevTools throttling
5. **Test with different font sizes** - Accessibility is important
6. **Ask for feedback** - Have elderly users test tap targets

---

**Questions?** Check:
- `docs/MOBILE_UX_IMPLEMENTATION.md` (overview)
- `docs/MANDALAY_PRODUCTION_ROADMAP.md` (timeline)
- Or ask Claude for clarification!

**Ready to make Mandalay Morning Star mobile-first!** 📱🍜
