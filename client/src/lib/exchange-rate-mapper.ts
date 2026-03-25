import type { BankRate } from "@/types";

export interface ApiCurrency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  CurrencySymbol?: {
    String: string;
    Valid: boolean;
  } | null;
}

export interface ApiCountry {
  CountryID: number;
  CountryName: string;
  CurrencyID: number;
}

export interface ApiRateSource {
  SourceID: number;
  SourceName: string;
  SourceCountry?: {
    String: string;
    Valid: boolean;
  } | null;
}

export interface ApiExchangeRate {
  RateID: number;
  RateValue: string;
  SourceCurrencyID: number;
  DestinationCurrencyID: number;
  SourceID?: {
    Int32: number;
    Valid: boolean;
  } | null;
  ValidFromDate: string;
}

export function mapApiBankRates(
  currencies: ApiCurrency[],
  countries: ApiCountry[],
  sources: ApiRateSource[],
  rates: ApiExchangeRate[],
): BankRate[] {
  const currencyById = new Map(currencies.map((item) => [item.CurrencyID, item]));
  const sourceById = new Map(sources.map((item) => [item.SourceID, item]));

  const countryByCurrencyId = new Map<number, string>();
  for (const country of countries) {
    if (!countryByCurrencyId.has(country.CurrencyID)) {
      countryByCurrencyId.set(country.CurrencyID, country.CountryName);
    }
  }

  return rates
    .map((rate) => {
      const sourceCurrency = currencyById.get(rate.SourceCurrencyID) as ApiCurrency | undefined;
      const destinationCurrency = currencyById.get(rate.DestinationCurrencyID) as ApiCurrency | undefined;
      if (!sourceCurrency || !destinationCurrency) {
        return null;
      }

      const numericRate = Number(rate.RateValue);
      const safeRate = Number.isFinite(numericRate) && numericRate > 0 ? numericRate : 1;
      const sourceId = rate.SourceID?.Valid ? rate.SourceID.Int32 : undefined;
      const source = sourceId ? sourceById.get(sourceId) : undefined;
      const sourceCountry = (source as ApiRateSource | undefined)?.SourceCountry?.Valid
        ? (source as ApiRateSource).SourceCountry?.String
        : null;

      return {
        id: `rate-${rate.RateID}`,
        source: (source as ApiRateSource | undefined)?.SourceName ?? "Unknown Source",
        baseCurrency: sourceCurrency.CurrencyCode,
        targetCurrency: destinationCurrency.CurrencyCode,
        favorite: false,
        fetchCountToday: 0,
        cashBuy: safeRate,
        wireBuy: safeRate,
        cashSell: safeRate,
        wireSell: safeRate,
        change: 0,
        country: sourceCountry ?? countryByCurrencyId.get(sourceCurrency.CurrencyID) ?? "Unknown",
        timestamp: rate.ValidFromDate,
      } as BankRate;
    })
    .filter((item) => item !== null) as BankRate[];
}
