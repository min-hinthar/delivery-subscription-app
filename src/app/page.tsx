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
            className="rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
          >
            Start subscription
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-slate-200 px-5 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 dark:border-slate-800 dark:text-slate-100"
          >
            View pricing
          </Link>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">What’s included</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
          <li>• Weekend delivery windows with capacity caps.</li>
          <li>• Stripe billing + self-serve portal.</li>
          <li>• Customer scheduling + live tracking view.</li>
          <li>• Admin manifests, routes, and prep summaries.</li>
        </ul>
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Phase 1 foundation complete — wiring live data next.
        </div>
      </section>
    </div>
  );
}
