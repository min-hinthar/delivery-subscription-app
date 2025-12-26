import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Morning Star Weekly Delivery",
  description: "Weekly delivery subscription app for Mandalay Morning Star.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200/60 px-6 py-4 dark:border-slate-800/60">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                <Link href="/" className="text-lg font-semibold">
                  Morning Star Delivery
                </Link>
                <div className="flex items-center gap-3 text-sm">
                  <Link
                    href="/pricing"
                    className="text-slate-500 transition hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/account"
                    className="text-slate-500 transition hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    Account
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="flex-1 px-6 py-12">
              <div className="mx-auto w-full max-w-6xl">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
