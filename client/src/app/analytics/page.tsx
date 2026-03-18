import type { Metadata } from "next";

import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import {
  AI_INSIGHTS,
  NEWS_ARTICLES,
  NEWS_CATEGORIES,
  NEWS_REGIONS,
  SECTOR_HEATMAP,
} from "@/data/newsData";

export const metadata: Metadata = {
  title: "News & Analytics",
  description: "Real-time market news, AI-powered insights, and sector intelligence.",
};

export default function AnalyticsPage() {
  return (
    <AnalyticsDashboard
      insights={AI_INSIGHTS}
      articles={NEWS_ARTICLES}
      sectors={SECTOR_HEATMAP}
      regions={NEWS_REGIONS}
      categories={NEWS_CATEGORIES}
    />
  );
}
