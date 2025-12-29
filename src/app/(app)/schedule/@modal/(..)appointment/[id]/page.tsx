import { unstable_noStore as noStore } from "next/cache";

import { AppointmentDetails } from "@/components/appointments/AppointmentDetails";
import { AppointmentModal } from "@/components/appointments/AppointmentModal";
import { getAppointmentDetails } from "@/lib/appointments/appointment-details";

export default async function AppointmentModalPage({ params }: { params: { id: string } }) {
  noStore();

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
