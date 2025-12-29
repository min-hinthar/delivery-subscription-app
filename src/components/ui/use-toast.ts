"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastVariant = "default" | "destructive";

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastListener = (toasts: ToastItem[]) => void;

const toastStore = {
  toasts: [] as ToastItem[],
  listeners: new Set<ToastListener>(),
};

function notify() {
  toastStore.listeners.forEach((listener) => listener([...toastStore.toasts]));
}

export function dismissToast(id: string) {
  toastStore.toasts = toastStore.toasts.filter((toast) => toast.id !== id);
  notify();
}

export function toast({ duration = 5000, ...toastItem }: Omit<ToastItem, "id">) {
  const id = crypto.randomUUID();
  const item: ToastItem = { id, duration, ...toastItem };

  toastStore.toasts = [...toastStore.toasts, item];
  notify();

  if (duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }

  return { id, dismiss: () => dismissToast(id) };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(toastStore.toasts);

  useEffect(() => {
    const listener: ToastListener = (items) => setToasts(items);
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => dismissToast(id), []);

  return { toasts, toast, dismiss };
}
