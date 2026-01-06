import AppGuard from "@/components/auth/app-guard";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGuard>
      <div className="relative pb-24 md:pb-8">
        {children}
        <InstallPrompt />
        <MobileBottomNav />
      </div>
    </AppGuard>
  );
}
