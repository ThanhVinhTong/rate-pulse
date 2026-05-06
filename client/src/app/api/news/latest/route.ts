import { MongoClient, ServerApiVersion } from "mongodb";
import { NextResponse } from "next/server";
import type { SnapshotDocument } from "@/types";

const uri = process.env.MONGO_URI!;
const dbName = process.env.MONGO_DB ?? "rate_pulse";
const collectionName = process.env.MONGO_COLLECTION ?? "news-rate-pulse";

// Reuse the MongoClient across requests in development (hot-reload safe)
let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function GET() {
  if (!uri) {
    return NextResponse.json(
      { error: "MONGO_URI environment variable is not set" },
      { status: 500 },
    );
  }

  try {
    const client = await getClient();
    const collection = client.db(dbName).collection(collectionName);

    const doc = await collection
      .find({})
      .sort({ generated_at: -1 })
      .limit(1)
      .next();

    if (!doc) {
      return NextResponse.json(
        { error: "No snapshots found in the database" },
        { status: 404 },
      );
    }

    // Serialise ObjectId → string
    const snapshot: SnapshotDocument = {
      ...doc,
      _id: doc._id.toString(),
      generated_at:
        doc.generated_at instanceof Date
          ? doc.generated_at.toISOString()
          : String(doc.generated_at),
    } as SnapshotDocument;

    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[/api/news/latest] MongoDB error:", err);
    return NextResponse.json(
      { error: "Failed to fetch latest snapshot" },
      { status: 500 },
    );
  }
}
