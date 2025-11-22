// pages/translate.tsx
import Head from "next/head";
import TranslationForm from "@/components/TranslationForm";
import TranslationList from "@/components/TranslationList";

export default function TranslatePage() {
  const defaultLocale = "en";
  const defaultKey = "common.welcome";

  return (
    <>
      <Head>
        <title>Translate  Whistle</title>
      </Head>
      <main className="container max-w-2xl mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Translations</h1>

        <section className="rounded border p-4 bg-white">
          <h2 className="font-medium mb-3">Add / Update a Translation</h2>
          <TranslationForm
            locale={defaultLocale as any}
            key={defaultKey as any}
            onSuccess={() => {}}
          />
        </section>

        <section className="rounded border p-4 bg-white">
          <h2 className="font-medium mb-3">Existing Translations</h2>
          <TranslationList locale={defaultLocale as any} key={defaultKey as any} />
        </section>
      </main>
    </>
  );
}

