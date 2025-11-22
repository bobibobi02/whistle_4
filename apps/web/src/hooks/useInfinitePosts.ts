import { useCallback, useEffect, useRef, useState } from "react";

export type UseInfinitePostsPage = {
  items: any[];
  nextCursor: string | null;
};

export type UseInfinitePostsOptions = {
  fetchPage: (cursor: string | null) => Promise<UseInfinitePostsPage>;
  initialCursor?: string | null;
};

type UseInfinitePostsReturn = {
  items: any[];
  loading: boolean;
  ended: boolean;
  cursor: string | null;
  loadMore: () => void;
  reset: () => void;
  setSentinel: (el: HTMLDivElement | null) => void;
};

// Supports both:
//   useInfinitePosts(fetchPageFn)
//   useInfinitePosts({ fetchPage: fetchPageFn, initialCursor? })
export function useInfinitePosts(
  arg:
    | UseInfinitePostsOptions
    | ((cursor: string | null) => Promise<UseInfinitePostsPage>)
): UseInfinitePostsReturn {
  const fetchPage =
    typeof arg === "function" ? arg : arg.fetchPage;
  const initialCursor =
    typeof arg === "object" && arg !== null
      ? arg.initialCursor ?? null
      : null;

  if (typeof fetchPage !== "function") {
    throw new Error("useInfinitePosts: pass a fetchPage function or { fetchPage }");
  }

  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(false);

  const load = useCallback(
    async (fromCursor: string | null) => {
      if (loading || ended) return;
      setLoading(true);
      try {
        const page = await fetchPage(fromCursor);
        const newItems = page?.items ?? [];
        setItems((prev) => [...prev, ...newItems]);
        const next = page?.nextCursor ?? null;
        setCursor(next);
        if (!next || newItems.length === 0) {
          setEnded(true);
        }
      } catch {
        // swallow errors to keep UI simple
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, loading, ended]
  );

  const loadMore = useCallback(() => {
    if (!ended) {
      load(cursor);
    }
  }, [load, cursor, ended]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(initialCursor);
    setEnded(false);
  }, [initialCursor]);

  const setSentinel = useCallback((el: HTMLDivElement | null) => {
    sentinelRef.current = el;
    // Existing pages wire their own intersection observer logic.
  }, []);

  useEffect(() => {
    if (!firstLoadRef.current) {
      firstLoadRef.current = true;
      load(initialCursor);
    }
  }, [load, initialCursor]);

  return { items, loading, ended, cursor, loadMore, reset, setSentinel };
}
