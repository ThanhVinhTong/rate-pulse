import "server-only";

import { connection } from "next/server";
import type { SnapshotDocument, FeedArticleDoc } from "@/types";
import { getLatestSnapshot } from "@/lib/newsRepository";

/**
 * Fetch the latest pulse_intel snapshot directly from the Go API backend.
 *
 * Usage (server component):
 *   const snapshot = await fetchLatestSnapshot();
 */
export async function fetchLatestSnapshot(): Promise<SnapshotDocument | null> {
  // Do not query backend while Next.js is prerendering the application.
  await connection();

  try {
    return await getLatestSnapshot();
  } catch (err) {
    console.error("[fetchLatestSnapshot] Error fetching news snapshot:", err);
    return null;
  }
}

export async function fetchBreakingNews(): Promise<FeedArticleDoc[] | null> {
  const data = await fetchLatestSnapshot();

  if (!data) {
    return null;
  }

  return data.feeds?.world_news?.slice(0, 3) ?? [];
}
