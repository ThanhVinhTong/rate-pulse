/**
 * Shape of the raw document stored in MongoDB by pulse_intel.
 * Matches the structure built by _build_document() in mongodb_export.py.
 */

export interface GeoInsightDoc {
  region: string;
  detail: string;
  signal_types: number | null;
  events: number | null;
}

export interface AIInsightsDoc {
  world_brief: string;
  geo_insights: GeoInsightDoc[];
  break_news: string[];
}

export interface FeedArticleDoc {
  title: string;
  href: string;
  domain: string;
  time: string;
  source: string;
}

export interface SnapshotMeta {
  feed_category_count: number;
  feed_item_count: number;
  breaking_news_count: number;
  geo_insight_count: number;
}

export interface SnapshotDocument {
  _id: string;
  generated_at: string;                           // ISO string after JSON serialisation
  ai_insights: AIInsightsDoc;
  feeds: Record<string, FeedArticleDoc[]>;        // keyed by category slug
  meta: SnapshotMeta;
}
