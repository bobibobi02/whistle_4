import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Whistle
        </p>
        <h1 className="text-4xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          We hit an error while loading this page. The team has been notified.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-100 text-sm hover:border-slate-400 transition"
          >
            Go home
          </Link>
        </div>

        <p className="text-[11px] text-slate-500">
          If this keeps happening, please try again later.
        </p>
      </div>
    </div>
  );
}