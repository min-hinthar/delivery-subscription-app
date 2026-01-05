"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

type SwipeableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
};

export function SwipeableModal({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "90vh",
  showCloseButton = true,
}: SwipeableModalProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const SWIPE_THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const y = e.touches[0].clientY;
    const diff = y - startY;

    if (diff > 0) {
      setCurrentY(diff);

      if (diff > SWIPE_THRESHOLD) {
        setCurrentY(SWIPE_THRESHOLD + (diff - SWIPE_THRESHOLD) * 0.3);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (currentY > SWIPE_THRESHOLD) {
      hapticLight();
      onClose();
    }

    setCurrentY(0);
  };

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
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          currentY > 0 ? "opacity-30" : "opacity-50",
        )}
        style={{
          opacity: currentY > 0 ? Math.max(0.3, 0.5 - currentY / 500) : 0.5,
        }}
      />

      <div
        className={cn(
          "relative w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          "dark:bg-slate-950",
          "md:rounded-2xl",
        )}
        style={{
          maxHeight,
          transform: `translateY(${currentY}px)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center py-3 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-6 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-semibold">{title}</h2>
          {showCloseButton ? (
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
