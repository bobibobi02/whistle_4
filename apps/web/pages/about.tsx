import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">About Whistle</h1>

      <p>
        Whistle is a modern discussion platform inspired by forums and Reddit,
        but designed with a clean interface and simple interaction: create a
        post, choose a loop (topic), and start a conversation.
      </p>

      <p>
        Our goal is to make it easy to share ideas, ask questions, and discover
        new content without being overwhelmed by noise. Upvotes and downvotes
        help the best content rise, while nested comments keep discussions easy
        to follow.
      </p>

      <p>
        This is an early beta version of Whistle. Things may change or break,
        but your feedback is very valuable and will help improve the platform.
      </p>

      <div className="flex flex-wrap gap-4 pt-4">
        <Link
          href="/terms"
          className="text-green-400 underline hover:text-green-300"
        >
          Terms of Service
        </Link>
        <Link
          href="/privacy"
          className="text-green-400 underline hover:text-green-300"
        >
          Privacy Policy
        </Link>
      </div>
    </main>
  );
}
