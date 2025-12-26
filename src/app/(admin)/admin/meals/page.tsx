import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminMealsPage() {
  return (
    <PlaceholderPage
      title="Meals & templates"
      description="Configure meal items and weekly template defaults."
      actions={[
        { label: "Subscriptions", href: "/admin/subscriptions" },
        { label: "Back to dashboard", href: "/admin" },
      ]}
    />
  );
}
