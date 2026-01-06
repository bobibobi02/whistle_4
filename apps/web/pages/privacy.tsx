import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Whistle
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Privacy Notice
          </h1>
          <p className="text-sm text-slate-400">
            This page explains in simple terms how Whistle handles basic
            account and usage data during the public beta.
          </p>
          <p className="text-[11px] text-amber-400">
            This is not formal legal advice. Before a full public launch, you
            should replace this page with a proper Privacy Policy reviewed by
            a legal professional.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Information we handle</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>
              Basic account details you provide, such as username and email.
            </li>
            <li>
              Content you create on Whistle, such as posts, comments and
              votes.
            </li>
            <li>
              Technical data needed to run the site, such as IP address and
              standard logs.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">How this data is used</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>To operate your account and keep you logged in.</li>
            <li>To display posts, comments, votes and saved content.</li>
            <li>To keep the platform secure and prevent abuse.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Sharing and third parties</h2>
          <p className="text-sm text-slate-300">
            During the beta, Whistle does not sell user data. Limited data may
            be processed by infrastructure providers that host the service or
            handle email and authentication.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Your controls</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>You can edit some profile details from the settings page.</li>
            <li>You can delete your own posts and comments.</li>
            <li>
              If you want to fully remove your account, you can contact the
              administrator using the contact details that will be provided
              before full launch.
            </li>
          </ul>
        </section>

        <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Link
            href="/terms"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            View Terms of Use
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