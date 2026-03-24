import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth } from "@/lib/auth";
import type { AuthSession, CountryOption } from "@/types";
const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

interface CountryApiResponse {
  country_id: number;
  country_name: string;
  country_code?: string;
  CountryID?: number;
  CountryName?: string;
  CountryCode?:
    | string
    | {
        String?: string;
        Valid?: boolean;
      };
}

function normalizeCountryCode(item: CountryApiResponse): string | undefined {
  if (typeof item.country_code === "string") {
    return item.country_code;
  }

  if (typeof item.CountryCode === "string") {
    return item.CountryCode;
  }

  if (
    item.CountryCode &&
    typeof item.CountryCode === "object" &&
    item.CountryCode.Valid === true &&
    typeof item.CountryCode.String === "string"
  ) {
    return item.CountryCode.String;
  }

  return undefined;
}

function toTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isExpired(value?: string, skewMs = 0) {
  const timestamp = toTimestamp(value);

  if (!timestamp) {
    return true;
  }

  return Date.now() + skewMs >= timestamp;
}

async function getAccessTokenForRead(session: AuthSession): Promise<string | null> {
  if (session.accessToken && !isExpired(session.accessTokenExpiresAt, 30_000)) {
    return session.accessToken;
  }

  if (!session.refreshToken || isExpired(session.refreshTokenExpiresAt)) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/users/renew-access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      refresh_token: session.refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return typeof data.access_token === "string" ? data.access_token : null;
}

async function listAllCountries(accessToken: string): Promise<CountryOption[]> {
  const pageSize = 10;
  const countries: CountryOption[] = [];

  for (let pageId = 1; pageId <= 100; pageId += 1) {
    const res = await fetch(
      `${API_BASE_URL}/countries?page_id=${pageId}&page_size=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        //Need future cache
        cache: "no-store",
      },
    );

    if (!res.ok) {
      break;
    }

    const page = (await res.json()) as CountryApiResponse[];

    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    countries.push(
      ...page
        .map((item): CountryOption | null => {
          const countryId =
            typeof item.country_id === "number"
              ? item.country_id
              : typeof item.CountryID === "number"
                ? item.CountryID
                : null;
          const countryName =
            typeof item.country_name === "string"
              ? item.country_name
              : typeof item.CountryName === "string"
                ? item.CountryName
                : null;
          const countryCode =
            normalizeCountryCode(item);

          if (countryId === null || countryName === null) {
            return null;
          }

          if (typeof countryCode === "string") {
            return {
              countryId,
              countryName,
              countryCode,
            };
          }

          return {
            countryId,
            countryName,
          };
        })
        .filter((item): item is CountryOption => item !== null),
    );

    if (page.length < pageSize) {
      break;
    }
  }

  return countries.sort((a, b) => a.countryName.localeCompare(b.countryName));
}

export const metadata: Metadata = {
  title: "Profile",
  description: "Protected trader profile with personal preferences and account controls.",
};

export default async function ProfilePage() {
  const session = await requireAuth();
  const accessToken = await getAccessTokenForRead(session);
  const countries = accessToken ? await listAllCountries(accessToken) : [];
  console.log(countries)

  return <ProfileTabs session={session} countries={countries} />;
}
