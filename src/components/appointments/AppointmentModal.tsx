"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SwipeableModal } from "@/components/ui/swipeable-modal";

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
    <SwipeableModal
      isOpen
      onClose={handleClose}
      title="Appointment details"
      showCloseButton={false}
    >
      {children({ onClose: handleClose, closeButtonRef })}
    </SwipeableModal>
  );
}
