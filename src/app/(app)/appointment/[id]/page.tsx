import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { AppointmentDetails } from "@/components/appointments/AppointmentDetails";
import { PageHeader } from "@/components/layout/page-header";
import { getAppointmentDetails } from "@/lib/appointments/appointment-details";

export default async function AppointmentPage({ params }: { params: { id: string } }) {
  noStore();

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
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-100"
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
