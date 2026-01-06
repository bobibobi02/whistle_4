import Link from "next/link";

export default function ModerationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Whistle
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Moderation &amp; Rules
          </h1>
          <p className="text-sm text-slate-400">
            A quick overview of how moderation works on Whistle during the
            public beta.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Core principles</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>Keep discussions respectful and on topic.</li>
            <li>No illegal content, hate speech or explicit threats.</li>
            <li>No spam, scams or automated posting abuse.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">What may be removed</h2>
          <p className="text-sm text-slate-300">
            Content may be removed, and accounts may be limited or suspended,
            for example if they:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>Share illegal or highly unsafe material.</li>
            <li>Target individuals or groups with harassment or threats.</li>
            <li>Flood loops with repetitive, low-quality or automated posts.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Who moderates</h2>
          <p className="text-sm text-slate-300">
            During the beta, moderation is handled by the small core team.
            Over time, moderation tools for trusted users and loop admins may
            be introduced.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">If you think we made a mistake</h2>
          <p className="text-sm text-slate-300">
            Mistakes can happen. If you believe your content or account was
            moderated unfairly, you can submit an appeal from the dedicated
            Appeals page.
          </p>
        </section>

        <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Link
            href="/appeals"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            Go to Appeals
          </Link>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            Go home
          </Link>
        </footer>
      </main>
    </div>
  );
}