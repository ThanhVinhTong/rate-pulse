import "server-only";

import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import type { SnapshotDocument, FeedArticleDoc } from "@/types";
import { getLatestSnapshot } from "@/lib/newsRepository";

const getCachedLatestSnapshot = unstable_cache(
  getLatestSnapshot,
  ["latest-news-snapshot"],
  { revalidate: 3600 },
);

/**
 * Fetch the latest pulse_intel snapshot directly from MongoDB.
 *
 * Usage (server component):
 *   const snapshot = await fetchLatestSnapshot();
 */
export async function fetchLatestSnapshot(): Promise<SnapshotDocument | null> {
  // Do not query MongoDB while Next.js is prerendering the application.
  await connection();

  try {
    return await getCachedLatestSnapshot();
  } catch (err) {
    console.error("[fetchLatestSnapshot] MongoDB error:", err);
    return null;
  }
}

export async function fetchBreakingNews(): Promise<FeedArticleDoc[] | null> {
  const data = await fetchLatestSnapshot();

  if (!data) {
    return null;
  }

  return data.feeds.world_news.slice(0, 3);
}
