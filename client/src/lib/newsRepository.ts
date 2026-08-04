import "server-only";

import { MongoClient, ServerApiVersion } from "mongodb";
import type { SnapshotDocument } from "@/types";

let cachedClientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    cachedClientPromise = client.connect().catch((error) => {
      cachedClientPromise = null;
      throw error;
    });
  }

  return cachedClientPromise;
}

export async function getLatestSnapshot(): Promise<SnapshotDocument | null> {
  const dbName = process.env.MONGO_DB ?? "rate_pulse";
  const collectionName = process.env.MONGO_COLLECTION ?? "news-rate-pulse";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const client = await getClient();
      const doc = await client
        .db(dbName)
        .collection(collectionName)
        .find({})
        .sort({ generated_at: -1 })
        .limit(1)
        .next();

      if (!doc) {
        return null;
      }

      return {
        ...doc,
        _id: doc._id.toString(),
        generated_at:
          doc.generated_at instanceof Date
            ? doc.generated_at.toISOString()
            : String(doc.generated_at),
      } as SnapshotDocument;
    } catch (err: any) {
      cachedClientPromise = null;
      if (attempt === 1) {
        throw err;
      }
    }
  }

  return null;
}

