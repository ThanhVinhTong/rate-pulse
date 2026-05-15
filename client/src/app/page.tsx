import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Globe2,
  LineChart,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { NewsArticleCard } from "@/components/dashboard/NewsArticleCard";
import { HeroGradientBackdrop } from "@/components/ui/hero";
import { HomeHeroShowcase } from "@/components/home/HomeHeroShowcase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import { TextLink } from "@/components/ui/text-link";
import { fetchBreakingNews } from "@/lib/newsService";
import type { NewsArticleRegion } from "@/types";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Rate-pulse - monitor FX quotes from multiple sources and read macro news that helps explain moves.",
};

const quickStats = [
  { label: "Primary views", value: "4", detail: "Rates, converter, historical, and news" },
  { label: "Rate context", value: "Pair + source", detail: "Compare quotes without losing origin details" },
  { label: "Preview policy", value: "No fake prices", detail: "Home visuals avoid implying executable data" },
] as const;

const workflowSteps = [
  {
    title: "Find the pair",
    body: "Start with a clean board built for pair, currency, and source review.",
    icon: Search,
  },
  {
    title: "Check the move",
    body: "Use historical charts to compare recent behavior before making notes.",
    icon: LineChart,
  },
  {
    title: "Read the reason",
    body: "Scan macro headlines beside your rate workflow when markets move.",
    icon: Newspaper,
  },
  {
    title: "Refresh the view",
    body: "Return to the live views after signing in for the latest available data.",
    icon: RefreshCw,
  },
] as const;

const valueProps = [
  {
    title: "Multi-source rates",
    body: "Compare bank and channel quotes in one place by pair, currency, and source.",
    icon: Globe2,
  },
  {
    title: "News in context",
    body: "Headlines tagged by region and impact, alongside the rates view and historical.",
    icon: Newspaper,
  },
  {
    title: "Signed-in data",
    body: "Live figures come from your authenticated session to the API, not the hero preview.",
    icon: ShieldCheck,
  },
] as const;

const fxPreviewCards = [
  {
    label: "Compare",
    title: "Rates by source",
    body: "Group bank and provider quotes by base currency, target currency, and source.",
  },
  {
    label: "Filter",
    title: "Fast controls",
    body: "Search pairs, narrow sources, and review only the targets you need.",
  },
  {
    label: "Review",
    title: "Latest updates",
    body: "See update timestamps and source metadata without leaving the rates view.",
  },
] as const;

export default async function Home() {
  const feedDocs = await fetchBreakingNews();
  const homeNews: NewsArticleRegion[] = (feedDocs || []).map((doc) => ({
    title: doc.title,
    href: doc.href,
    domain: doc.domain,
    source: doc.source,
    category: "World News",
    timestamp: doc.time || null,
  }));

  return (
    <div className="space-y-0 pb-6">
      <Panel variant="hero" className="relative" id="introduction" aria-labelledby="hero-heading">
        <HeroGradientBackdrop />
        <div className="relative grid gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-12 lg:py-16">
          <div>
            <Text variant="overline">FX &amp; macro monitor</Text>

            <h1
              id="hero-heading"
              className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] text-text-primary sm:text-5xl lg:text-7xl"
            >
              Compare exchange rates with context.
            </h1>
            <Text variant="bodyLg" className="mt-4 max-w-xl">
              Watch quotes from multiple sources, convert currency, review historical movement, and scan stories that
              sit beside your FX workflow.
            </Text>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <TextLink className="text-white" href="/exchange-rates" variant="cta">
                View exchange rates
              </TextLink>
              <TextLink href="/login" variant="subtle">
                Sign in for live data
              </TextLink>
            </div>
          </div>

          <HomeHeroShowcase />
        </div>
      </Panel>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Product summary">
        {quickStats.map((item) => (
          <Panel key={item.label} variant="inset" padding="md">
            <Text variant="labelUpper">{item.label}</Text>
            <p className="mt-3 text-xl font-semibold text-text-primary">{item.value}</p>
            <Text variant="muted" className="mt-2 leading-6">
              {item.detail}
            </Text>
          </Panel>
        ))}
      </section>

      <section className="mt-14 scroll-mt-24 sm:mt-20" aria-labelledby="workflow-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Text variant="overlineBrand">Workflow</Text>
            <Heading level="h2" className="mt-2" id="workflow-heading">
              Move from quote to context
            </Heading>
            <Text variant="muted" className="mt-2 max-w-2xl">
              The home page mirrors the main journey through the product: compare, convert, review, and read.
            </Text>
          </div>
          <TextLink href="/converter" variant="inline">
            Open converter
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TextLink>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {workflowSteps.map((item, index) => (
            <Panel key={item.title} variant="darkSection" padding="md">
              <div className="flex items-center justify-between gap-3">
                <item.icon className="h-5 w-5 text-accent" aria-hidden />
                <span className="font-mono text-xs text-text-tertiary">0{index + 1}</span>
              </div>
              <Heading level="h3" className="mt-5">
                {item.title}
              </Heading>
              <Text variant="muted" className="mt-2 leading-6">
                {item.body}
              </Text>
            </Panel>
          ))}
        </div>
      </section>

      <section
        className="mt-14 scroll-mt-24 border-t border-border pt-14 sm:mt-20 sm:pt-20"
        aria-labelledby="value-props-heading"
      >
        <div className="max-w-2xl">
          <Text variant="overlineBrand">Core views</Text>
          <Heading level="h2" className="mt-2" id="value-props-heading">
            Built for rate comparison
          </Heading>
          <Text variant="muted" className="mt-2">
            Each primary view keeps the rate source, market context, and user session clear.
          </Text>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {valueProps.map((item) => (
            <Panel key={item.title} variant="heroCard" padding="md">
              <item.icon className="h-8 w-8 text-[#00d3e5]" aria-hidden />
              <Heading level="h3" className="mt-4">
                {item.title}
              </Heading>
              <Text variant="muted" className="mt-2 leading-relaxed">
                {item.body}
              </Text>
            </Panel>
          ))}
        </div>
      </section>

      <section
        id="exchange-rates"
        aria-labelledby="fx-heading"
        className="scroll-mt-24 border-t border-border pt-14 sm:pt-20"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Text variant="overlineBrand">Markets</Text>
            <Heading level="h2" className="mt-2" id="fx-heading">
              FX board
            </Heading>
            <Text variant="muted" className="mt-2 max-w-lg">
              Filters, source-aware tables, timestamps, and a converter once you open the workspace.
            </Text>
          </div>
          <TextLink href="/exchange-rates" variant="inline">
            Open rates
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TextLink>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {fxPreviewCards.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{item.label}</p>
                <CardTitle className="mt-2">{item.title}</CardTitle>
                <CardDescription className="mt-2">{item.body}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 rounded-full bg-panel">
                  <div className="h-2 w-2/3 rounded-full bg-primary/70" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="news"
        aria-labelledby="news-heading"
        className="scroll-mt-24 border-t border-border pt-14 sm:pb-8 sm:pt-20"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Text variant="overlineBrand">Macro</Text>
            <Heading level="h2" className="mt-2" id="news-heading">
              Headlines
            </Heading>
            <Text variant="muted" className="mt-2 max-w-lg">
              Stories you can cross-check with moves on the board and in Historical.
            </Text>
          </div>
          <TextLink href="/historical" variant="inline">
            News &amp; charts in Historical
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TextLink>
        </div>

        {homeNews.length > 0 ? (
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {homeNews.slice(0, 3).map((article) => (
              <NewsArticleCard key={article.title} article={article} />
            ))}
          </div>
        ) : (
          <Panel variant="inset" padding="md" className="mt-10 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-accent" aria-hidden />
            <Text variant="muted">Latest headlines will appear here when the news feed is available.</Text>
          </Panel>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          <TextLink href="/historical" variant="pill">
            <BarChart3 className="h-4 w-4 text-[#00d3e5]" aria-hidden />
            Historical
          </TextLink>
          <TextLink href="/signup" variant="inlineMuted">
            Need an account? Sign up
          </TextLink>
        </div>
      </section>
    </div>
  );
}
