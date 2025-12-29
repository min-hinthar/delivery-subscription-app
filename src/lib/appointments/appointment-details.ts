import { z } from "zod";
import { notFound } from "next/navigation";

import type {
  AddressOption,
  DeliveryAppointmentDTO,
  DeliveryWindowOption,
} from "@/components/appointments/types";
import { getCutoffForWeek, isAfterCutoff, PT_TIME_ZONE } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AppointmentIdSchema = z.string().uuid();

type AppointmentDetailsData = {
  appointment: DeliveryAppointmentDTO;
  windows: DeliveryWindowOption[];
  addresses: AddressOption[];
  canEdit: boolean;
  lockReason: string | null;
  cutoffLabel: string | null;
};

function formatWindowLabel(window: {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
}) {
  if (!window.day_of_week || !window.start_time || !window.end_time) {
    return "Window TBD";
  }

  return `${window.day_of_week} ${window.start_time}–${window.end_time}`;
}

function formatAddressLabel(address: {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_primary: boolean | null;
}) {
  const line = [address.line1, address.line2].filter(Boolean).join(" ");
  const cityState = [address.city, address.state, address.postal_code].filter(Boolean).join(" ");
  const label = [line, cityState].filter(Boolean).join(", ");
  const prefix = address.is_primary ? "Primary" : "Address";

  return label ? `${prefix} • ${label}` : prefix;
}

function formatCutoffLabel(date: Date) {
  return date.toLocaleString("en-US", {
    timeZone: PT_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function getAppointmentDetails(id: string): Promise<AppointmentDetailsData> {
  if (!AppointmentIdSchema.safeParse(id).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    notFound();
  }

  const { data: appointment } = await supabase
    .from("delivery_appointments")
    .select(
      "id, user_id, week_of, delivery_window_id, address_id, notes, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!appointment || appointment.user_id !== auth.user.id) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { data: windows } = await supabase
    .from("delivery_windows")
    .select("id, day_of_week, start_time, end_time")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, line1, line2, city, state, postal_code, is_primary")
    .eq("user_id", auth.user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const weekDate = new Date(`${appointment.week_of}T00:00:00Z`);
  const cutoffDate = Number.isNaN(weekDate.getTime()) ? null : getCutoffForWeek(weekDate);
  const isLocked = cutoffDate ? isAfterCutoff(weekDate) : false;
  const cutoffLabel = cutoffDate ? formatCutoffLabel(cutoffDate) : null;

  return {
    appointment: {
      id: appointment.id,
      userId: appointment.user_id,
      weekOf: appointment.week_of,
      deliveryWindowId: appointment.delivery_window_id,
      addressId: appointment.address_id,
      notes: appointment.notes,
      status: appointment.status ?? "scheduled",
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
    },
    windows:
      windows?.map((window) => ({
        id: window.id,
        label: formatWindowLabel(window),
        day: window.day_of_week ?? "",
        startTime: window.start_time ?? "",
        endTime: window.end_time ?? "",
      })) ?? [],
    addresses:
      addresses?.map((address) => ({
        id: address.id,
        label: formatAddressLabel(address),
        line1: address.line1 ?? undefined,
        city: address.city ?? undefined,
        state: address.state ?? undefined,
        postalCode: address.postal_code ?? undefined,
      })) ?? [],
    canEdit: !isLocked || Boolean(profile?.is_admin),
    lockReason: isLocked
      ? `Changes lock after ${cutoffLabel ?? "Friday 5:00 PM PT"} for this week.`
      : null,
    cutoffLabel,
  };
}
