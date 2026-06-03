import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth, getValidAccessToken } from "@/lib/auth";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";

export const metadata: Metadata = {
  title: "Profile",
  description: "Protected trader profile with personal preferences and account controls.",
};

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

async function fetchCurrencies(): Promise<Currency[]> {
  try {
    const res = await fetch(`${apiBase}/currencies/codes-and-names`, {
      next: { revalidate: 3600 }, // Cache on the server side for 1 hour
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch currencies: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to load profile currency references:", error);
    return [];
  }
}

async function fetchRateSources(): Promise<RateSourceMetadata[]> {
  try {
    const res = await fetch(`${apiBase}/rate-sources/metadata`, {
      next: { revalidate: 3600 }, // Cache on the server side for 1 hour
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch rate sources: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to load profile rate source references:", error);
    return [];
  }
}

interface UserPreferencesData {
  favoriteCurrencyCode: string;
  preferredCurrencyIds: number[];
}

async function fetchUserPreferences(currencies: Currency[]): Promise<UserPreferencesData> {
  const token = await getValidAccessToken();
  if (!token) {
    return { favoriteCurrencyCode: "", preferredCurrencyIds: [] };
  }

  try {
    let page = 1;
    const pageSize = 10;
    const maxPages = 16; // 159 preferences max / 10 items per page = 16 pages
    const preferredCurrencyIds: number[] = [];
    let favoriteCurrencyCode = "";

    while (page <= maxPages) {
      const res = await fetch(
        `${apiBase}/currency-preference-userid?page_id=${page}&page_size=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        console.error(`Failed to fetch user preferences page ${page}: ${res.statusText}`);
        break;
      }

      const preferences = await res.json();
      if (!Array.isArray(preferences) || preferences.length === 0) {
        break;
      }

      for (const p of preferences) {
        if (p.CurrencyID) {
          preferredCurrencyIds.push(p.CurrencyID);

          if (p.IsFavorite && p.IsFavorite.Bool === true && p.IsFavorite.Valid === true) {
            const matched = currencies.find((c) => c.CurrencyID === p.CurrencyID);
            if (matched) {
              favoriteCurrencyCode = matched.CurrencyCode;
            }
          }
        }
      }

      // Early exit if the returned list is smaller than page size (it means we reached the last page)
      if (preferences.length < pageSize) {
        break;
      }

      page++;
    }

    return { favoriteCurrencyCode, preferredCurrencyIds };
  } catch (error) {
    console.error("Failed to fetch user currency preferences:", error);
  }

  return { favoriteCurrencyCode: "", preferredCurrencyIds: [] };
}

async function fetchPreferredSourceIds(): Promise<number[]> {
  const token = await getValidAccessToken();
  if (!token) {
    return [];
  }

  try {
    let page = 1;
    const pageSize = 10;
    const maxPages = 10;
    const preferredSourceIds: number[] = [];

    while (page <= maxPages) {
      const res = await fetch(
        `${apiBase}/rate-source-preferences-userid?page_id=${page}&page_size=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        break;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const p of data) {
        if (p.SourceID) {
          preferredSourceIds.push(p.SourceID);
        }
      }

      if (data.length < pageSize) {
        break;
      }

      page++;
    }

    return preferredSourceIds;
  } catch (error) {
    console.error("Failed to fetch user preferred source IDs:", error);
  }

  return [];
}

export default async function ProfilePage() {
  const session = await requireAuth();
  
  // Fetch currencies, rate sources, and user preferences in parallel
  const currencies = await fetchCurrencies();
  const [rateSources, userPrefs, preferredSourceIds] = await Promise.all([
    fetchRateSources(),
    fetchUserPreferences(currencies),
    fetchPreferredSourceIds(),
  ]);

  return (
    <ProfileTabs
      session={session}
      currencies={currencies}
      favoriteCurrencyCode={userPrefs.favoriteCurrencyCode}
      preferredCurrencyIds={userPrefs.preferredCurrencyIds}
      rateSources={rateSources}
      preferredSourceIds={preferredSourceIds}
    />
  );
}
