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
