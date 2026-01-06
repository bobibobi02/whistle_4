import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Whistle
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            About Whistle
          </h1>
          <p className="text-sm text-slate-400">
            Whistle is a community platform built around topic-based loops
            where people share posts, ideas and discussions without the noise
            and clutter of traditional social feeds.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What we&apos;re building</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The idea behind Whistle is simple: you pick the loops you care
            about and everything else stays out of your way. No infinite
            scroll of unrelated content, just focused threads around the
            topics you actually want to follow.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Posts can include images and context, and each discussion is kept
            clean and readable with clear voting, replies and saved posts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Public beta</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Whistle is currently in a public beta phase. This means things
            can still change, features may be added or adjusted, and there
            might be occasional bugs or rough edges.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            If you notice something broken or have ideas for improvements,
            your feedback is extremely valuable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to get started</h2>
          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
            <li>Create an account or log in.</li>
            <li>Browse the feed or open specific loops that interest you.</li>
            <li>Create your own posts with an image and short context.</li>
            <li>Comment, vote and save posts you want to revisit.</li>
          </ol>
        </section>

        <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Ready to explore?</span>
          <Link
            href="/feed"
            className="px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition"
          >
            Open feed
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