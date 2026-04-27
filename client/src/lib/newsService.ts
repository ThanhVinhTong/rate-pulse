import type { SnapshotDocument, FeedArticleDoc } from "@/types";

/**
 * Fetch the latest pulse_intel snapshot from MongoDB via the Next.js API route.
 *
 * Usage (server component):
 *   const snapshot = await fetchLatestSnapshot();
 *
 * Usage (client component / hook):
 *   const [snapshot, setSnapshot] = useState<SnapshotDocument | null>(null);
 *   useEffect(() => { fetchLatestSnapshot().then(setSnapshot); }, []);
 */
export async function fetchLatestSnapshot(): Promise<SnapshotDocument | null> {
  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost:3000" : "";
    const res = await fetch(`${baseUrl}/api/news/latest`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[fetchLatestSnapshot] API error:", res.status, body);
      return null;
    }

    return (await res.json()) as SnapshotDocument;
  } catch (err) {
    console.error("[fetchLatestSnapshot] Network error:", err);
    return null;
  }
}

export async function fetchBreakingNews(): Promise<FeedArticleDoc[] | null> {
  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost:3000" : "";
    const res = await fetch(`${baseUrl}/api/news/latest`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[fetchBreakingNews] API error:", res.status, body);
      return null;
    }

    const data: SnapshotDocument = await res.json();

    // Flatten all feed categories into a single array
    const result: FeedArticleDoc[] = data.feeds.world_news.slice(0, 3);

    return result;
  } catch (err) {
    console.error("[fetchBreakingNews] Network error:", err);
    return null;
  }
}