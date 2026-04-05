import { ExchangeRatesClientTable } from "@/components/dashboard/ExchangeRatesClientTable";

interface Currency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  CurrencySymbol?: {
    String: string;
    Valid: boolean;
  } | null;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

interface RateSourceApi {
  SourceID: number;
  SourceName: string;
  SourceCode?: {
    String: string;
    Valid: boolean;
  } | null;
}

interface ExchangeRateLatest {
  RateID: number;
  RateValue: string;
  SourceCurrencyCode: string;
  DestinationCurrencyCode: string;
  ValidFromDate: string;
  RateSourceCode: {
    String: string;
    Valid: boolean;
  } | null;
  TypeName: {
    String: string;
    Valid: boolean;
  } | null;
  CreatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  } | null;
}

const DEFAULT_SOURCE_CURRENCY_ID = 150;
const RATES_LIMIT = 1000;

export default async function ExchangeRatesPage() {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

  const currenciesRes = await fetch(`${base}/currencies`, { cache: "no-store" });
  if (!currenciesRes.ok) {
    const errorText = await currenciesRes.text();
    throw new Error(`Failed to fetch currencies: ${errorText}`);
  }
  const currencies: Currency[] = await currenciesRes.json();

  const rateSourcesRes = await fetch(`${base}/rate-sources`, {
    cache: "no-store",
  });
  if (!rateSourcesRes.ok) {
    const errorText = await rateSourcesRes.text();
    throw new Error(`Failed to fetch rate sources: ${errorText}`);
  }
  const rateSources: RateSourceApi[] = await rateSourcesRes.json();

  const exchangeRatesLatestRes = await fetch(
    `${base}/exchange-rates-latest?source_currency_id=${DEFAULT_SOURCE_CURRENCY_ID}&limit=${RATES_LIMIT}`,
    { next: { revalidate: 60 } },
  );
  if (!exchangeRatesLatestRes.ok) {
    const errorText = await exchangeRatesLatestRes.text();
    throw new Error(`Failed to fetch exchange rates: ${errorText}`);
  }
  const exchangeRatesLatest: ExchangeRateLatest[] =
    await exchangeRatesLatestRes.json();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Exchange Rates
      </h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Last updated: {new Date().toLocaleString()}
      </p>
      <div className="mt-6">
        <ExchangeRatesClientTable
          apiBase={base}
          initialSourceCurrencyId={DEFAULT_SOURCE_CURRENCY_ID}
          initialRates={exchangeRatesLatest}
          currencies={currencies}
          rateSources={rateSources}
        />
      </div>
    </div>
  );
}
