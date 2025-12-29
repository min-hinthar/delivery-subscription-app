"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type AppointmentModalProps = {
  children: (props: {
    onClose: () => void;
    closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  }) => React.ReactNode;
};

export function AppointmentModal({ children }: AppointmentModalProps) {
  const router = useRouter();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  React.useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity motion-reduce:transition-none"
        aria-label="Close appointment details"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Appointment details"
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl transition-transform motion-reduce:transition-none dark:bg-slate-950"
      >
        {children({ onClose: handleClose, closeButtonRef })}
      </div>
    </div>
  );
}
