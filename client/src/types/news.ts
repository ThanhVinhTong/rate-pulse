export const NEWS_REGIONS = [
  "World News",
  "United States",
  "Europe",
  "Middle East",
  "Africa",
  "Latin America",
  "Asia Pacific",
  "Energy & Resources",
] as const;

export const NEWS_CATEGORIES = [
  "Markets",
  "Economic Indicators",
  "Trade Policy",
  "Supply Chain",
  "Financial",
  "Technology",
  "Crypto",
] as const;

export const AI_INSIGHT_CATEGORIES = [
  "market_sentiment",
  "trend_analysis",
  "risk_alert",
  "opportunity",
] as const;

export type NewsRegion = typeof NEWS_REGIONS[number];
export type NewsCategory = typeof NEWS_CATEGORIES[number];
export type AIInsightCategory = typeof AI_INSIGHT_CATEGORIES[number];
export type AnalyticsTab = "ai-insights" | "news" | "heatmap";

export interface AIInsight {
  id: string;
  title: string;
  insight: string;
  confidence: number;
  category: AIInsightCategory;
  timestamp: string;
  relatedAssets: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: NewsCategory;
  region?: NewsRegion;
  timestamp: string;
  readTime: string;
  sentiment: "positive" | "negative" | "neutral";
  impact: "high" | "medium" | "low";
  url: string;
}

export interface SectorData {
  sector: string;
  performance: number;
  volume: string;
  marketCap: string;
  change24h: number;
}
