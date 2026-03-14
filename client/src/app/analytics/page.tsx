import type { Metadata } from "next";

import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import {
  analyticsData,
  marketTrendData,
  timeRanges,
} from "@/lib/mock-data";
import type { TimeRange } from "@/types";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Portfolio performance, trade volume, and market trend analytics.",
};

function normalizeRange(range?: string): TimeRange {
  return timeRanges.includes(range as TimeRange) ? (range as TimeRange) : "48h";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = normalizeRange(params.range);

  return (
    <AnalyticsDashboard
      range={range}
      data={analyticsData[range]}
      marketTrendData={marketTrendData}
    />
  );
}
