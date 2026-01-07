import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/navigation/site-header";
import { PageTransition } from "@/components/page-transition";

// Force dynamic rendering globally - many pages need cookies() for Supabase auth
export const dynamic = "force-dynamic";



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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100 font-sans">
        <SiteHeader/>
        <main className="flex-1 px-4 py-10 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
              <PageTransition>
                <ThemeProvider>
                    {children}
                  <Toaster />
                </ThemeProvider>
              </PageTransition>
            <Analytics />
            <SpeedInsights />
          </div>
        </main>
      </body>
    </html>
  );
}
