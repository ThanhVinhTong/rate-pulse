import type { Metadata } from "next";

import { ExchangeRatesDashboard } from "@/components/dashboard/ExchangeRatesDashboard";
import {
  fetchAllExchangeRates,
  fetchAllPages,
  fetchExchangeRateTypes,
} from "@/lib/server/exchange-rates";
import type { ApiCurrency, ApiCountry, ApiRateSource } from "@/lib/exchange-rate-mapper";
import { buildPairSnapshots, type ExchangeRateRowInput } from "@/lib/pair-snapshot";
import type { CurrencyPair, ExchangeRateType, PairSnapshot, TimeRange } from "@/types";
import { TIME_RANGES } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { getAllUserCurrencyPreferences, UserCurrencyPreferencesMap } from "@/app/actions";

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  continent: string;
}

interface MapApiResult {
  pairs: CurrencyPair[];
  pairSnapshots: PairSnapshot[];
  currencyOptions: CurrencyOption[];
}

interface DashboardPayload extends MapApiResult {
  userCurrencyPreferences: {
    baseCurrencyCode?: string;
    targetCurrencyCode?: string;
  };
  preferredBaseCurrencies: CurrencyOption[];
  preferredTargetCurrencies: CurrencyOption[];
}

export const metadata: Metadata = {
  title: "Exchange Rates",
  description: "Real-time inspired exchange rate monitoring with responsive cards and charts.",
};

function normalizeRange(range?: string): TimeRange {
  return TIME_RANGES.includes(range as TimeRange) ? (range as TimeRange) : TIME_RANGES[0];
}

function mapApiToDashboard(
  currencies: ApiCurrency[],
  countries: ApiCountry[],
  sources: ApiRateSource[],
  rates: ExchangeRateRowInput[],
  typesFromApi: ExchangeRateType[],
): MapApiResult {
  const currencyById = new Map(currencies.map((item) => [item.CurrencyID, item]));
  const countryByCurrencyId = new Map<number, string>();
  for (const country of countries) {
    if (!countryByCurrencyId.has(country.CurrencyID)) {
      countryByCurrencyId.set(country.CurrencyID, country.CountryName);
    }
  }

  const latestByPair = new Map<string, ExchangeRateRowInput>();
  for (const rate of rates) {
    const sourceCurrency = currencyById.get(rate.source_currency_id);
    const destinationCurrency = currencyById.get(rate.destination_currency_id);
    if (!sourceCurrency || !destinationCurrency) {
      continue;
    }

    const pair = `${sourceCurrency.CurrencyCode}/${destinationCurrency.CurrencyCode}`;
    const existing = latestByPair.get(pair);
    const nextT = rate.valid_from_date ? new Date(rate.valid_from_date).getTime() : 0;
    const prevT = existing?.valid_from_date ? new Date(existing.valid_from_date).getTime() : 0;
    if (!existing || nextT > prevT) {
      latestByPair.set(pair, rate);
    }
  }

  const pairs: CurrencyPair[] = Array.from(latestByPair.entries())
    .map(([pair, rate]) => {
      const sourceCurrency = currencyById.get(rate.source_currency_id);
      const destinationCurrency = currencyById.get(rate.destination_currency_id);
      const numericRate = Number(rate.rate_value);
      const safeRate = Number.isFinite(numericRate) && numericRate > 0 ? numericRate : 1;

      return {
        pair,
        base: sourceCurrency?.CurrencyName ?? pair.split("/")[0],
        quote: destinationCurrency?.CurrencyName ?? pair.split("/")[1],
        rate: safeRate,
        change: 0,
        volume: "",
        high: 0,
        low: 0,
        sparkline: [],
      };
    })
    .sort((a, b) => a.pair.localeCompare(b.pair));

  const pairSnapshots = buildPairSnapshots(currencies, countries, sources, rates, typesFromApi);

  const currencyOptions: CurrencyOption[] = currencies.map((item) => ({
    code: item.CurrencyCode,
    name: item.CurrencyName,
    symbol: item.CurrencySymbol?.Valid ? item.CurrencySymbol.String : item.CurrencyCode,
    continent: countryByCurrencyId.get(item.CurrencyID) ?? "Other",
  }));

  return {
    pairs,
    pairSnapshots,
    currencyOptions,
  };
}

async function getDashboardPayload(): Promise<DashboardPayload> {
  try {
    // Get user preferences if authenticated
    let userPrefsRaw: UserCurrencyPreferencesMap = { all: [] };
    try {
      const session = await getSession();
      if (session?.accessToken) {
        userPrefsRaw = await getAllUserCurrencyPreferences(session.accessToken);
      }
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
    }

    // Run all API calls in parallel. The dominant cost is usually `fetchAllExchangeRates()` (many
    // cursor batches to the remote API); overlapping countries/sources/metadata avoids stacking
    // their latency after the first wave.
    // Go API validates page_size to min=5 max=10 (see listCurrency, listCountry, listRateSource).
    // Using 100 caused 400 responses and empty dropdowns; only fallbacks (e.g. USD/JPY) appeared.
    const META_PAGE_SIZE = 10;
    const META_CACHE = { cache: "force-cache" as const, revalidateSeconds: 300 };
    const [
      currenciesResult,
      ratesResult,
      typesResult,
      countriesResult,
      sourcesResult,
    ] = await Promise.allSettled([
      fetchAllPages<ApiCurrency>("/currencies", META_PAGE_SIZE, 100, META_CACHE),
      fetchAllExchangeRates(),
      fetchExchangeRateTypes(),
      fetchAllPages<ApiCountry>("/countries", META_PAGE_SIZE, 100, META_CACHE),
      fetchAllPages<ApiRateSource>("/rate-sources", META_PAGE_SIZE, 100, META_CACHE),
    ]);

    const currencies =
      currenciesResult.status === "fulfilled" ? currenciesResult.value : [];
    const ratesRaw = ratesResult.status === "fulfilled" ? ratesResult.value : [];
    const typesFromApi = typesResult.status === "fulfilled" ? typesResult.value : [];
    const countries = countriesResult.status === "fulfilled" ? countriesResult.value : [];
    const sources = sourcesResult.status === "fulfilled" ? sourcesResult.value : [];
    const rates: ExchangeRateRowInput[] = ratesRaw.map((rate) => ({
      rate_id: rate.rate_id,
      rate_value: rate.rate_value,
      source_currency_id: rate.source_currency_id,
      destination_currency_id: rate.destination_currency_id,
      source_id: rate.source_id,
      type_id: rate.type_id,
      valid_from_date: rate.valid_from_date,
    }));

    const payload = mapApiToDashboard(currencies, countries, sources, rates, typesFromApi);
    
    // Map user preference IDs to currency objects and codes
    const currencyIdToCode = new Map<number, string>();
    const currencyIdToObject = new Map<number, CurrencyOption>();
    const countryByCurrencyId = new Map<number, string>();

    for (const country of countries) {
      if (!countryByCurrencyId.has(country.CurrencyID)) {
        countryByCurrencyId.set(country.CurrencyID, country.CountryName);
      }
    }
    
    for (const curr of currencies) {
      if (typeof curr.CurrencyID === "number" && typeof curr.CurrencyCode === "string") {
        currencyIdToCode.set(curr.CurrencyID, curr.CurrencyCode);
        const symbol = typeof curr.CurrencySymbol === "string" 
          ? curr.CurrencySymbol 
          : (curr.CurrencySymbol?.Valid && typeof curr.CurrencySymbol?.String === "string" 
              ? curr.CurrencySymbol.String 
              : curr.CurrencyCode);
        currencyIdToObject.set(curr.CurrencyID, {
          code: curr.CurrencyCode,
          name: curr.CurrencyName,
          symbol,
          continent: countryByCurrencyId.get(curr.CurrencyID) ?? "Other",
        });
      }
    }
    
    const dedupeByCode = (items: CurrencyOption[]): CurrencyOption[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.code)) {
          return false;
        }
        seen.add(item.code);
        return true;
      });
    };

    const preferredBaseCurrencies = dedupeByCode(
      userPrefsRaw.all
        .filter((pref) => pref.isFavorite === true)
        .map((pref) => currencyIdToObject.get(pref.currencyId))
        .filter((curr): curr is CurrencyOption => curr !== undefined),
    );

    const preferredTargetCurrencies = dedupeByCode(
      userPrefsRaw.all
        .filter((pref) => pref.isFavorite === false)
        .map((pref) => currencyIdToObject.get(pref.currencyId))
        .filter((curr): curr is CurrencyOption => curr !== undefined),
    );
    
    const baseCurrencyCode = userPrefsRaw.base ? currencyIdToCode.get(userPrefsRaw.base) : undefined;
    const targetCurrencyCode = userPrefsRaw.target ? currencyIdToCode.get(userPrefsRaw.target) : undefined;
    
    return {
      ...payload,
      userCurrencyPreferences: {
        baseCurrencyCode,
        targetCurrencyCode,
      },
      preferredBaseCurrencies,
      preferredTargetCurrencies,
    };
  } catch (error) {
    console.error("Dashboard payload fetch failed:", error);
    return {
      pairs: [],
      pairSnapshots: [],
      currencyOptions: [],
      userCurrencyPreferences: {},
      preferredBaseCurrencies: [],
      preferredTargetCurrencies: [],
    };
  }
}

export default async function ExchangeRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = normalizeRange(params.range);
  const payload = await getDashboardPayload();

  return (
    <ExchangeRatesDashboard
      initialPairs={payload.pairs.length > 0 ? payload.pairs : []}
      initialPairSnapshots={payload.pairSnapshots}
      supportedCurrencyOptions={payload.currencyOptions}
      userCurrencyPreferences={payload.userCurrencyPreferences}
      preferredBaseCurrencies={payload.preferredBaseCurrencies}
      preferredTargetCurrencies={payload.preferredTargetCurrencies}
      range={range}
    />
  );
}
