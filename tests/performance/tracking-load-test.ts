import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SESSION_COUNT = Number(process.env.TRACKING_LOAD_USERS || 100);
const DURATION_MINUTES = Number(process.env.TRACKING_LOAD_DURATION_MINUTES || 60);
const SNAPSHOT_INTERVAL_SECONDS = Number(
  process.env.TRACKING_LOAD_SNAPSHOT_INTERVAL_SECONDS || 60,
);

async function runLoadTest() {
  const browser: Browser = await chromium.launch();
  const contexts: BrowserContext[] = await Promise.all(
    Array.from({ length: SESSION_COUNT }, () =>
      browser.newContext({
        viewport: { width: 1280, height: 720 },
      }),
    ),
  );

  const pages: Page[] = await Promise.all(
    contexts.map(async (context) => {
      const page: Page = await context.newPage();
      await page.goto(`${BASE_URL}/__e2e__/tracking`, { waitUntil: "domcontentloaded" });
      return page;
    }),
  );

  const start = Date.now();
  let snapshotIndex = 0;

  while (Date.now() - start < DURATION_MINUTES * 60_000) {
    await Promise.all(
      pages.map(async (page: Page, index: number) => {
        if (index % 3 === 0) {
          await page.getByTestId("tracking-update-eta").click();
        } else if (index % 3 === 1) {
          await page.getByTestId("tracking-driver-nearby").click();
        } else {
          await page.getByTestId("tracking-advance-stop").click();
        }
      }),
    );

    if (snapshotIndex % Math.max(1, SNAPSHOT_INTERVAL_SECONDS / 5) === 0) {
      const memory = process.memoryUsage();
      console.log(
        `[snapshot ${snapshotIndex}] heapUsed=${Math.round(
          memory.heapUsed / 1024 / 1024,
        )}MB rss=${Math.round(memory.rss / 1024 / 1024)}MB`,
      );
    }

    snapshotIndex += 1;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await Promise.all(pages.map((page: Page) => page.close()));
  await Promise.all(contexts.map((context: BrowserContext) => context.close()));
  await browser.close();
}

runLoadTest().catch((error) => {
  console.error("Tracking load test failed", error);
  process.exit(1);
});
