import { NextResponse } from "next/server";
import { z } from "zod";

import { locales } from "@/i18n";

const requestSchema = z.object({
  locale: z.enum(locales),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const validation = requestSchema.safeParse(json);

  if (!validation.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: "Invalid locale selection.",
          details: validation.error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      data: {
        locale: validation.data.locale,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );

  response.cookies.set("NEXT_LOCALE", validation.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
