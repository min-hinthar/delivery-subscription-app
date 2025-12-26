import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminHomePage() {
  return (
    <PlaceholderPage
      title="Admin dashboard"
      description="Manage deliveries, routes, meals, and subscriptions."
      actions={[
        { label: "Deliveries", href: "/admin/deliveries" },
        { label: "Routes", href: "/admin/routes" },
        { label: "Meals", href: "/admin/meals" },
        { label: "Subscriptions", href: "/admin/subscriptions" },
      ]}
    />
  );
}
