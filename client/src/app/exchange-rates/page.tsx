import type { Metadata } from "next";

import { ExchangeRatesDashboard } from "@/components/dashboard/ExchangeRatesDashboard";
import { exchangeRates, timeRanges } from "@/lib/mock-data";
import type { TimeRange } from "@/types";

export const metadata: Metadata = {
  title: "Exchange Rates",
  description: "Real-time inspired exchange rate monitoring with responsive cards and charts.",
};

function normalizeRange(range?: string): TimeRange {
  return timeRanges.includes(range as TimeRange) ? (range as TimeRange) : "48h";
}

export default async function ExchangeRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = normalizeRange(params.range);

  return <ExchangeRatesDashboard initialPairs={exchangeRates[range]} range={range} />;
}
