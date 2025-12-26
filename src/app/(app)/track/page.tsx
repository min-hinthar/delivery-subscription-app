import { PlaceholderPage } from "@/components/placeholder-page";

export default function TrackPage() {
  return (
    <PlaceholderPage
      title="Track delivery"
      description="See live driver progress and upcoming stop ETAs."
      actions={[
        { label: "Schedule delivery", href: "/schedule" },
        { label: "Account settings", href: "/account" },
      ]}
    />
  );
}
