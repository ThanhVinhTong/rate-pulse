import type { Metadata } from "next";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { requireAuth } from "@/lib/auth";
import type { AuthSession, CountryOption } from "@/types";
const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

interface CurrencyApiResponse {
  CurrencyID?: number;
  CurrencyCode?: string;
  CurrencyName?: string;
  CurrencySymbol?:
    | string
    | {
        String?: string;
        Valid?: boolean;
      };
}

interface CurrencyPreferenceApiResponse {
  CurrencyID?: number;
  currency_id?: number;
}

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

function normalizeCurrencySymbol(item: CurrencyApiResponse): string | undefined {
  if (typeof item.CurrencySymbol === "string") {
    return item.CurrencySymbol;
  }

  if (
    item.CurrencySymbol &&
    typeof item.CurrencySymbol === "object" &&
    item.CurrencySymbol.Valid === true &&
    typeof item.CurrencySymbol.String === "string"
  ) {
    return item.CurrencySymbol.String;
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

async function listAllCurrencies(): Promise<
  Array<{
    currencyId: number;
    currencyCode: string;
    currencyName: string;
    currencySymbol?: string;
  }>
> {
  const pageSize = 10;
  const currencies: Array<{
    currencyId: number;
    currencyCode: string;
    currencyName: string;
    currencySymbol?: string;
  }> = [];

  for (let pageId = 1; pageId <= 100; pageId += 1) {
    const res = await fetch(`${API_BASE_URL}/currencies?page_id=${pageId}&page_size=${pageSize}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      break;
    }

    const page = (await res.json()) as CurrencyApiResponse[];

    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    currencies.push(
      ...page
        .map((item) => {
          const currencyId = typeof item.CurrencyID === "number" ? item.CurrencyID : null;
          const currencyCode = typeof item.CurrencyCode === "string" ? item.CurrencyCode : null;
          const currencyName = typeof item.CurrencyName === "string" ? item.CurrencyName : null;
          const currencySymbol = normalizeCurrencySymbol(item);

          if (currencyId === null || currencyCode === null || currencyName === null) {
            return null;
          }

          return {
            currencyId,
            currencyCode,
            currencyName,
            ...(typeof currencySymbol === "string" ? { currencySymbol } : {}),
          };
        })
        .filter(
          (
            item,
          ): item is {
            currencyId: number;
            currencyCode: string;
            currencyName: string;
            currencySymbol?: string;
          } => item !== null,
        ),
    );

    if (page.length < pageSize) {
      break;
    }
  }

  return currencies.sort((a, b) => a.currencyName.localeCompare(b.currencyName));
}

async function getPrimaryCurrencyPreference(
  accessToken: string,
): Promise<CurrencyPreferenceApiResponse | null> {
  const response = await fetch(
    `${API_BASE_URL}/currency-preference-userid?page_id=1&page_size=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as CurrencyPreferenceApiResponse[];
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0] ?? null;
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
  const [countries, currencies, currencyPreference] = await Promise.all([
    accessToken ? listAllCountries(accessToken) : [],
    listAllCurrencies(),
    accessToken ? getPrimaryCurrencyPreference(accessToken) : Promise.resolve(null),
  ]);

  const preferredCurrencyId = currencyPreference?.CurrencyID ?? currencyPreference?.currency_id;
  const selectedCurrencyId =
    typeof preferredCurrencyId === "number" &&
    currencies.some((item) => item.currencyId === preferredCurrencyId)
      ? preferredCurrencyId
      : null;

  return (
    <ProfileTabs
      session={session}
      countries={countries}
      currencies={currencies}
      selectedCurrencyId={selectedCurrencyId}
    />
  );
}
