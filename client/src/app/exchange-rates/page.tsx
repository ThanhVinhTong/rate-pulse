import type { Metadata } from "next";

import { ExchangeRatesDashboard } from "@/components/dashboard/ExchangeRatesDashboard";
import { getValidAccessToken } from "@/lib/auth";
import { mapApiBankRates, type ApiCurrency, type ApiCountry, type ApiRateSource, type ApiExchangeRate } from "@/lib/exchange-rate-mapper";
import { bankRates, exchangeRates, supportedCurrencies, timeRanges } from "@/lib/mock-data";
import type { BankRate, CurrencyPair, TimeRange } from "@/types";

const API_BASE_URL = "https://api.rate-pulse.me";
const PAGE_SIZE = 10;

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  continent: string;
}

interface DashboardPayload {
  pairs: CurrencyPair[];
  rates: BankRate[];
  currencyOptions: CurrencyOption[];
}

export const metadata: Metadata = {
  title: "Exchange Rates",
  description: "Real-time inspired exchange rate monitoring with responsive cards and charts.",
};

function normalizeRange(range?: string): TimeRange {
  return timeRanges.includes(range as TimeRange) ? (range as TimeRange) : timeRanges[0];
}

async function fetchAllPages<T>(path: string, token: string): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= 100; page += 1) {
    const res = await fetch(`${API_BASE_URL}${path}?page_id=${page}&page_size=${PAGE_SIZE}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${path}: ${res.status}`);
    }

    const pageItems = (await res.json()) as T[];
    items.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) {
      break;
    }
  }

  return items;
}

function mapApiToDashboard(
  currencies: ApiCurrency[],
  countries: ApiCountry[],
  sources: ApiRateSource[],
  rates: ApiExchangeRate[],
): DashboardPayload {
  const currencyById = new Map(currencies.map((item) => [item.CurrencyID, item]));
  const countryByCurrencyId = new Map<number, string>();
  for (const country of countries) {
    if (!countryByCurrencyId.has(country.CurrencyID)) {
      countryByCurrencyId.set(country.CurrencyID, country.CountryName);
    }
  }

  const latestByPair = new Map<string, ApiExchangeRate>();
  for (const rate of rates) {
    const sourceCurrency = currencyById.get(rate.SourceCurrencyID);
    const destinationCurrency = currencyById.get(rate.DestinationCurrencyID);
    if (!sourceCurrency || !destinationCurrency) {
      continue;
    }

    const pair = `${sourceCurrency.CurrencyCode}/${destinationCurrency.CurrencyCode}`;
    const existing = latestByPair.get(pair);
    if (!existing || new Date(rate.ValidFromDate) > new Date(existing.ValidFromDate)) {
      latestByPair.set(pair, rate);
    }
  }

  const pairs: CurrencyPair[] = Array.from(latestByPair.entries())
    .map(([pair, rate]) => {
      const sourceCurrency = currencyById.get(rate.SourceCurrencyID);
      const destinationCurrency = currencyById.get(rate.DestinationCurrencyID);
      const numericRate = Number(rate.RateValue);
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

  const bankRateRows = mapApiBankRates(currencies, countries, sources, rates);

  const currencyOptions: CurrencyOption[] = currencies.map((item) => ({
    code: item.CurrencyCode,
    name: item.CurrencyName,
    symbol: item.CurrencySymbol?.Valid ? item.CurrencySymbol.String : item.CurrencyCode,
    continent: countryByCurrencyId.get(item.CurrencyID) ?? "Other",
  }));

  return {
    pairs,
    rates: bankRateRows,
    currencyOptions,
  };
}

async function getDashboardPayload(): Promise<DashboardPayload> {
  const token = await getValidAccessToken();

  if (!token) {
    return {
      pairs: exchangeRates[timeRanges[0]],
      rates: bankRates,
      currencyOptions: supportedCurrencies,
    };
  }

  try {
    const [currencies, countries, sources, rates] = await Promise.all([
      fetchAllPages<ApiCurrency>("/currencies", token),
      fetchAllPages<ApiCountry>("/countries", token),
      fetchAllPages<ApiRateSource>("/rate-sources", token),
      fetchAllPages<ApiExchangeRate>("/exchange-rates", token),
    ]);

    const payload = mapApiToDashboard(currencies, countries, sources, rates);

    if (payload.pairs.length === 0 || payload.rates.length === 0) {
      throw new Error("No data returned from API");
    }

    return payload;
  } catch (error) {
    return {
      pairs: exchangeRates[timeRanges[0]],
      rates: bankRates,
      currencyOptions: supportedCurrencies,
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
      initialPairs={payload.pairs.length > 0 ? payload.pairs : exchangeRates[range]}
      initialBankRates={payload.rates}
      supportedCurrencyOptions={payload.currencyOptions}
      range={range}
    />
  );
}
