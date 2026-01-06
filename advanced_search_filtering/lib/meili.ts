export type MeiliPost = any;
export type MeiliSearchParams = any;
export type MeiliSearchResult = {
  hits: any[];
  query: string;
  limit: number;
  offset: number;
  total: number;
};

// Stub MeiliSearch helpers used only in early experiments.
// In the current Whistle beta they do nothing so they don't affect
// the live app, but they keep TypeScript / Next.js builds happy.
export async function indexPost(post: MeiliPost): Promise<void> {
  if (!post) return;

  if (process.env.NODE_ENV !== "production") {
    try {
      // eslint-disable-next-line no-console
      console.debug("[meili] indexPost stub called for", (post as any)?.id ?? "(no id)");
    } catch {
      // ignore
    }
  }
}

// Accept any arguments so existing calls like
// searchPosts(q, filters, limit) keep working.
export async function searchPosts(..._args: any[]): Promise<MeiliSearchResult> {
  const params = _args[0] ?? {};
  return {
    hits: [],
    query: (params as any)?.q ?? "",
    limit: (params as any)?.limit ?? 0,
    offset: (params as any)?.offset ?? 0,
    total: 0,
  };
}