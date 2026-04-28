import type { Metadata } from "next";

import { ConverterClient } from "@/components/dashboard/ConverterClient";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.rate-pulse.me";

export const metadata: Metadata = {
  title: "Converter",
  description:
    "Compare buy and sell transfer rates across banks by base and target currency.",
};

async function fetchConverterData() {
  try {
    const [currenciesRes, rateSourcesRes] = await Promise.all([
      fetch(`${apiBase}/currencies/codes-and-names`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/rate-sources/metadata`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!currenciesRes.ok || !rateSourcesRes.ok) {
      throw new Error("Failed to fetch converter metadata");
    }

    const currencies: Currency[] = await currenciesRes.json();
    const rateSources: RateSourceMetadata[] = await rateSourcesRes.json();

    return { currencies, rateSources };
  } catch (error) {
    console.error("Failed to fetch converter data:", error);
    return { currencies: [], rateSources: [] };
  }
}

export default async function ConverterPage() {
  const { currencies, rateSources } = await fetchConverterData();

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
          currency. Buy and sell calculations will use the latest available
          rates once wired to market data.
        </p>
      </div>

      <ConverterClient apiBase={apiBase} currencies={currencies} rateSources={rateSources} />
    </div>
  );
}