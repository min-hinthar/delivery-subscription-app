import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { AppointmentDetails } from "@/components/appointments/AppointmentDetails";
import { PageHeader } from "@/components/layout/page-header";
import { getAppointmentDetails } from "@/lib/appointments/appointment-details";

export default async function AppointmentPage({ params }: { params: { id: string } }) {
  noStore();

  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to view
          appointments.
        </p>
      </div>
    );
  }

  const { appointment, windows, addresses, canEdit, lockReason, cutoffLabel } =
    await getAppointmentDetails(params.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Appointment details"
        description="Review and update your upcoming delivery window."
        cta={
          <Link
            href="/schedule"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Back to schedule
          </Link>
        }
      />
      <AppointmentDetails
        mode="page"
        appointment={appointment}
        windows={windows}
        addresses={addresses}
        canEdit={canEdit}
        lockReason={lockReason}
        cutoffLabel={cutoffLabel}
      />
    </div>
  );
}
