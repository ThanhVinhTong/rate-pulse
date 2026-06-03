import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth, getValidAccessToken } from "@/lib/auth";
import type { Currency } from "@/types/exchange-rates";

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

async function fetchFavoriteCurrencyCode(currencies: Currency[]): Promise<string> {
  const token = await getValidAccessToken();
  if (!token) {
    return ""; // Fallback default when no session exists (displays "-- None --")
  }

  try {
    let page = 1;
    const pageSize = 10;
    const maxPages = 16; // 159 preferences max / 10 items per page = 16 pages

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

      // Check if the favorite currency is in this page
      const favorite = preferences.find(
        (p: any) =>
          p.IsFavorite &&
          p.IsFavorite.Bool === true &&
          p.IsFavorite.Valid === true
      );

      if (favorite) {
        const matched = currencies.find((c) => c.CurrencyID === favorite.CurrencyID);
        if (matched) {
          return matched.CurrencyCode;
        }
      }

      // Early exit if the returned list is smaller than page size (it means we reached the last page)
      if (preferences.length < pageSize) {
        break;
      }

      page++;
    }
  } catch (error) {
    console.error("Failed to fetch favorite currency preference:", error);
  }

  return ""; // Fallback default if no favorite is found (displays "-- None --")
}

export default async function ProfilePage() {
  const session = await requireAuth();
  const currencies = await fetchCurrencies();
  const favoriteCurrencyCode = await fetchFavoriteCurrencyCode(currencies);

  return (
    <ProfileTabs
      session={session}
      currencies={currencies}
      favoriteCurrencyCode={favoriteCurrencyCode}
    />
  );
}
