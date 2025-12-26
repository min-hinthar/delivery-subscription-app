import AppGuard from "@/components/auth/app-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppGuard>{children}</AppGuard>;
}
