import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { requireDriver } from "@/lib/auth/driver";
import { getDriverRouteSummaries } from "@/lib/driver/route-summary";

const privateHeaders = { "Cache-Control": "no-store" };

const querySchema = z.object({
  status: z.enum(["pending", "active", "completed"]).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function GET(request: Request) {
  const { supabase, user, driver } = await requireDriver();

  if (!user) {
    return bad("Authentication required.", { status: 401, headers: privateHeaders });
  }

  if (!driver) {
    return bad("Driver access required.", { status: 403, headers: privateHeaders });
  }

  if (driver.status !== "active") {
    return bad("Driver profile inactive.", { status: 403, headers: privateHeaders });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
  });

  if (!parsed.success) {
    return bad("Invalid query parameters.", {
      status: 422,
      details: parsed.error.flatten(),
      headers: privateHeaders,
    });
  }

  let dateStart: string | null = null;
  let dateEnd: string | null = null;

  if (parsed.data.date) {
    const [year, month, day] = parsed.data.date.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    dateStart = start.toISOString();
    dateEnd = end.toISOString();
  }

  const routes = await getDriverRouteSummaries({
    supabase,
    driverId: user.id,
    status: parsed.data.status ?? null,
    dateStart,
    dateEnd,
  });

  return ok({ routes }, { headers: privateHeaders });
}
