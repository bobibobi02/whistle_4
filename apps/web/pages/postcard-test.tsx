// pages/postcard-test.tsx
import Head from "next/head";
import PostCard from "@/components/post-card/PostCard";

export default function PostCardTest() {
  // Demo data for the card; cast to any so we don't fight PostCard's exact props here.
  const demo: any = {
    postId: "demo-post-1",
    user: { name: "Test User", email: "test@example.com" },
    avatarUrl: "/icons/whistle-glow-512.png",
    timestamp: new Date().toISOString(),
    title: "Hello World",
    content:
      "This is a demo post used on /postcard-test to visually verify the PostCard layout with some sample text.",
    mediaUrl: "/icons/whistle-glow-512.png",
    likesCount: 42,
    commentsCount: 7,
    // Optional handlers used in this test page; the real PostCard type may not declare them.
    onLike: () => console.log("like"),
    onComment: () => console.log("comment"),
    onShare: () => console.log("share"),
    onRetry: () => console.log("retry"),
  };

  return (
    <>
      <Head>
        <title>PostCard Demo  Whistle</title>
      </Head>
      <main className="container max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">PostCard Demo</h1>
        {/* We intentionally relax typing for this dev-only demo page */}
        {/* @ts-ignore */}
        <PostCard {...demo} />
      </main>
    </>
  );
}

