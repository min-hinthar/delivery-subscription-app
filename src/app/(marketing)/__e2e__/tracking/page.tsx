import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TrackingE2EHarness } from "@/components/track/tracking-e2e-harness";

export default function TrackingE2EPage() {
  if (!process.env.PLAYWRIGHT_E2E && process.env.CODEX_VERIFY !== "1") {
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
