import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const shouldSkipFontOptimization = process.env.SKIP_FONT_OPTIMIZATION === "1";

async function getFontVariables() {
  if (shouldSkipFontOptimization) {
    return "";
  }

  const { Noto_Sans, Noto_Sans_Myanmar } = await import("next/font/google");
  const notoSans = Noto_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
  });

  const notoSansMyanmar = Noto_Sans_Myanmar({
    subsets: ["myanmar"],
    variable: "--font-myanmar",
    weight: ["400", "500", "600", "700"],
  });

  return `${notoSans.variable} ${notoSansMyanmar.variable}`;
}

export const metadata: Metadata = {
  title: "Morning Star Weekly Delivery",
  description: "Weekly delivery subscription app for Mandalay Morning Star.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mandalay Star",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/app-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icons/app-icon.svg", type: "image/svg+xml" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4A574" },
    { media: "(prefers-color-scheme: dark)", color: "#8B4513" },
  ],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale = "en";

  try {
    locale = await getLocale();
  } catch {
    locale = "en";
  }
  const fontVariables = await getFontVariables();

  return (
    <html
      lang={locale}
      className={fontVariables || "font-sans"}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen bg-white text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100 ${
          locale === "my" ? "font-myanmar" : "font-sans"
        }`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
