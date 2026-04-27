import type { Metadata } from "next";
import { AlertTriangle, Globe2, RadioTower, ShieldCheck, Zap } from "lucide-react";

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
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-background to-background" />
        <div className="relative px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-6 w-6 text-[#00d3e5]" />
            <Text variant="overlineBrand">Global Briefing</Text>
          </div>
          <h1
            id="world-brief-heading"
            className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            {ai_insights.world_brief}
          </h1>
          <div className="mt-8 flex items-center gap-2 text-sm text-text-muted">
            <ShieldCheck className="h-4 w-4" />
            <span>AI-generated insight • Cross-checked across multiple sources</span>
          </div>
        </div>
      </Panel>

      {/* 2. Breaking News Highlight */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="breaking-news-heading">
        <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
          <AlertTriangle className="h-5 w-5 text-[#f30000]" />
          <Heading level="h2" id="breaking-news-heading">Breaking News</Heading>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ai_insights.break_news.map((headline, idx) => (
            <div 
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-[#f30000]/20 bg-[#f30000]/5 p-5 transition-colors hover:bg-[#f30000]/10"
            >
              <Text className="font-medium leading-snug text-white">
                {headline}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Geopolitical Insights Map */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="geo-insights-heading">
        <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
          <RadioTower className="h-5 w-5 text-[#ffcc00]" />
          <Heading level="h2" id="geo-insights-heading">Geopolitical Hotspots</Heading>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ai_insights.geo_insights.map((geo, idx) => (
            <div 
              key={idx}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <Heading level="h3" className="text-xl text-white">
                {geo.region}
              </Heading>
              <Text variant="muted" className="text-sm">
                {geo.detail}
              </Text>
              
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                  <Zap className="h-3 w-3 text-[#ffcc00]" />
                  {geo.signal_types} Signal Types
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3 text-[#f30000]" />
                  {geo.events} Events
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Categorized News Feeds */}
      <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="feeds-heading">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-white/10 pb-4">
          <div>
            <Heading level="h2" id="feeds-heading">Intelligence Feeds</Heading>
            <Text variant="muted" className="mt-2">
              Raw updates organized by region and sector.
            </Text>
          </div>
        </div>

        <NewsFeedsClient feeds={feeds} />
      </section>
    </div>
  );
}
