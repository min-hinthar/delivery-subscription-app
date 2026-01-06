import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TrackingE2EHarness } from "@/components/track/tracking-e2e-harness";

// Force dynamic rendering - E2E testing page
export const dynamic = "force-dynamic";

export default function TrackingE2EPage() {
  const isE2EEnabled =
    process.env.PLAYWRIGHT_E2E === "1" ||
    process.env.NEXT_PUBLIC_PLAYWRIGHT_E2E === "1" ||
    process.env.CODEX_VERIFY === "1" ||
    process.env.NODE_ENV === "development";

  if (!isE2EEnabled) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Tracking QA Harness"
        description="Interactive mock tracking flow for Playwright E2E coverage."
      />
      <TrackingE2EHarness />
    </div>
  );
}
