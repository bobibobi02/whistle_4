import React from "react";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-gray-400">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. What is Whistle?</h2>
        <p>
          Whistle is a social platform where users can create posts, share
          opinions, and participate in discussions in different loops
          (communities). By using Whistle, you agree to these Terms of Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Your account</h2>
        <p>
          You are responsible for all activity that happens under your account.
          Do not share your login details with other people and do not use
          another person&apos;s account without permission.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Content you post</h2>
        <p>
          You are responsible for the content you create and share on Whistle.
          Do not post illegal content, hate speech, harassment, spam, or any
          content that violates the rights of other people (including privacy
          and intellectual property rights).
        </p>
        <p>
          By posting on Whistle, you keep ownership of your content, but you
          grant us a limited license to store and display it for the purpose of
          running the service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Moderation</h2>
        <p>
          We may remove content or restrict accounts that violate these terms or
          applicable law. We are not responsible for user-generated content, but
          we may act if content is reported as illegal or harmful.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Service availability</h2>
        <p>
          We do not guarantee that Whistle will always be available or free from
          errors. We may change or stop parts of the service at any time.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>
          If you have questions about these terms, you can contact the Whistle
          team at{" "}
          <a
            href="mailto:contact@example.com"
            className="text-green-400 underline"
          >
            contact@example.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
