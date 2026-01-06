import createMiddleware from "next-intl/middleware";

import { locales } from "./src/i18n";

export default createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
