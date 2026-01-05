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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;
    let currentPage = 1;

    // Helper function to add footer with page numbers
    const addFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${currentPage} • Generated ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - 30,
      );
      doc.text(
        "For authorized drivers only • Confirm all deliveries in the system",
        pageWidth - margin,
        pageHeight - 30,
        { align: "right" },
      );
    };

    // Header section with branding
    let cursorY = 50;

    // Company/Service Header
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("DELIVERY ROUTE SCHEDULE", margin, cursorY);
    cursorY += 20;

    // Route name - prominent
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(route.name ?? "Delivery Route", margin, cursorY);
    cursorY += 30;

    // Metadata box with subtle background
    const metadataBoxY = cursorY;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, metadataBoxY, contentWidth, 90, "F");

    cursorY = metadataBoxY + 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600

    doc.text(`Week of: ${route.week_of}`, margin + 15, cursorY);
    cursorY += 20;

    const driverRecord = Array.isArray(route.driver)
      ? route.driver[0]
      : (route.driver as { full_name?: string | null } | null);
    const driverName = driverRecord?.full_name ?? null;
    if (driverName) {
      doc.setFont("helvetica", "bold");
      doc.text(`Driver: ${driverName}`, margin + 15, cursorY);
      doc.setFont("helvetica", "normal");
      cursorY += 20;
    }

    if (route.start_time) {
      doc.text(
        `Start Time: ${new Date(route.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
        margin + 15,
        cursorY,
      );
      cursorY += 20;
    }

    doc.text(`Total Stops: ${formattedStops.length}`, margin + 15, cursorY);

    cursorY = metadataBoxY + 105;

    // Instructions section
    doc.setFillColor(239, 246, 255); // blue-50
    doc.rect(margin, cursorY, contentWidth, 50, "F");
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text("📋 DRIVER INSTRUCTIONS", margin + 15, cursorY + 15);
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(
      "Follow the optimized sequence below. Confirm each delivery in the system upon arrival.",
      margin + 15,
      cursorY + 32,
    );
    cursorY += 65;

    // Route map with larger preview
    if (route.polyline) {
      const mapBase64 = await fetchStaticMap(route.polyline);
      if (mapBase64) {
        const mapHeight = 240;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Route Overview", margin, cursorY);
        cursorY += 15;

        doc.addImage(
          `data:image/png;base64,${mapBase64}`,
          "PNG",
          margin,
          cursorY,
          contentWidth,
          mapHeight,
        );
        cursorY += mapHeight + 20;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28); // red-700
        doc.text("⚠ Map preview unavailable. Use GPS navigation for turn-by-turn directions.", margin, cursorY);
        cursorY += 25;
      }
    }

    // Stop list header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Delivery Stops", margin, cursorY);
    cursorY += 20;

    // Add footer to first page
    addFooter();

    // Render each stop with professional formatting
    doc.setFont("helvetica", "normal");
    formattedStops.forEach((stop) => {
      const stopHeight = 75; // Estimated height for each stop block

      if (cursorY > pageHeight - 150) {
        doc.addPage();
        currentPage++;
        cursorY = 50;
        addFooter();
      }

      // Stop container with border
      const stopBoxY = cursorY;
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(1);
      doc.rect(margin, stopBoxY, contentWidth, stopHeight);

      // Stop number badge
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.circle(margin + 20, stopBoxY + 15, 12, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${stop.order}`, margin + 20, stopBoxY + 18, { align: "center" });

      // Customer name
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(stop.name, margin + 40, stopBoxY + 18);

      // ETA badge (if available)
      if (stop.eta) {
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(134, 239, 172); // green-300
        doc.roundedRect(pageWidth - margin - 85, stopBoxY + 8, 75, 20, 3, 3, "FD");
        doc.setFontSize(9);
        doc.setTextColor(22, 101, 52); // green-800
        doc.text(`ETA: ${stop.eta}`, pageWidth - margin - 47, stopBoxY + 18, { align: "center" });
      }

      cursorY = stopBoxY + 35;

      // Phone number
      if (stop.phone) {
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`📞 ${stop.phone}`, margin + 15, cursorY);
        cursorY += 15;
      }

      // Address
      if (stop.address) {
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`📍 ${stop.address}`, margin + 15, cursorY, {
          maxWidth: contentWidth - 30,
        });
      }

      cursorY = stopBoxY + stopHeight + 15;
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
