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
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-emerald-100">Analytics</h1>
          <p className="text-gray-500 dark:text-emerald-400 mt-1">
            Exchange Rate Trends & Analysis
          </p>
        </div>

        {/* Analytics Client Component */}
        <AnalyticsClient apiBase={apiBase} currencies={currencies} rateSources={rateSources} />
      </div>
    </div>
  );
}
