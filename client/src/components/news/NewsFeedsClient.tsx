"use client";

import { useState } from "react";
import { Globe2, Landmark, Building2, TrendingUp, Zap, RadioTower, Flame, Map } from "lucide-react";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { NewsArticleCard } from "@/components/dashboard/NewsArticleCard";
import type { FeedArticleDoc, NewsArticle } from "@/types";

interface NewsFeedsClientProps {
  feeds: Record<string, FeedArticleDoc[]>;
}

const REGION_TABS = [
  { id: "world_news", label: "World", icon: Globe2 },
  { id: "united_states", label: "United States", icon: Landmark },
  { id: "europe", label: "Europe", icon: Map },
  { id: "middle_east", label: "Middle East", icon: Flame },
  { id: "asia_pacific", label: "Asia Pacific", icon: Map },
  { id: "africa", label: "Africa", icon: Map },
  { id: "latin_america", label: "Latin America", icon: Map },
];

const SECTOR_TABS = [
  { id: "intel_feed", label: "Intel Feed", icon: RadioTower },
  { id: "government", label: "Government", icon: Landmark },
  { id: "think_tanks", label: "Think Tanks", icon: Building2 },
  { id: "financial", label: "Financial", icon: TrendingUp },
  { id: "energy_and_resources", label: "Energy & Resources", icon: Zap },
];

type TabId = string;

export function NewsFeedsClient({ feeds }: NewsFeedsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("world_news");

  // Format category text nicely (e.g., "world_news" -> "World News")
  const formatCategory = (key: string) => {
    return key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const currentFeed = feeds[activeTab] || [];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Regions
        </div>
        <UnderlineTabs
          items={REGION_TABS}
          value={activeTab}
          onChange={setActiveTab}
          className="border-none"
        />
        <div className="mt-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Sectors & Intelligence
        </div>
        <UnderlineTabs
          items={SECTOR_TABS}
          value={activeTab}
          onChange={setActiveTab}
          className="border-none"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {currentFeed.length > 0 ? (
          currentFeed.map((doc, i) => {
            // Map FeedArticleDoc to NewsArticle so we can use NewsArticleCard
            const article: NewsArticle = {
              title: doc.title,
              href: doc.href,
              domain: doc.domain,
              source: doc.source,
              category: formatCategory(activeTab) as any, // Cast to any to bypass strict type for dynamic keys
              timestamp: doc.time || null,
            };

            return <NewsArticleCard key={`${doc.href}-${i}`} article={article} />;
          })
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">
            No articles found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
