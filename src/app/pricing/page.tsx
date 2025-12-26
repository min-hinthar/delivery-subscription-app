import { PlaceholderPage } from "@/components/placeholder-page";

export default function PricingPage() {
  return (
    <PlaceholderPage
      title="Pricing"
      description="Weekly subscription pricing and plan comparison will live here."
      actions={[
        { label: "Start subscription", href: "/signup" },
        { label: "Manage account", href: "/account" },
      ]}
    />
  );
}
