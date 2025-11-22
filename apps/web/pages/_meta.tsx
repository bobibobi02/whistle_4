// apps/web/pages/_meta.tsx
// Small helper you can include inside <Head> to keep meta tags consistent.
export default function MetaTags() {
  return (
    <>
      {/* Open Graph */}
      <meta property="og:title" content="Whistle  A Community Platform" />
      <meta
        property="og:description"
        content="Post, comment, vote, and join communities on Whistle."
      />
      <meta property="og:image" content="/logo.png" />
      <meta property="og:url" content="https://whistle.community/" />

      {/* Twitter (fixed: use 'name', not a non-existent 'subforum' prop) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Whistle  A Community Platform" />
      <meta
        name="twitter:description"
        content="Post, comment, vote, and join communities on Whistle."
      />
      <meta name="twitter:image" content="/logo.png" />
    </>
  );
}

