import "server-only";

import { getValidAccessToken } from "@/lib/auth";
import type {
  ExchangeRateType,
  RateSource,
  ExchangeSnapshotResponse,
} from "@/types";

// Backend base URL for exchange data.
const API_BASE_URL = "https://api.rate-pulse.me";
// Default page size for cursor pagination.
const DEFAULT_LIMIT = 100;
// Hard cap for page-based fallback loops.
const DEFAULT_MAX_PAGES = 100;

type ApiErrorShape = { error?: string };

export interface ApiExchangeRateRow {
  rate_id: number;
  rate_value: string;
  source_currency_id: number;
  destination_currency_id: number;
  source_id: number | null;
  type_id: number | null;
  valid_from_date: string | null;
  valid_to_date: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

type ApiExchangeRateWire = Partial<ApiExchangeRateRow> & {
  RateID?: number;
  RateValue?: string;
  SourceCurrencyID?: number;
  DestinationCurrencyID?: number;
  SourceID?: { Int32: number; Valid: boolean } | null;
  TypeID?: { Int32: number; Valid: boolean } | null;
  ValidFromDate?: string | null;
  ValidToDate?: string | null;
  UpdatedAt?: string | null;
  CreatedAt?: string | null;
};

// Build auth headers from the current session.
async function getAuthHeaders() {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("Missing access token");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Execute authenticated GET requests.
async function apiGet<T>(
  path: string,
  options?: {
    cache?: RequestCache;
    revalidateSeconds?: number;
  },
): Promise<T> {
  const headers = await getAuthHeaders();
  const { cache = "no-store", revalidateSeconds } = options ?? {};
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
    cache,
    ...(typeof revalidateSeconds === "number" ? { next: { revalidate: revalidateSeconds } } : {}),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorShape;
    throw new Error(body.error || `GET ${path} failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

// Fetch all pages from legacy page_id/page_size endpoints.
export async function fetchAllPages<T>(
  path: string,
  pageSize = 10,
  maxPages = DEFAULT_MAX_PAGES,
  options?: {
    cache?: RequestCache;
    revalidateSeconds?: number;
  },
): Promise<T[]> {
  const headers = await getAuthHeaders();
  const { cache = "no-store", revalidateSeconds } = options ?? {};
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const res = await fetch(`${API_BASE_URL}${path}?page_id=${page}&page_size=${pageSize}`, {
      method: "GET",
      headers,
      cache,
      ...(typeof revalidateSeconds === "number" ? { next: { revalidate: revalidateSeconds } } : {}),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiErrorShape;
      throw new Error(body.error || `GET ${path} failed: ${res.status}`);
    }

    const pageItems = (await res.json()) as T[];
    items.push(...pageItems);

    if (pageItems.length < pageSize) {
      break;
    }
  }

  return items;
}

// Fetch rates with cursor pagination.
export async function fetchExchangeRatesAfter(lastRateId = 0, limit = DEFAULT_LIMIT) {
  const rows = await apiGet<ApiExchangeRateWire[]>(
    `/exchange-rates?last_rate_id=${lastRateId}&limit=${limit}`,
  );
  return rows
    .map((row) => ({
      rate_id: row.rate_id ?? row.RateID ?? 0,
      rate_value: row.rate_value ?? row.RateValue ?? "0",
      source_currency_id: row.source_currency_id ?? row.SourceCurrencyID ?? 0,
      destination_currency_id: row.destination_currency_id ?? row.DestinationCurrencyID ?? 0,
      source_id: row.source_id ?? (row.SourceID?.Valid ? row.SourceID.Int32 : null) ?? null,
      type_id: row.type_id ?? (row.TypeID?.Valid ? row.TypeID.Int32 : null) ?? null,
      valid_from_date: row.valid_from_date ?? row.ValidFromDate ?? null,
      valid_to_date: row.valid_to_date ?? row.ValidToDate ?? null,
      updated_at: row.updated_at ?? row.UpdatedAt ?? null,
      created_at: row.created_at ?? row.CreatedAt ?? null,
    }))
    .filter((row) => row.rate_id > 0 && row.source_currency_id > 0 && row.destination_currency_id > 0);
}

// Fetch all exchange-rate rows via cursor pagination.
export async function fetchAllExchangeRates(
  limit = DEFAULT_LIMIT,
  maxPages = DEFAULT_MAX_PAGES,
): Promise<ApiExchangeRateRow[]> {
  const items: ApiExchangeRateRow[] = [];
  let lastRateId = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchExchangeRatesAfter(lastRateId, limit);
    if (batch.length === 0) break;

    items.push(...batch);

    const nextCursor = batch[batch.length - 1]?.rate_id;
    if (!nextCursor || nextCursor <= lastRateId) break;
    lastRateId = nextCursor;

    if (batch.length < limit) break;
  }

  return items;
}

function normalizeExchangeRateType(row: Record<string, unknown>): ExchangeRateType {
  const typeId = row.type_id ?? row.typeId;
  const typeName = row.type_name ?? row.typeName;
  return {
    typeId: typeof typeId === "number" ? typeId : Number(typeId),
    typeName: typeof typeName === "string" ? typeName : String(typeName ?? ""),
  };
}

// Fetch dynamic exchange rate types (graceful if route is unavailable).
export async function fetchExchangeRateTypes(): Promise<ExchangeRateType[]> {
  try {
    const rows = await apiGet<Array<Record<string, unknown>>>("/exchange-rate-types", {
      cache: "force-cache",
      revalidateSeconds: 300,
    });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map(normalizeExchangeRateType).filter((t) => Number.isFinite(t.typeId));
  } catch {
    return [];
  }
}

// Fetch source metadata for labels and filters.
export async function fetchRateSources() {
  return apiGet<RateSource[]>("/rate-sources", {
    cache: "force-cache",
    revalidateSeconds: 300,
  });
}

// Fetch one pair snapshot for the dashboard.
export async function fetchLatestPairSourceType(base: string, target: string) {
  return apiGet<ExchangeSnapshotResponse>(
    `/exchange-rates/snapshot?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`,
  );
}