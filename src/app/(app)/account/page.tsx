import { PlaceholderPage } from "@/components/placeholder-page";

export default function AccountPage() {
  return (
    <PlaceholderPage
      title="Account"
      description="Manage your profile, addresses, and subscription status."
      actions={[
        { label: "Schedule delivery", href: "/schedule" },
        { label: "Track delivery", href: "/track" },
      ]}
    />
  );
}
