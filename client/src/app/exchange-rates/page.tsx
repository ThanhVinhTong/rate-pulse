import { ExchangeRatesClientTable } from "@/components/dashboard/ExchangeRatesClientTable";
import { 
  Currency, 
  ExchangeRateLatest, 
  RateSourceMetadata, 
  DEFAULT_SOURCE_CURRENCY_ID, 
  EXCHANGE_RATES_LIMIT 
} from "@/types/exchange-rates";

async function fetchJson(url: string, options: RequestInit, label: string) {
  const res = await fetch(url, options)

  if (!res.ok) {
    const errorText: string = await res.text()
    throw new Error(`${label} failed: ${res.status} ${errorText}`)
  }

  return res.json()
}

export default async function ExchangeRatesPage() {
  const base = process.env.API_BASE_URL ?? "https://api.rate-pulse.me";

  const [currencies, rateSources, exchangeRatesLatest] =
  await Promise.all([
    fetchJson(
      `${base}/currencies/codes-and-names`, 
      { next: { revalidate: 60 } },
      "Currencies"
    ),
    fetchJson(
      `${base}/rate-sources/metadata`, 
      { next: { revalidate: 60 } },
      "Rate Sources"
    ),
    fetchJson(
      `${base}/exchange-rates-latest?source_currency_id=${DEFAULT_SOURCE_CURRENCY_ID}&limit=${EXCHANGE_RATES_LIMIT}`,
      { next: { revalidate: 60 } },
      "Exchange Rates Latest"
    ),
  ])

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
