import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/auth";

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

async function fetchPreferredSourceIds(token: string): Promise<number[]> {
  let page = 1;
  const pageSize = 10;
  const maxPages = 10;
  const preferredIds: number[] = [];

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

    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const p of data) {
      if (p.SourceID) {
        preferredIds.push(p.SourceID);
      }
    }

    if (data.length < pageSize) break;
    page++;
  }

  return preferredIds;
}

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json([]);
  }

  try {
    const preferredIds = await fetchPreferredSourceIds(token);

    // Set the cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set("rp_preferred_source_ids", preferredIds.join(","), {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    } catch (e) {
      console.warn("Failed to set preferred sources cookie:", e);
    }

    return NextResponse.json(preferredIds);
  } catch (error) {
    console.error("Failed to fetch preferred sources:", error);
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
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
    }

    const res = await fetch(`${apiBase}/rate-source-preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source_id: Number(sourceId),
        is_primary: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    // Refresh and update cookie
    const preferredIds = await fetchPreferredSourceIds(token);
    try {
      const cookieStore = await cookies();
      cookieStore.set("rp_preferred_source_ids", preferredIds.join(","), {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } catch (e) {
      console.warn("Failed to set preferred sources cookie on POST:", e);
    }

    return NextResponse.json({ success: true, preferredSourceIds: preferredIds });
  } catch (error) {
    console.error("Failed to add preferred source:", error);
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
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
    }

    const res = await fetch(`${apiBase}/rate-source-preferences/${sourceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    // Refresh and update cookie
    const preferredIds = await fetchPreferredSourceIds(token);
    try {
      const cookieStore = await cookies();
      cookieStore.set("rp_preferred_source_ids", preferredIds.join(","), {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } catch (e) {
      console.warn("Failed to set preferred sources cookie on DELETE:", e);
    }

    return NextResponse.json({ success: true, preferredSourceIds: preferredIds });
  } catch (error) {
    console.error("Failed to delete preferred source:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
