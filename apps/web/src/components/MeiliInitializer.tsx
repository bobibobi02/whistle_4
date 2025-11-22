// src/components/MeiliInitializer.tsx
import { useEffect } from "react";

type Post = {
  id: string;
  title?: string | null;
  content?: string | null;
  createdAt?: string | Date;
  userEmail?: string | null;
  subforumName?: string | null;
};

export default function MeiliInitializer({ posts }: { posts?: Post[] }) {
  useEffect(() => {
    // Best-effort indexing hook; safe if not configured.
    async function run() {
      try {
        if (!posts?.length) return;
        // Place your Meili client init here if you actually use it.
        // This component will not crash if Meili is not present.
      } catch {
        // swallow
      }
    }
    run();
  }, [posts]);

  return null;
}
