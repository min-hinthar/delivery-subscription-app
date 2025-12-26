import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminDeliveriesPage() {
  return (
    <PlaceholderPage
      title="Deliveries"
      description="Upcoming weekend deliveries and appointment details."
      actions={[
        { label: "Route planning", href: "/admin/routes" },
        { label: "Prep summary", href: "/admin/meals" },
      ]}
    />
  );
}
