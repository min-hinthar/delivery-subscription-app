import { NextResponse } from "next/server";
import { z } from "zod";
import { jsPDF } from "jspdf";

import { requireAdmin } from "@/lib/auth/admin";
import { toPrintableAddress } from "@/lib/maps/google";

const exportSchema = z.object({
  route_id: z.string().uuid(),
});

const privateHeaders = { "Cache-Control": "no-store" };

type StopRow = {
  stop_order: number;
  eta: string | null;
  estimated_arrival: string | null;
  appointment: unknown;
};

async function fetchStaticMap(polyline: string) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("size", "640x320");
  url.searchParams.set("scale", "2");
  url.searchParams.set("path", `enc:${polyline}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Admin access required." } },
      { status: 403, headers: privateHeaders },
    );
  }

  try {
    const body = await request.json();
    const parsed = exportSchema.parse(body);

    const { data: route, error: routeError } = await supabase
      .from("delivery_routes")
      .select("id, name, week_of, polyline, start_time, driver:profiles(full_name)")
      .eq("id", parsed.route_id)
      .maybeSingle();

    if (routeError || !route) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Route not found." } },
        { status: 404, headers: privateHeaders },
      );
    }

    const { data: stops, error: stopsError } = await supabase
      .from("delivery_stops")
      .select(
        "stop_order, eta, estimated_arrival, appointment:delivery_appointments(profile:profiles(full_name,phone), address:addresses(line1,line2,city,state,postal_code))",
      )
      .eq("route_id", parsed.route_id)
      .order("stop_order", { ascending: true });

    if (stopsError) {
      return NextResponse.json(
        { ok: false, error: { code: "LOAD_FAILED", message: "Failed to load stops." } },
        { status: 500, headers: privateHeaders },
      );
    }

    const formattedStops = ((stops ?? []) as unknown as StopRow[]).map((stop) => {
      const appointment = Array.isArray(stop.appointment)
        ? stop.appointment[0]
        : (stop.appointment as {
            profile?: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[];
            address?: {
              line1: string | null;
              line2: string | null;
              city: string | null;
              state: string | null;
              postal_code: string | null;
            } | {
              line1: string | null;
              line2: string | null;
              city: string | null;
              state: string | null;
              postal_code: string | null;
            }[];
          } | null);
      const profile = Array.isArray(appointment?.profile)
        ? appointment?.profile[0]
        : appointment?.profile;
      const addressValue = Array.isArray(appointment?.address)
        ? appointment?.address[0]
        : appointment?.address;
      const address = addressValue
        ? toPrintableAddress({
            line1: addressValue.line1,
            line2: addressValue.line2,
            city: addressValue.city,
            state: addressValue.state,
            postal_code: addressValue.postal_code,
          })
        : "";

      const eta = stop.estimated_arrival ?? stop.eta;
      const etaLabel = eta ? new Date(eta).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

      return {
        order: stop.stop_order,
        name: profile?.full_name ?? "Stop",
        phone: profile?.phone ?? "",
        address,
        eta: etaLabel,
      };
    });

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 40;

    doc.setFontSize(18);
    doc.text(route.name ?? "Delivery Route", 40, cursorY);
    cursorY += 18;

    doc.setFontSize(11);
    doc.setTextColor("#475569");
    doc.text(`Week of ${route.week_of}`, 40, cursorY);
    cursorY += 16;

    const driverRecord = Array.isArray(route.driver)
      ? route.driver[0]
      : (route.driver as { full_name?: string | null } | null);
    const driverName = driverRecord?.full_name ?? null;
    if (driverName) {
      doc.text(`Driver: ${driverName}`, 40, cursorY);
      cursorY += 16;
    }

    if (route.start_time) {
      doc.text(
        `Start time: ${new Date(route.start_time).toLocaleString()}`,
        40,
        cursorY,
      );
      cursorY += 16;
    }

    doc.text("Driver instructions: Follow the optimized sequence and confirm arrivals.", 40, cursorY);
    cursorY += 24;

    if (route.polyline) {
      const mapBase64 = await fetchStaticMap(route.polyline);
      if (mapBase64) {
        doc.addImage(`data:image/png;base64,${mapBase64}`, "PNG", 40, cursorY, pageWidth - 80, 180);
        cursorY += 200;
      } else {
        doc.text("Map preview unavailable. Use the route sheet for navigation.", 40, cursorY);
        cursorY += 18;
      }
    }

    doc.setTextColor("#0f172a");
    doc.setFontSize(12);
    doc.text("Stop list", 40, cursorY);
    cursorY += 16;

    doc.setFontSize(10);
    formattedStops.forEach((stop) => {
      if (cursorY > 720) {
        doc.addPage();
        cursorY = 40;
      }

      doc.text(`${stop.order}. ${stop.name}`, 40, cursorY);
      cursorY += 12;
      if (stop.phone) {
        doc.text(`Phone: ${stop.phone}`, 60, cursorY);
        cursorY += 12;
      }
      if (stop.address) {
        doc.text(stop.address, 60, cursorY);
        cursorY += 12;
      }
      if (stop.eta) {
        doc.text(`ETA: ${stop.eta}`, 60, cursorY);
        cursorY += 12;
      }
      cursorY += 8;
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `route-${route.id}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        ...privateHeaders,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 422, headers: privateHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to export PDF." } },
      { status: 500, headers: privateHeaders },
    );
  }
}
