import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminSubscriptionsPage() {
  return (
    <PlaceholderPage
      title="Subscriptions"
      description="View subscriber status, billing health, and exceptions."
      actions={[
        { label: "Back to dashboard", href: "/admin" },
        { label: "Deliveries", href: "/admin/deliveries" },
      ]}
    />
  );
}
