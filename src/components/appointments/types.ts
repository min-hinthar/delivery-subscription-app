export type AppointmentStatus = "scheduled" | "locked" | "delivered" | "canceled" | string;

export type DeliveryWindowOption = {
  id: string;
  label: string; // e.g. "Saturday • 11:00 AM – 1:00 PM"
  day: "sat" | "sun" | string;
  startTime: string; // ISO time or "11:00"
  endTime: string;   // ISO time or "13:00"
};

export type AddressOption = {
  id: string;
  label: string; // e.g. "Home • 123 S Garvey Ave, West Covina, CA"
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type DeliveryAppointmentDTO = {
  id: string;
  userId: string;
  weekOf: string; // YYYY-MM-DD
  deliveryWindowId: string;
  addressId: string | null;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
};
