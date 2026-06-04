import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/auth";
import { DEFAULT_SOURCE_CURRENCY_ID } from "@/types/exchange-rates";

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json([]);
  }

  try {
    let page = 1;
    const pageSize = 10;
    const maxPages = 16; // 159 preferences max / 10 items per page = 16 pages
    const preferredIds: number[] = [];
    let favoriteId: number | null = null;

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

      for (const p of preferences) {
        if (p.CurrencyID) {
          preferredIds.push(p.CurrencyID);
          if (p.IsFavorite && p.IsFavorite.Bool === true && p.IsFavorite.Valid === true) {
            favoriteId = p.CurrencyID;
          }
        }
      }

      if (preferences.length < pageSize) {
        break;
      }

      page++;
    }

    // Set the cookie for the favorite currency (or the default if none found)
    try {
      const cookieStore = await cookies();
      const cookieVal = favoriteId ? String(favoriteId) : String(DEFAULT_SOURCE_CURRENCY_ID);
      cookieStore.set("rp_favorite_currency_id", cookieVal, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    } catch (e) {
      console.warn("Failed to set favorite currency cookie in route handler:", e);
    }

    return NextResponse.json(preferredIds);
  } catch (error) {
    console.error("Failed to fetch preferences in route handler:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currencyId } = body;

    if (!currencyId) {
      return NextResponse.json({ error: "Missing currencyId" }, { status: 400 });
    }

    const res = await fetch(`${apiBase}/currency-preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currency_id: Number(currencyId),
        is_favorite: false,
        display_order: 0,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to create preference:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const currencyId = searchParams.get("currencyId");

    if (!currencyId) {
      return NextResponse.json({ error: "Missing currencyId" }, { status: 400 });
    }

    const res = await fetch(`${apiBase}/currency-preference/${currencyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete preference:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currencyId } = body; // Can be a number or null/undefined (to clear favorite)

    // 1. Fetch all current preferences to find what to update
    let page = 1;
    const pageSize = 10;
    const maxPages = 16;
    const currentPreferences: any[] = [];

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

      if (!res.ok) break;

      const preferences = await res.json();
      if (!Array.isArray(preferences) || preferences.length === 0) break;

      currentPreferences.push(...preferences);

      if (preferences.length < pageSize) break;
      page++;
    }

    // 2. Set favorite for target currency
    if (currencyId) {
      const targetPref = currentPreferences.find((p) => p.CurrencyID === Number(currencyId));

      if (targetPref) {
        if (!targetPref.IsFavorite || !targetPref.IsFavorite.Bool) {
          await fetch(`${apiBase}/currency-preference/${currencyId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              currency_id: Number(currencyId),
              is_favorite: true,
            }),
          });
        }
      } else {
        // Create as favorite if it doesn't exist
        await fetch(`${apiBase}/currency-preference`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currency_id: Number(currencyId),
            is_favorite: true,
            display_order: 0,
          }),
        });
      }
    }

    // 3. Clear favorite for other currencies
    for (const p of currentPreferences) {
      if (p.CurrencyID !== Number(currencyId || 0) && p.IsFavorite && p.IsFavorite.Bool) {
        await fetch(`${apiBase}/currency-preference/${p.CurrencyID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currency_id: p.CurrencyID,
            is_favorite: false,
          }),
        });
      }
    }

    // 4. Update the cookie
    const cookieVal = currencyId ? String(currencyId) : String(DEFAULT_SOURCE_CURRENCY_ID);
    try {
      const cookieStore = await cookies();
      cookieStore.set("rp_favorite_currency_id", cookieVal, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    } catch (e) {
      console.warn("Failed to set favorite currency cookie in route handler PUT:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update favorite preference:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
