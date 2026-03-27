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

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  continent: string;
}

interface DashboardPayload {
  pairs: CurrencyPair[];
  pairSnapshots: PairSnapshot[];
  currencyOptions: CurrencyOption[];
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
): DashboardPayload {
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

    return mapApiToDashboard(currencies, countries, sources, rates, typesFromApi);
  } catch (error) {
    console.error("Dashboard payload fetch failed:", error);
    return {
      pairs: [],
      pairSnapshots: [],
      currencyOptions: [],
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
      range={range}
    />
  );
}
