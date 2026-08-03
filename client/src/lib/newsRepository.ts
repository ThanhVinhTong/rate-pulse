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

/**
 * Fetch latest snapshot via MongoDB Atlas Data API (HTTPS REST).
 * Best practice for Edge Runtimes (Cloudflare Workers) — zero persistent TCP sockets.
 */
async function getLatestSnapshotViaDataApi(): Promise<SnapshotDocument | null> {
  const endpoint = process.env.MONGO_ATLAS_DATA_API_URL;
  const apiKey = process.env.MONGO_ATLAS_DATA_API_KEY;
  const clusterName = process.env.MONGO_ATLAS_CLUSTER_NAME ?? "Cluster0";
  const dbName = process.env.MONGO_DB ?? "rate_pulse";
  const collectionName = process.env.MONGO_COLLECTION ?? "news-rate-pulse";

  if (!endpoint || !apiKey) {
    return null;
  }

  const url = endpoint.endsWith("/")
    ? `${endpoint}action/findOne`
    : `${endpoint}/action/findOne`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      dataSource: clusterName,
      database: dbName,
      collection: collectionName,
      sort: { generated_at: -1 },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`MongoDB Data API HTTP Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const doc = data.document;

  if (!doc) {
    return null;
  }

  return {
    ...doc,
    _id: typeof doc._id === "object" ? doc._id.$oid ?? String(doc._id) : String(doc._id),
    generated_at: typeof doc.generated_at === "string" ? doc.generated_at : new Date(doc.generated_at).toISOString(),
  } as SnapshotDocument;
}

export async function getLatestSnapshot(): Promise<SnapshotDocument | null> {
  if (process.env.MONGO_ATLAS_DATA_API_URL && process.env.MONGO_ATLAS_DATA_API_KEY) {
    return getLatestSnapshotViaDataApi();
  }

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

