import { PlaceholderPage } from "@/components/placeholder-page";

export default function SchedulePage() {
  return (
    <PlaceholderPage
      title="Schedule delivery"
      description="Choose your Saturday or Sunday delivery window before the Friday cutoff."
      actions={[
        { label: "View account", href: "/account" },
        { label: "Track delivery", href: "/track" },
      ]}
    />
  );
}
