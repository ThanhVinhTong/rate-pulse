import type { Metadata } from "next";
import { AlertTriangle, Globe2, ShieldCheck, Zap, Radar, RadioTower } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import { fetchLatestSnapshot } from "@/lib/newsService";
import { NewsFeedsClient } from "@/components/news/NewsFeedsClient";

export const metadata: Metadata = {
  title: "News & Intelligence",
  description: "Live FX news and geopolitical intelligence.",
};

export default async function NewsPage() {
  const snapshot = await fetchLatestSnapshot();

  if (!snapshot) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Text variant="muted">Failed to load intelligence data. Please try again later.</Text>
      </div>
    );
  }

  const { ai_insights, feeds } = snapshot;

  return (
    <div className="space-y-12 pb-12">
      {/* 1. Hero / AI Briefing Section */}
      <Panel variant="hero" className="relative overflow-hidden" id="world-brief" aria-labelledby="world-brief-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-surface" />
        <div className="relative px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-6 w-6 text-accent" />
            <Text variant="overlineBrand">Global Briefing</Text>
          </div>
          <h1
            id="world-brief-heading"
            className="text-1xl font-bold leading-tight tracking-tight text-text-primary sm:text-2xl lg:text-3xl"
          >
            {ai_insights.world_brief}
          </h1>
          <div className="mt-8 flex items-center gap-2 text-sm text-text-muted">
            <ShieldCheck className="h-4 w-4" />
            <span>News Summary • Cross-checked across multiple sources</span>
          </div>
        </div>
      </Panel>

      {/* 2. Breaking News Highlight */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="breaking-news-heading">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-status-danger" />
            <Heading level="h2" id="breaking-news-heading">Breaking News</Heading>
          </div>
          <span className="text-sm text-text-muted">Preview only</span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ai_insights.break_news.map((headline, idx) => (
            <div 
              key={idx}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface to-panel p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <Text className="font-serif text-lg font-bold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-primary">
                {headline}
              </Text>

              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-status-danger">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-status-danger"></span>
                  </span>
                  Live Update
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Geopolitical Insights Map */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="geo-insights-heading">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <RadioTower className="h-5 w-5 text-status-warning" />
          <Heading level="h2" id="geo-insights-heading">Geopolitical Hotspots</Heading>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ai_insights.geo_insights.map((geo, idx) => (
            <Panel 
              key={idx}
              variant="glass"
              className="group relative flex flex-col gap-4 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-status-warning/50 hover:shadow-xl hover:shadow-status-warning/10"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-status-warning/10 blur-2xl transition-all duration-500 group-hover:bg-status-warning/20 group-hover:blur-3xl" />
              
              <div className="relative flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-danger"></span>
                </span>
                <Heading level="h3" className="text-xl transition-colors group-hover:text-status-warning">
                  {geo.region}
                </Heading>
              </div>

              <Text variant="muted" className="relative text-sm">
                {geo.detail}
              </Text>
              
              <div className="relative mt-auto flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
                <div className="flex items-center gap-1.5 rounded-full border border-status-warning/20 bg-status-warning/5 px-3 py-1 text-xs font-medium text-text-primary transition-colors group-hover:border-status-warning/40 group-hover:bg-status-warning/10">
                  <Zap className="h-3 w-3 text-status-warning animate-pulse" />
                  {geo.signal_types} Signal Types
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-status-danger/20 bg-status-danger/5 px-3 py-1 text-xs font-medium text-text-primary transition-colors group-hover:border-status-danger/40 group-hover:bg-status-danger/10">
                  <AlertTriangle className="h-3 w-3 text-status-danger" />
                  {geo.events} Events
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* 4. Categorized News Feeds */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="feeds-heading">
        <div className="mb-8 flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-primary" />
            <Heading level="h2" id="feeds-heading">Intelligence Feeds</Heading>
          </div>
          <span className="text-sm text-text-muted">Condensed news briefings</span>
        </div>

        <NewsFeedsClient feeds={feeds} />
      </section>
    </div>
  );
}
