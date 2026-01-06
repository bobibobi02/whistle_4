import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Whistle
        </p>
        <h1 className="text-4xl font-semibold">Page not found</h1>
        <p className="text-sm text-slate-400">
          This whistle doesn&apos;t exist or may have been deleted.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition"
          >
            Go home
          </Link>
          <Link
            href="/feed"
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-100 text-sm hover:border-slate-400 transition"
          >
            Open feed
          </Link>
        </div>

        <p className="text-[11px] text-slate-500">
          If you followed a link from somewhere inside Whistle, it might be old or broken.
        </p>
      </div>
    </div>
  );
}