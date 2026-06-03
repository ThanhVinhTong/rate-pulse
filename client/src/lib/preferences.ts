import { cookies } from "next/headers";
import { getSession, getValidAccessToken } from "@/lib/auth";
import { DEFAULT_SOURCE_CURRENCY_ID } from "@/types/exchange-rates";

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

export async function fetchUserFavoriteCurrencyId(): Promise<number> {
  // 1. Try to read from cookie first (0ms, 0 network requests)
  try {
    const cookieStore = await cookies();
    const cachedFavId = cookieStore.get("rp_favorite_currency_id")?.value;
    if (cachedFavId) {
      const id = Number(cachedFavId);
      if (!Number.isNaN(id) && id > 0) {
        return id;
      }
    }
  } catch (e) {
    console.warn("Failed to read favorite currency cookie:", e);
  }

  const session = await getSession();
  if (!session) {
    return DEFAULT_SOURCE_CURRENCY_ID;
  }

  const token = await getValidAccessToken();
  if (!token) {
    return DEFAULT_SOURCE_CURRENCY_ID;
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
        break;
      }

      const preferences = await res.json();
      if (!Array.isArray(preferences) || preferences.length === 0) {
        break;
      }

      const favorite = preferences.find(
        (p: any) =>
          p.IsFavorite &&
          p.IsFavorite.Bool === true &&
          p.IsFavorite.Valid === true
      );

      if (favorite) {
        return favorite.CurrencyID;
      }

      if (preferences.length < pageSize) {
        break;
      }

      page++;
    }
  } catch (error) {
    console.error("Failed to fetch favorite currency preference ID:", error);
  }

  return DEFAULT_SOURCE_CURRENCY_ID;
}
