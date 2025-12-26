import { bad } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateYYYYMMDD, getUpcomingWeekStarts } from "@/lib/scheduling";

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
  phone: string | null;
  email: string | null;
};

type AppointmentRow = {
  id: string;
  week_of: string;
  status: string;
  notes: string | null;
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

  return `${window.day_of_week} ${window.start_time} - ${window.end_time}`;
}

export async function GET(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return bad("Admin access required.", { status: 403 });
  }

  const url = new URL(request.url);
  const requestedWeek = url.searchParams.get("week_of");
  const weekOptions = getUpcomingWeekStarts(1);
  const fallbackWeek = weekOptions[0] ?? new Date();
  const weekOf = requestedWeek ?? formatDateYYYYMMDD(fallbackWeek);

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select(
      "id, week_of, status, notes, delivery_window:delivery_windows(day_of_week,start_time,end_time), address:addresses(line1,line2,city,state,postal_code), profile:profiles(full_name,phone,email)",
    )
    .eq("week_of", weekOf)
    .order("created_at", { ascending: true });

  const rows = [
    ["Name", "Phone", "Email", "Week Of", "Window", "Address", "Notes", "Status"],
  ];

  for (const appointment of (appointments ?? []) as unknown as AppointmentRow[]) {
    const address = appointment.address;
    const addressLine = [
      address?.line1,
      address?.line2,
      [address?.city, address?.state, address?.postal_code].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");

    rows.push([
      appointment.profile?.full_name ?? "",
      appointment.profile?.phone ?? "",
      appointment.profile?.email ?? "",
      appointment.week_of ?? weekOf,
      formatWindow(
        appointment.delivery_window ?? {
          day_of_week: null,
          start_time: null,
          end_time: null,
        },
      ),
      addressLine,
      appointment.notes ?? "",
      appointment.status ?? "",
    ]);
  }

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="manifest-${weekOf}.csv"`,
    },
  });
}
