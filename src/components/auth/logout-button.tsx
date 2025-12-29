"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2 bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
