import Link from "next/link";

export default function AppealsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Whistle
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Appeals
          </h1>
          <p className="text-sm text-slate-400">
            If your post, comment or account has been moderated and you
            believe this was a mistake, you can request a review.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">When to appeal</h2>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>You think we misunderstood the context of your content.</li>
            <li>You believe you did not break the rules described on the Moderation page.</li>
            <li>You fixed the issue and want to request another chance.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">What to include</h2>
          <p className="text-sm text-slate-300">
            When you contact us about an appeal, please try to include:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>Your username or the email linked to your account.</li>
            <li>A link to the post, comment or loop (if available).</li>
            <li>A short explanation of why you think the decision was incorrect.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">How to submit</h2>
          <p className="text-sm text-slate-300">
            During the beta, appeals can be sent using the contact details
            that will be provided by the project owner (for example a
            dedicated email address or form). Until then, you can keep a note
            of moderated content you want to discuss.
          </p>
        </section>

        <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Link
            href="/moderation"
            className="px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-400 transition"
          >
            Read Moderation rules
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