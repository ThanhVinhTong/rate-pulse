import { Globe2, Landmark, Building2, TrendingUp, Zap, RadioTower, Flame, Map } from "lucide-react";

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

export const REGION_TABS = [
  { id: "world_news", label: "World", icon: Globe2 },
  { id: "united_states", label: "United States", icon: Landmark },
  { id: "europe", label: "Europe", icon: Map },
  { id: "middle_east", label: "Middle East", icon: Flame },
  { id: "asia_pacific", label: "Asia Pacific", icon: Map },
  { id: "africa", label: "Africa", icon: Map },
  { id: "latin_america", label: "Latin America", icon: Map },
];

export const SECTOR_TABS = [
  { id: "intel_feed", label: "Intel Feed", icon: RadioTower },
  { id: "government", label: "Government", icon: Landmark },
  { id: "think_tanks", label: "Think Tanks", icon: Building2 },
  { id: "financial", label: "Financial", icon: TrendingUp },
  { id: "energy_and_resources", label: "Energy & Resources", icon: Zap },
];