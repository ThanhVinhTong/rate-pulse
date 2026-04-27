import { ExchangeRatesClientTable } from "@/components/dashboard/ExchangeRatesClientTable";
import { 
  Currency, 
  ExchangeRateLatest, 
  RateSourceMetadata, 
  DEFAULT_SOURCE_CURRENCY_ID, 
  EXCHANGE_RATES_LIMIT 
} from "@/types/exchange-rates";

export default async function ExchangeRatesPage() {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

  const currenciesRes = await fetch(`${base}/currencies/codes-and-names`, { cache: "no-store" });
  if (!currenciesRes.ok) {
    const errorText = await currenciesRes.text();
    throw new Error(`Failed to fetch currencies: ${errorText}`);
  }
  const currencies: Currency[] = await currenciesRes.json();

  const rateSourcesRes = await fetch(`${base}/rate-sources/metadata`, {
    cache: "no-store",
  });
  if (!rateSourcesRes.ok) {
    const errorText = await rateSourcesRes.text();
    throw new Error(`Failed to fetch rate sources: ${errorText}`);
  }
  const rateSources: RateSourceMetadata[] = await rateSourcesRes.json();

  const exchangeRatesLatestRes = await fetch(
    `${base}/exchange-rates-latest?source_currency_id=${DEFAULT_SOURCE_CURRENCY_ID}&limit=${EXCHANGE_RATES_LIMIT}`,
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
      <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
        Exchange Rates
      </h1>
      <p className="mt-1 text-sm text-emerald-600 tabular-nums dark:text-emerald-400">
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
