import DriverGuard from "@/components/auth/driver-guard";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <DriverGuard>{children}</DriverGuard>;
}
