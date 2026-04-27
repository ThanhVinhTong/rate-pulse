import { AnalyticsClient } from "@/components/dashboard/AnalyticsClient";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.rate-pulse.me";

async function fetchData() {
  try {
    const [currenciesRes, rateSourcesRes] = await Promise.all([
      fetch(`${apiBase}/currencies/codes-and-names`, { next: { revalidate: 3600 } }),
      fetch(`${apiBase}/rate-sources/metadata`, { next: { revalidate: 3600 } }),
    ]);

    if (!currenciesRes.ok || !rateSourcesRes.ok) {
      throw new Error("Failed to fetch metadata");
    }

    const currencies: Currency[] = await currenciesRes.json();
    const rateSources: RateSourceMetadata[] = await rateSourcesRes.json();

    return { currencies, rateSources };
  } catch (error) {
    console.error("Failed to fetch analytics metadata:", error);
    return { currencies: [], rateSources: [] };
  }
}

export default async function AnalyticsPage() {
  const { currencies, rateSources } = await fetchData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">
          Exchange rate trends
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
          Review source-specific movement, compare currency pairs, and convert amounts using the latest available series.
        </p>
      </div>

      <AnalyticsClient apiBase={apiBase} currencies={currencies} rateSources={rateSources} />
    </div>
  );
}
