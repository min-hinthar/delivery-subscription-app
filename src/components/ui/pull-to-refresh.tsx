"use client";

import { useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
};

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
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

      const resistance = 2;
      const adjustedDistance = Math.min(distance / resistance, maxPullDistance);

      setPullDistance(adjustedDistance);

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

  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      data-pulling={isPulling ? "true" : "false"}
    >
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
              className={cn("h-8 w-8 text-[#D4A574]", isRefreshing && "animate-spin")}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )}

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
