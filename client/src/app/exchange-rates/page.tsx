import { ExchangeRatesClientTable } from "@/components/dashboard/ExchangeRatesClientTable";
import { 
  DEFAULT_TARGET_CURRENCY_CODE,
  EXCHANGE_RATES_LIMIT 
} from "@/types/exchange-rates";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { fetchUserFavoriteCurrencyId } from "@/lib/preferences";
import type { ExchangeRateTypeWire, RateSourceFeeRule } from "@/types/fee-rules";

const FEE_RULES_REVALIDATE_SECONDS = 3600;

export const metadata: Metadata = {
  title: "Exchange Rates",
  description:
    "Access comprehensive exchange rate comparisons across financial institutions. Evaluate buy and sell margins to optimize your currency transfers.",
};

async function fetchJson(url: string, options: RequestInit, label: string) {
  const res = await fetch(url, options)

  if (!res.ok) {
    const errorText: string = await res.text()
    throw new Error(`${label} failed: ${res.status} ${errorText}`)
  }

  return res.json()
}

async function fetchOptionalJson<T>(
  url: string,
  options: RequestInit,
  label: string,
  fallback: T,
): Promise<T> {
  try {
    return await fetchJson(url, options, label);
  } catch (error) {
    console.warn(`${label} unavailable:`, error);
    return fallback;
  }
}

export default async function ExchangeRatesPage() {
  const base = process.env.RATE_PULSE_API_BASE_URL ?? "https://localhost:3000";
  const activeOn = new Date().toISOString().slice(0, 10);

  // Fetch currencies, sources, fee rules, rate types, and the user's favorite currency ID.
  const [currencies, rateSources, feeRules, exchangeRateTypes, favoriteCurrencyId] = await Promise.all([
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
    fetchOptionalJson<RateSourceFeeRule[]>(
      `${base}/rate-source-fee-rules?active_on=${activeOn}`,
      { next: { revalidate: FEE_RULES_REVALIDATE_SECONDS } },
      "Rate Source Fee Rules",
      []
    ),
    fetchOptionalJson<ExchangeRateTypeWire[]>(
      `${base}/exchange-rate-types`,
      { next: { revalidate: 1800 } },
      "Exchange Rate Types",
      []
    ),
    fetchUserFavoriteCurrencyId(),
  ]);

  // Fetch the latest rates for the user's preferred favorite base currency ID
  const exchangeRatesLatest = await fetchJson(
    `${base}/exchange-rates-latest?source_currency_id=${favoriteCurrencyId}&limit=${EXCHANGE_RATES_LIMIT}`,
    { next: { revalidate: 1800 } },
    "Exchange Rates Latest"
  );

  // Read preferred source IDs from cookie
  let preferredSourceIds: number[] = [];
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get("rp_preferred_source_ids")?.value;
    if (cookieVal) {
      preferredSourceIds = cookieVal.split(",").map(Number).filter((id) => !Number.isNaN(id));
    }
  } catch (e) {
    console.warn("Failed to read preferred rate source cookie:", e);
  }

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
          initialSourceCurrencyId={favoriteCurrencyId}
          initialTargetCurrencyCode={DEFAULT_TARGET_CURRENCY_CODE}
          initialRates={exchangeRatesLatest}
          currencies={currencies}
          rateSources={rateSources}
          feeRules={feeRules}
          exchangeRateTypes={exchangeRateTypes}
          preferredSourceIds={preferredSourceIds}
        />
      </div>
    </div>
  );
}
