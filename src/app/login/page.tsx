import { PlaceholderPage } from "@/components/placeholder-page";

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Login"
      description="Sign in with email or magic link to manage deliveries."
      actions={[
        { label: "Create an account", href: "/signup" },
        { label: "Pricing", href: "/pricing" },
      ]}
    />
  );
}
