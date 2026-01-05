"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 7) return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      timeoutId = window.setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

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
            Add to your home screen for quick access to weekly Burmese menus and faster
            ordering!
          </p>

          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" variant="burmese" className="flex-1">
              Install App
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="secondary">
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
