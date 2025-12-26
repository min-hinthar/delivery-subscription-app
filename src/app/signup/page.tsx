import { PlaceholderPage } from "@/components/placeholder-page";

export default function SignupPage() {
  return (
    <PlaceholderPage
      title="Create your account"
      description="Start a weekly subscription and schedule your first delivery."
      actions={[
        { label: "Already have an account?", href: "/login" },
        { label: "See pricing", href: "/pricing" },
      ]}
    />
  );
}
