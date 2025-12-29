import Link from "next/link";

export default function AppointmentNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Appointment not found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        We couldn’t find that appointment. It may have been removed or you may not have
        access to it.
      </p>
      <Link
        href="/schedule"
        className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-100"
      >
        Back to schedule
      </Link>
    </div>
  );
}
