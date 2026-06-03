import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth } from "@/lib/auth";
import type { Currency } from "@/types/exchange-rates";

export const metadata: Metadata = {
  title: "Profile",
  description: "Protected trader profile with personal preferences and account controls.",
};

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

async function fetchCurrencies(): Promise<Currency[]> {
  try {
    const res = await fetch(`${apiBase}/currencies/codes-and-names`, {
      next: { revalidate: 3600 }, // Cache on the server side for 1 hour, matching the converter page
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

export default async function ProfilePage() {
  const session = await requireAuth();
  const currencies = await fetchCurrencies();

  return <ProfileTabs session={session} currencies={currencies} />;
}
