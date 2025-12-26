import { PlaceholderPage } from "@/components/placeholder-page";

export default function OnboardingPage() {
  return (
    <PlaceholderPage
      title="Onboarding"
      description="Collect profile details and set your primary delivery address."
      actions={[
        { label: "Go to account", href: "/account" },
        { label: "Schedule delivery", href: "/schedule" },
      ]}
    />
  );
}
