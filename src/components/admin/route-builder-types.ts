export type RouteStop = {
  id: string;
  name: string;
  address: string;
  window: string;
  day: string | null;
  postalCode: string | null;
  hasAddress: boolean;
  phone?: string | null;
};

export type DriverOption = {
  id: string;
  name: string;
};

export type RouteMetrics = {
  distanceMeters: number;
  durationSeconds: number;
};
