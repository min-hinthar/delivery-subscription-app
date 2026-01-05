import { unstable_noStore as noStore } from "next/cache";

import { AppointmentDetails } from "@/components/appointments/AppointmentDetails";
import { AppointmentModal } from "@/components/appointments/AppointmentModal";
import { getAppointmentDetails } from "@/lib/appointments/appointment-details";

export default async function AppointmentModalPage({ params }: { params: { id: string } }) {
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
    <AppointmentModal>
      {({ onClose, closeButtonRef }) => (
        <AppointmentDetails
          mode="modal"
          appointment={appointment}
          windows={windows}
          addresses={addresses}
          canEdit={canEdit}
          lockReason={lockReason}
          cutoffLabel={cutoffLabel}
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />
      )}
    </AppointmentModal>
  );
}
