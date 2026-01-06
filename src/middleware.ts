import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export default function middleware(request: NextRequest) {
  // Handle API routes, Next.js internals, and static files - skip locale handling
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__e2e__") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif|gif|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Apply next-intl middleware for locale handling
  const response = intlMiddleware(request);

  // Read existing locale cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;

  // Extract locale from the response URL (after intl middleware processing)
  const responseUrl = response.headers.get("x-middleware-request-x-nextjs-data")
    ? request.nextUrl.pathname
    : response.url;

  const localeFromPath = locales.find((locale) =>
    responseUrl.includes(`/${locale}`)
  );

  // If locale from path differs from cookie, update cookie
  if (localeFromPath && localeFromPath !== cookieLocale) {
    response.cookies.set("NEXT_LOCALE", localeFromPath, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // If no cookie exists but we have a locale from path, set it
  if (!cookieLocale && localeFromPath) {
    response.cookies.set("NEXT_LOCALE", localeFromPath, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (all files with an extension)
  matcher: ["/((?!api|_next|__e2e__|.*\\..*).*)"],
};
