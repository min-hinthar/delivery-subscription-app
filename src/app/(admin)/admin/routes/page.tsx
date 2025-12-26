import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminRoutesPage() {
  return (
    <PlaceholderPage
      title="Route planning"
      description="Build delivery routes, assign stops, and generate ETAs."
      actions={[
        { label: "View deliveries", href: "/admin/deliveries" },
        { label: "Manifest export", href: "/admin/deliveries" },
      ]}
    />
  );
}
