import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ConverterClient } from "@/components/dashboard/ConverterClient";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";
import type { ExchangeRateTypeWire, RateSourceFeeRule } from "@/types/fee-rules";
import { fetchUserFavoriteCurrencyId } from "@/lib/preferences";

const apiBase = process.env.RATE_PULSE_API_BASE_URL || "https://localhost:3000";

export const metadata: Metadata = {
  title: "Converter",
  description:
    "Compare buy and sell transfer rates across banks by base and target currency.",
};

async function fetchConverterData() {
  const activeOn = new Date().toISOString().slice(0, 10);

  try {
    const [currenciesRes, rateSourcesRes, feeRulesRes, exchangeRateTypesRes] = await Promise.all([
      fetch(`${apiBase}/currencies/codes-and-names`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/rate-sources/metadata`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/rate-source-fee-rules?active_on=${activeOn}`, {
        next: { revalidate: 1800 },
      }),
      fetch(`${apiBase}/exchange-rate-types`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!currenciesRes.ok || !rateSourcesRes.ok) {
      throw new Error("Failed to fetch converter metadata");
    }

    const currencies: Currency[] = await currenciesRes.json();
    const rateSources: RateSourceMetadata[] = await rateSourcesRes.json();
    const feeRules: RateSourceFeeRule[] = feeRulesRes.ok ? await feeRulesRes.json() : [];
    const exchangeRateTypes: ExchangeRateTypeWire[] = exchangeRateTypesRes.ok
      ? await exchangeRateTypesRes.json()
      : [];

    return { currencies, rateSources, feeRules, exchangeRateTypes };
  } catch (error) {
    console.error("Failed to fetch converter data:", error);
    return { currencies: [], rateSources: [], feeRules: [], exchangeRateTypes: [] };
  }
}

export default async function ConverterPage() {
  const { currencies, rateSources, feeRules, exchangeRateTypes } = await fetchConverterData();
  const favoriteCurrencyId = await fetchUserFavoriteCurrencyId();

  // Read preferred rate sources from cookie for zero-network SSR
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
          Converter
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">
          Currency converter
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
          Compare transfer scenarios by bank, base currency, and target
          currency. Buy and sell calculations use the latest available rates
          returned by the Rate Pulse API.
        </p>
      </div>

      <ConverterClient
        apiBase={apiBase}
        currencies={currencies}
        rateSources={rateSources}
        feeRules={feeRules}
        exchangeRateTypes={exchangeRateTypes}
        favoriteCurrencyId={favoriteCurrencyId}
        preferredSourceIds={preferredSourceIds}
      />
    </div>
  );
}
