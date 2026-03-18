import type { AIInsight, AIInsightCategory, NewsArticle, NewsCategory, NewsRegion, SectorData } from "@/types";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types";

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export { NEWS_CATEGORIES, NEWS_REGIONS };

export const AI_INSIGHTS: AIInsight[] = [
  {
    id: "energy-risk-premium",
    title: "Energy risk premium remains elevated",
    insight:
      "Crude, freight, and regional FX pricing continue to reflect a geopolitical risk premium. Traders should expect headline-driven volatility to stay elevated while energy-sensitive importers remain under pressure.",
    confidence: 91,
    category: "market_sentiment",
    timestamp: "2026-03-14T11:20:00.000Z",
    relatedAssets: ["WTI", "Brent", "USD", "EUR"],
  },
  {
    id: "dollar-liquidity-bid",
    title: "Dollar demand is firming across defensive flows",
    insight:
      "Cross-asset positioning suggests renewed demand for liquidity and reserve currencies. If macro uncertainty persists, the dollar bid could stay firm against high-beta currencies and cyclical sectors.",
    confidence: 87,
    category: "trend_analysis",
    timestamp: "2026-03-14T10:05:00.000Z",
    relatedAssets: ["DXY", "USD/JPY", "US10Y"],
  },
  {
    id: "shipping-bottleneck-watch",
    title: "Shipping lanes deserve closer monitoring",
    insight:
      "Supply chain chokepoints are not yet fully reflected in broad equity pricing. Watch freight costs, insurer commentary, and energy rerouting data for second-order pressure on inflation expectations.",
    confidence: 82,
    category: "risk_alert",
    timestamp: "2026-03-14T08:30:00.000Z",
    relatedAssets: ["Container Freight", "LNG", "Inflation Swaps"],
  },
  {
    id: "em-carry-window",
    title: "Selective EM carry still offers tactical upside",
    insight:
      "Despite risk-off sentiment, several emerging-market carry trades remain attractive where external balances are improving and central banks retain room to stay restrictive.",
    confidence: 74,
    category: "opportunity",
    timestamp: "2026-03-14T06:45:00.000Z",
    relatedAssets: ["MXN", "BRL", "ZAR"],
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "world-energy-volatility",
    title: "Global oil hedging activity climbs as traders price prolonged volatility",
    summary:
      "Energy desks are increasing short-dated hedges as shipping, sanctions risk, and refinery margins remain unstable. Options flows show continued demand for upside protection in crude and distillates.",
    source: "Reuters",
    category: "Markets",
    region: "World News",
    timestamp: "2026-03-14T11:55:00.000Z",
    readTime: "4 min read",
    sentiment: "negative",
    impact: "high",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "us-bank-funding",
    title: "US regional banks face renewed focus on funding costs as rate path stays uncertain",
    summary:
      "Investors are reassessing net interest margin assumptions after policymakers signaled patience on easing. Bank treasury teams are leaning more heavily on term funding to stabilize liquidity planning.",
    source: "CNBC",
    category: "Financial",
    region: "United States",
    timestamp: "2026-03-14T10:40:00.000Z",
    readTime: "3 min read",
    sentiment: "negative",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "europe-inflation-balance",
    title: "European inflation cools modestly but energy costs complicate the policy outlook",
    summary:
      "A softer core print offers some relief, but policymakers remain wary of imported energy pressure and supply disruption risks. Rates markets are trimming the pace of expected cuts.",
    source: "Financial Times",
    category: "Economic Indicators",
    region: "Europe",
    timestamp: "2026-03-14T09:15:00.000Z",
    readTime: "5 min read",
    sentiment: "neutral",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "middle-east-shipping-risk",
    title: "Middle East shipping insurers raise premiums on key transit routes",
    summary:
      "Higher insurance costs and route adjustments are adding friction to commodity logistics. Traders are watching whether those costs spill into freight benchmarks and downstream import pricing.",
    source: "The National",
    category: "Supply Chain",
    region: "Middle East",
    timestamp: "2026-03-14T08:50:00.000Z",
    readTime: "4 min read",
    sentiment: "negative",
    impact: "high",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "africa-fx-reserves",
    title: "Several African central banks report firmer reserve buffers after commodity receipts improve",
    summary:
      "Reserve accumulation is helping stabilize local FX conditions in selected markets, though food inflation and import costs still limit the room for rapid easing.",
    source: "Premium Times",
    category: "Economic Indicators",
    region: "Africa",
    timestamp: "2026-03-14T07:35:00.000Z",
    readTime: "3 min read",
    sentiment: "positive",
    impact: "low",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "latam-carry-demand",
    title: "Latin American currencies draw tactical inflows as carry screens remain attractive",
    summary:
      "Macro funds are favoring select Latin American exposures where real yields remain elevated and fiscal messaging is relatively disciplined, even as global risk appetite softens.",
    source: "Bloomberg",
    category: "Markets",
    region: "Latin America",
    timestamp: "2026-03-14T06:55:00.000Z",
    readTime: "4 min read",
    sentiment: "positive",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "asia-chip-export-rules",
    title: "Asia-Pacific exporters review compliance exposure ahead of new chip trade rules",
    summary:
      "Electronics manufacturers are revising export controls workflows as new licensing rules reshape procurement timelines, vendor concentration, and data center shipment planning.",
    source: "Nikkei Asia",
    category: "Trade Policy",
    region: "Asia Pacific",
    timestamp: "2026-03-14T05:30:00.000Z",
    readTime: "5 min read",
    sentiment: "neutral",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "energy-lng-rerouting",
    title: "LNG rerouting keeps vessel utilization high across energy corridors",
    summary:
      "Ship tracking and port activity indicate a continued premium for flexible tonnage. Utilities and large industrial buyers are extending procurement hedges to manage delivery uncertainty.",
    source: "OilPrice",
    category: "Supply Chain",
    region: "Energy & Resources",
    timestamp: "2026-03-14T04:45:00.000Z",
    readTime: "3 min read",
    sentiment: "negative",
    impact: "high",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "global-trade-realignment",
    title: "Trade ministries accelerate sourcing reviews as tariff risks broaden",
    summary:
      "Importers are widening supplier shortlists and reassessing dependency risks as tariff scenarios expand. Procurement leaders are prioritizing resilience over lowest-cost routing in several sectors.",
    source: "Wall Street Journal",
    category: "Trade Policy",
    region: "World News",
    timestamp: "2026-03-13T22:20:00.000Z",
    readTime: "6 min read",
    sentiment: "negative",
    impact: "high",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "us-ai-infrastructure",
    title: "US technology leaders increase AI infrastructure spend despite a tighter funding backdrop",
    summary:
      "Capex plans remain supported by large-model deployment priorities, but investors are becoming more selective on monetization quality, power access, and chip supply visibility.",
    source: "The Information",
    category: "Technology",
    region: "United States",
    timestamp: "2026-03-13T20:10:00.000Z",
    readTime: "4 min read",
    sentiment: "positive",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "europe-bank-issuance",
    title: "European lenders return to primary markets as spreads stabilize",
    summary:
      "Improved order books are reopening issuance windows for stronger balance sheets. Credit investors still want wider concessions from banks with higher wholesale funding dependence.",
    source: "Bloomberg",
    category: "Financial",
    region: "Europe",
    timestamp: "2026-03-13T18:25:00.000Z",
    readTime: "3 min read",
    sentiment: "positive",
    impact: "low",
    url: "https://www.worldmonitor.app/",
  },
  {
    id: "crypto-liquidity-check",
    title: "Crypto liquidity stays fragile as macro headlines dominate cross-asset risk appetite",
    summary:
      "Digital asset volumes improved overnight, but order books remain thinner than normal around major headlines. Traders are focusing on stablecoin flows and ETF positioning for confirmation.",
    source: "CoinDesk",
    category: "Crypto",
    region: "World News",
    timestamp: "2026-03-13T16:40:00.000Z",
    readTime: "4 min read",
    sentiment: "neutral",
    impact: "medium",
    url: "https://www.worldmonitor.app/",
  },
];

export const SECTOR_HEATMAP: SectorData[] = [
  { sector: "Energy", performance: 2.84, volume: "$184B", marketCap: "$6.4T", change24h: 2.84 },
  { sector: "Financials", performance: 1.12, volume: "$146B", marketCap: "$9.8T", change24h: 1.12 },
  { sector: "Materials", performance: 1.74, volume: "$88B", marketCap: "$4.1T", change24h: 1.74 },
  { sector: "Utilities", performance: 0.58, volume: "$41B", marketCap: "$2.9T", change24h: 0.58 },
  { sector: "Technology", performance: -0.46, volume: "$233B", marketCap: "$15.6T", change24h: -0.46 },
  { sector: "Industrials", performance: -1.22, volume: "$95B", marketCap: "$5.8T", change24h: -1.22 },
  { sector: "Healthcare", performance: -0.08, volume: "$73B", marketCap: "$6.7T", change24h: -0.08 },
  { sector: "Consumer", performance: 0.31, volume: "$67B", marketCap: "$4.9T", change24h: 0.31 },
  {
    sector: "Communication Services",
    performance: 0.93,
    volume: "$76B",
    marketCap: "$5.2T",
    change24h: 0.93,
  },
  { sector: "Real Estate", performance: -1.38, volume: "$39B", marketCap: "$2.5T", change24h: -1.38 },
  { sector: "Semiconductors", performance: -2.11, volume: "$121B", marketCap: "$3.8T", change24h: -2.11 },
  {
    sector: "Crypto Infrastructure",
    performance: -2.64,
    volume: "$29B",
    marketCap: "$0.9T",
    change24h: -2.64,
  },
];

export function getNewsByCategory(category: NewsCategory) {
  return NEWS_ARTICLES.filter((article) => article.category === category);
}

export function getNewsByRegion(region: NewsRegion) {
  return NEWS_ARTICLES.filter((article) => article.region === region);
}

export function formatTimestamp(timestamp: string) {
  const parsedTimestamp = Date.parse(timestamp);

  if (Number.isNaN(parsedTimestamp)) {
    return timestamp;
  }

  const diffInMs = parsedTimestamp - Date.now();
  const absoluteDiff = Math.abs(diffInMs);

  if (absoluteDiff < 60_000) {
    return "just now";
  }

  if (absoluteDiff < 3_600_000) {
    return relativeTimeFormatter.format(Math.round(diffInMs / 60_000), "minute");
  }

  if (absoluteDiff < 86_400_000) {
    return relativeTimeFormatter.format(Math.round(diffInMs / 3_600_000), "hour");
  }

  return relativeTimeFormatter.format(Math.round(diffInMs / 86_400_000), "day");
}

export function getSentimentColor(sentiment: NewsArticle["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return "text-[#00af30]";
    case "negative":
      return "text-[#f30000]";
    default:
      return "text-[#ffcc00]";
  }
}

export function getSentimentBg(sentiment: NewsArticle["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return "border border-[#00af30]/20 bg-[#00af30]/10";
    case "negative":
      return "border border-[#f30000]/20 bg-[#f30000]/10";
    default:
      return "border border-[#ffcc00]/20 bg-[#ffcc00]/10";
  }
}

export function getImpactBadge(impact: NewsArticle["impact"]) {
  switch (impact) {
    case "high":
      return "border border-[#f30000]/30 bg-[#f30000]/20 text-[#f30000]";
    case "medium":
      return "border border-[#ffcc00]/30 bg-[#ffcc00]/20 text-[#ffcc00]";
    default:
      return "border border-[#bcc3d3]/30 bg-[#bcc3d3]/20 text-[#bcc3d3]";
  }
}

export function getAIConfidenceColor(confidence: number) {
  if (confidence >= 85) {
    return "border border-[#00af30]/30 bg-[#00af30]/10 text-[#00af30]";
  }

  if (confidence >= 70) {
    return "border border-[#ffcc00]/30 bg-[#ffcc00]/10 text-[#ffcc00]";
  }

  return "border border-[#f30000]/30 bg-[#f30000]/10 text-[#f30000]";
}

export function getAICategoryIcon(category: AIInsightCategory) {
  switch (category) {
    case "market_sentiment":
      return "📊";
    case "trend_analysis":
      return "📈";
    case "risk_alert":
      return "⚠️";
    case "opportunity":
      return "💡";
    default:
      return "📊";
  }
}
