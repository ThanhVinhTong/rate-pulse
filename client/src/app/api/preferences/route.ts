import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth";

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
        }
      }

      if (preferences.length < pageSize) {
        break;
      }

      page++;
    }

    return NextResponse.json(preferredIds);
  } catch (error) {
    console.error("Failed to fetch preferences in route handler:", error);
    return NextResponse.json([]);
  }
}
