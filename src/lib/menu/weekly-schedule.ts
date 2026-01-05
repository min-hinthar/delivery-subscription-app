const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeekNumberForDate(weekStartDate: string) {
  const date = new Date(`${weekStartDate}T00:00:00Z`);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / DAY_MS) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);
  return ((weekNumber - 1) % 4) + 1;
}

export function getWeeklyMenuDeadline(weekStartDate: string) {
  const deadline = new Date(`${weekStartDate}T00:00:00Z`);
  deadline.setUTCDate(deadline.getUTCDate() + 3);
  deadline.setUTCHours(23, 59, 59, 999);
  return deadline.toISOString();
}

export function getWeeklyMenuDeliveryDate(weekStartDate: string) {
  const delivery = new Date(`${weekStartDate}T00:00:00Z`);
  delivery.setUTCDate(delivery.getUTCDate() + 6);
  return delivery.toISOString().split("T")[0];
}
