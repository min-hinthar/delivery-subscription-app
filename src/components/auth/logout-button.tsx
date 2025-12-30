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
      variant="secondary"
      className="gap-2"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isLoading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
