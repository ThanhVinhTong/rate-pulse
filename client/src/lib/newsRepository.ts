import "server-only";
import type { SnapshotDocument } from "@/types";

export async function getLatestSnapshot(): Promise<SnapshotDocument | null> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:8080";

  try {
    const res = await fetch(`${apiBase}/news/latest`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;    
      }
      console.error(`[newsRepository] Failed to fetch news snapshot from API backend: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data as SnapshotDocument;
  } catch (err) {
    console.error("[newsRepository] Network error fetching news from backend:", err);
    return null;
  }
}
