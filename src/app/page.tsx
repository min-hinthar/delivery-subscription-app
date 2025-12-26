import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Morning Star Weekly Delivery
        </span>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Burmese meal prep delivered every weekend with smart scheduling and real-time
          tracking.
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Subscribe once, choose your Saturday or Sunday delivery window, and track your
          driver in real time. Admins get route planning, manifests, and prep totals.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900"
          >
            Start subscription
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-slate-200 px-5 py-3 text-sm font-medium text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:text-slate-100"
          >
            View pricing
          </Link>
        </div>
      </section>
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-900/40 dark:to-slate-800/30" />
        <div className="relative">
        <h2 className="text-lg font-semibold">What’s included</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
          <li>• Weekend delivery windows with capacity caps.</li>
          <li>• Stripe billing + self-serve portal.</li>
          <li>• Customer scheduling + live tracking view.</li>
          <li>• Admin manifests, routes, and prep summaries.</li>
        </ul>
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:text-slate-400">
          Phase 1 foundation complete — wiring live data next.
        </div>
        </div>
      </section>
    </div>
  );
}
