import { ExchangeRatesClientTable } from "@/components/dashboard/ExchangeRatesClientTable";
import { 
  DEFAULT_SOURCE_CURRENCY_ID,
  DEFAULT_TARGET_CURRENCY_CODE,
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
      { next: { revalidate: 1800 } },
      "Currencies"
    ),
    fetchJson(
      `${base}/rate-sources/metadata`, 
      { next: { revalidate: 1800 } },
      "Rate Sources"
    ),
    fetchJson(
      `${base}/exchange-rates-latest?source_currency_id=${DEFAULT_SOURCE_CURRENCY_ID}&limit=${EXCHANGE_RATES_LIMIT}`,
      { next: { revalidate: 1800 } },
      "Exchange Rates Latest"
    ),
  ])

  return (
    <div className="space-y-6">
      <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
        Exchange rates
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-text-primary">
        Compare live exchange rates
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
        Browse the latest rates by base currency, source, and target currency. Results refresh from the API cache.
      </p>
      </div>
      <div>
        <ExchangeRatesClientTable
          apiBase={base}
          initialSourceCurrencyId={DEFAULT_SOURCE_CURRENCY_ID}
          initialTargetCurrencyCode={DEFAULT_TARGET_CURRENCY_CODE}
          initialRates={exchangeRatesLatest}
          currencies={currencies}
          rateSources={rateSources}
        />
      </div>
    </div>
  );
}
