import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/newsRepository";

export async function GET() {
  try {
    const snapshot = await getLatestSnapshot();

    if (!snapshot) {
      return NextResponse.json(
        { error: "No snapshots found in the database" },
        { status: 404 },
      );
    }

    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[/api/news/latest] MongoDB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch latest snapshot" },
      { status: 500 },
    );
  }
}
