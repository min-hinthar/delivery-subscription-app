"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button className="w-full justify-center md:w-auto" disabled>
        Theme
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="ghost"
      className="group relative w-full justify-center gap-2.5 overflow-hidden rounded-full border border-border/40 bg-gradient-to-br from-background/95 to-muted/30 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md md:w-auto"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
    >
      <div className="relative flex items-center gap-2.5">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-500 transition-all group-hover:rotate-90 group-hover:scale-110" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500 transition-all group-hover:-rotate-12 group-hover:scale-110" aria-hidden="true" />
        )}
        <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {isDark ? "Light" : "Dark"}
        </span>
      </div>
    </Button>
  );
}
