import React from "react";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-400">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Information we collect</h2>
        <p>
          When you use Whistle, we may collect information such as your email
          address, username, and basic usage data (for example, which pages you
          visit and what posts you create).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. How we use your information</h2>
        <p>
          We use this information to provide and improve the Whistle service,
          including:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Authenticating you and keeping your account secure.</li>
          <li>Displaying posts, comments, and loops.</li>
          <li>Preventing abuse and spam.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Cookies</h2>
        <p>
          Whistle may use cookies or similar technologies to keep you logged in
          and remember your preferences (such as theme or language).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Sharing of data</h2>
        <p>
          We do not sell your personal data. We may share limited information
          with service providers (for example, for hosting or analytics) who
          help us run Whistle, under appropriate data protection agreements.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, or
          delete your personal data. To make a request, contact us at{" "}
          <a
            href="mailto:privacy@example.com"
            className="text-green-400 underline"
          >
            privacy@example.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, you can contact us at{" "}
          <a
            href="mailto:privacy@example.com"
            className="text-green-400 underline"
          >
            privacy@example.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
