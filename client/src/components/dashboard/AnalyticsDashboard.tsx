"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Filter, Newspaper, Search, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { PageHeaderSimple } from "@/components/ui/page-header";
import { Text } from "@/components/ui/typography";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import type { AIInsight, AnalyticsTab, NewsArticle, NewsCategory, NewsRegion, SectorData } from "@/types";

import { AIInsightCard } from "./AIInsightCard";
import { NewsArticleCard } from "./NewsArticleCard";
import { SectorHeatmapTile } from "./SectorHeatmapTile";

type RegionFilter = NewsRegion | "All";
type CategoryFilter = NewsCategory | "All";

interface AnalyticsDashboardProps {
  insights: AIInsight[];
  articles: NewsArticle[];
  sectors: SectorData[];
  regions: readonly NewsRegion[];
  categories: readonly NewsCategory[];
}

interface TabItem {
  id: AnalyticsTab;
  label: string;
  icon: LucideIcon;
}

interface FilterGroupProps<T extends string> {
  label: string;
  allLabel: string;
  items: readonly T[];
  value: T | "All";
  onChange: (value: T | "All") => void;
}

const tabItems: TabItem[] = [
  { id: "ai-insights", label: "AI Insights", icon: Sparkles },
  { id: "news", label: "News Hub", icon: Newspaper },
  { id: "heatmap", label: "Sector Heatmap", icon: BarChart3 },
];

function FilterGroup<T extends string>({
  label,
  allLabel,
  items,
  value,
  onChange,
}: FilterGroupProps<T>) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Filter size={16} aria-hidden="true" />
        <span>{label}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={value === "All"} onClick={() => onChange("All")} aria-pressed={value === "All"}>
          {allLabel}
        </FilterChip>

        {items.map((item) => {
          const isActive = value === item;

          return (
            <FilterChip
              key={item}
              active={isActive}
              onClick={() => onChange(item)}
              aria-pressed={isActive}
            >
              {item}
            </FilterChip>
          );
        })}
      </div>
    </section>
  );
}

export function AnalyticsDashboard({
  insights,
  articles,
  sectors,
  regions,
  categories,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("ai-insights");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("All");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim().toLowerCase());
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesRegion = selectedRegion === "All" || article.region === selectedRegion;
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch =
        debouncedSearchQuery.length === 0 ||
        article.title.toLowerCase().includes(debouncedSearchQuery) ||
        article.summary.toLowerCase().includes(debouncedSearchQuery);

      return matchesRegion && matchesCategory && matchesSearch;
    });
  }, [articles, debouncedSearchQuery, selectedCategory, selectedRegion]);

  return (
    <div className="space-y-6">
      <PageHeaderSimple
        title="News & Analytics"
        description="Real-time market news and AI-powered insights"
      />

      <UnderlineTabs items={tabItems} value={activeTab} onChange={setActiveTab} />

      {activeTab === "ai-insights" ? (
        <section
          id="ai-insights-panel"
          role="tabpanel"
          aria-labelledby="ai-insights-tab"
          className="space-y-4"
        >
          {insights.length > 0 ? (
            insights.map((insight) => <AIInsightCard key={insight.id} insight={insight} />)
          ) : (
            <EmptyState
              title="No AI insights available"
              description="AI-generated insight cards will appear here once the feed is ready."
            />
          )}
        </section>
      ) : null}

      {activeTab === "news" ? (
        <section id="news-panel" role="tabpanel" aria-labelledby="news-tab" className="space-y-6">
          <Panel variant="searchBar">
            <label htmlFor="news-search" className="sr-only">
              Search news
            </label>
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-text-muted" aria-hidden="true" />
              <Input
                id="news-search"
                type="search"
                variant="searchTransparent"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search news..."
              />
            </div>
          </Panel>

          <FilterGroup
            label="Regions"
            allLabel="All Regions"
            items={regions}
            value={selectedRegion}
            onChange={setSelectedRegion}
          />

          <FilterGroup
            label="Topics"
            allLabel="All Topics"
            items={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          <div className="flex items-center justify-between gap-3">
            <Text variant="overline" className="text-text-tertiary">
              {filteredArticles.length} {filteredArticles.length === 1 ? "story" : "stories"} matched
            </Text>
          </div>

          <div className="space-y-4">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <NewsArticleCard key={article.id} article={article} />
              ))
            ) : (
              <EmptyState
                title="No news articles found matching your filters"
                description="Try adjusting the region, topic, or search query to broaden the results."
              />
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "heatmap" ? (
        <section
          id="heatmap-panel"
          role="tabpanel"
          aria-labelledby="heatmap-tab"
          className="space-y-4"
        >
          <Panel variant="heatmap">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary lg:text-xl">
                Market Sector Performance
              </h2>
              <Text variant="muted" className="mt-2">
                Relative 24-hour moves across sectors, sized by intensity for faster scanning.
              </Text>
            </div>

            {sectors.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sectors.map((sector) => (
                  <SectorHeatmapTile key={sector.sector} item={sector} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No sector data available"
                description="Sector performance tiles will appear here when data is available."
              />
            )}
          </Panel>

          <Panel variant="legend">
            <div className="flex items-center gap-2 text-text-muted">
              <span className="h-4 w-4 rounded bg-[#00af30]" aria-hidden="true" />
              Positive Performance
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="h-4 w-4 rounded bg-[#f30000]" aria-hidden="true" />
              Negative Performance
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="h-4 w-4 rounded bg-[#5c5769]" aria-hidden="true" />
              Neutral
            </div>
          </Panel>
        </section>
      ) : null}
    </div>
  );
}
