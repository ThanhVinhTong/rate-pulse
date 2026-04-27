export const NEWS_REGIONS = [
  "World News",
  "United States",
  "Europe",
  "Middle East",
  "Africa",
  "Latin America",
  "Asia Pacific",
] as const;

export const NEWS_CATEGORIES = [
  "Energy and Resources",
  "Goverment",
  "Think Tanks",
  "Financial",
  "Intel Feed",
] as const;

export const AI_INSIGHT_CATEGORIES = [
  "geo_insights",
  "break_news",
  "world_brief"
] as const;

export type NewsRegion = typeof NEWS_REGIONS[number];
export type NewsCategory = typeof NEWS_CATEGORIES[number];
export type AIInsightCategory = typeof AI_INSIGHT_CATEGORIES[number];
export type AnalyticsTab = "ai-insights" | "news" ;

export interface NewsArticleRegion {
  title: string;
  href: string;
  domain: string;
  timestamp: string | null;
  source: string;
  category: NewsRegion;
}

export interface NewsArticleTypes {
  title: string;
  href: string;
  domain: string;
  timestamp: string | null;
  source: string;
  category: NewsCategory;
}

export type NewsArticle = NewsArticleRegion | NewsArticleTypes;