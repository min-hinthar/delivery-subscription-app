import { Suspense } from "react";

import { WeeklyMenuSkeleton } from "@/components/menu/weekly-menu-skeleton";
import { WeeklyMenuView } from "@/components/menu/weekly-menu-view";

export const metadata = {
  title: "This Week's Menu | Mandalay Morning Star",
  description: "View this week's authentic Burmese dishes and order your package.",
};

// Force dynamic rendering - client components with browser APIs need runtime rendering
export const dynamic = "force-dynamic";

export default function WeeklyMenuPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<WeeklyMenuSkeleton />}>
        <WeeklyMenuView />
      </Suspense>
    </div>
  );
}
