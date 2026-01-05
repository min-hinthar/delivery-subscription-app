import { Card } from "@/components/ui/card";

export function WeeklyMenuSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto h-4 w-64 rounded-full bg-slate-100 dark:bg-slate-900" />
      </div>

      <Card className="border border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-32 rounded-full bg-slate-100 dark:bg-slate-900" />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 w-24 rounded-lg bg-slate-100 dark:bg-slate-900"
          />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="h-40 w-full bg-slate-100 dark:bg-slate-900 md:h-auto md:w-64" />
              <div className="flex-1 space-y-3 p-6">
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-56 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-900" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
