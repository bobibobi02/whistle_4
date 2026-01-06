import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Whistle
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Terms of Use (Beta)
          </h1>
          <p className="text-sm text-slate-400">
            These terms describe how you may use Whistle during the public
            beta period.
          </p>
          <p className="text-[11px] text-amber-400">
            This is a simple, non-legal summary. Before a full production
            release, please consult a lawyer and replace this with official
            Terms of Service.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Using Whistle</h2>
          <p className="text-sm text-slate-300">
            By accessing or using Whistle, you agree to follow these rules and
            any additional guidelines shown inside the app. You must only use
            the service in a lawful way.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Your content</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>You are responsible for the content you post.</li>
            <li>
              Do not post illegal content, spam, or targeted harassment.
            </li>
            <li>
              By posting on Whistle you allow the platform to display and
              store your content so the service can function.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Moderation</h2>
          <p className="text-sm text-slate-300">
            Content may be removed and accounts may be limited or suspended if
            they repeatedly break the rules. See the Moderation &amp; Appeals
            page for more detail.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Beta status</h2>
          <p className="text-sm text-slate-300">
            Whistle is provided &quot;as is&quot; during the beta. Features,
            performance and availability may change without notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Changes</h2>
          <p className="text-sm text-slate-300">
            These terms may be updated. When they change, we will update this
            page. Continued use of the service after changes means you accept
            the updated terms.
          </p>
        </section>

        <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            View Privacy notice
          </Link>
          <Link
            href="/moderation"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            Moderation &amp; appeals
          </Link>
        </footer>
      </main>
    </div>
  );
}