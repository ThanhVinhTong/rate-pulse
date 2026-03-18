"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Filter, Newspaper, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
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

function AnalyticsTabButton({
  item,
  activeTab,
  onSelect,
}: {
  item: TabItem;
  activeTab: AnalyticsTab;
  onSelect: (tab: AnalyticsTab) => void;
}) {
  const Icon = item.icon;
  const isActive = activeTab === item.id;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`${item.id}-panel`}
      id={`${item.id}-tab`}
      onClick={() => onSelect(item.id)}
      className={cn(
        "relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-medium transition-all",
        isActive ? "text-primary" : "text-text-muted hover:text-text-primary",
      )}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary transition-all",
          isActive ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

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
        <button
          type="button"
          onClick={() => onChange("All")}
          aria-pressed={value === "All"}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            value === "All"
              ? "bg-primary text-white"
              : "border border-border bg-transparent text-text-primary hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
          )}
        >
          {allLabel}
        </button>

        {items.map((item) => {
          const isActive = value === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-pressed={isActive}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white"
                  : "border border-border bg-transparent text-text-primary hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </div>
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
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary lg:text-3xl">News &amp; Analytics</h1>
        <p className="text-sm text-text-muted lg:text-base">
          Real-time market news and AI-powered insights
        </p>
      </header>

      <div className="overflow-x-auto border-b border-border">
        <div className="flex min-w-max items-center" role="tablist" aria-label="Analytics sections">
          {tabItems.map((item) => (
            <AnalyticsTabButton
              key={item.id}
              item={item}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          ))}
        </div>
      </div>

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
          <div className="rounded-xl border border-border bg-panel p-4">
            <label htmlFor="news-search" className="sr-only">
              Search news
            </label>
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-text-muted" aria-hidden="true" />
              <input
                id="news-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search news..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>
          </div>

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
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">
              {filteredArticles.length} {filteredArticles.length === 1 ? "story" : "stories"} matched
            </p>
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
          <div className="rounded-xl border border-border bg-panel p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary lg:text-xl">
                Market Sector Performance
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Relative 24-hour moves across sectors, sized by intensity for faster scanning.
              </p>
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
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-border bg-panel p-4 text-sm">
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
