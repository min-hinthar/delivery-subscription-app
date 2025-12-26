import { RouteBuilder } from "@/components/admin/route-builder";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DeliveryWindow = {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
};

type Address = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type Profile = {
  full_name: string | null;
};

type AppointmentRow = {
  id: string;
  delivery_window: DeliveryWindow | null;
  address: Address | null;
  profile: Profile | null;
};

function formatWindow(window: {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
}) {
  if (!window.day_of_week || !window.start_time || !window.end_time) {
    return "";
  }

  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams?: { week_of?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const weekOptions = getUpcomingWeekStarts(4).map((date) =>
    formatDateYYYYMMDD(date),
  );
  const selectedWeek = weekOptions.includes(searchParams?.week_of ?? "")
    ? (searchParams?.week_of as string)
    : weekOptions[0];

  if (!selectedWeek) {
    return null;
  }

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select(
      "id, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name)",
    )
    .eq("week_of", selectedWeek)
    .order("created_at", { ascending: true });

  const formattedAppointments = ((appointments ?? []) as unknown as AppointmentRow[]).map(
    (appointment) => ({
    id: appointment.id,
    customer: appointment.profile?.full_name ?? "Unnamed subscriber",
    window: formatWindow(
      appointment.delivery_window ?? {
        day_of_week: null,
        start_time: null,
        end_time: null,
      },
    ),
    address: [
      appointment.address?.line1,
      appointment.address?.line2,
      [
        appointment.address?.city,
        appointment.address?.state,
        appointment.address?.postal_code,
      ]
        .filter(Boolean)
        .join(" "),
    ]
      .filter(Boolean)
      .join(", "),
    }),
  );

  return (
    <RouteBuilder
      weekOptions={weekOptions}
      selectedWeek={selectedWeek}
      appointments={formattedAppointments}
    />
  );
}
