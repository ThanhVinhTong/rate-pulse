import type { Metadata } from "next";
import { ArrowRight, BarChart3, Globe2, Newspaper, ShieldCheck } from "lucide-react";

import { NewsArticleCard } from "@/components/dashboard/NewsArticleCard";
import { HeroGradientBackdrop } from "@/components/ui/hero";
import { HomeHeroShowcase } from "@/components/home/HomeHeroShowcase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import { TextLink } from "@/components/ui/text-link";
import { NEWS_ARTICLES } from "@/data/newsData";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Rate-pulse — monitor FX quotes from multiple sources and read macro news that helps explain moves.",
};

const valueProps = [
  {
    title: "Multi-source rates",
    body: "Compare bank and channel quotes in one place—by pair and source.",
    icon: Globe2,
  },
  {
    title: "News in context",
    body: "Headlines tagged by region and impact, alongside the rates view and analytics.",
    icon: Newspaper,
  },
  {
    title: "Signed-in data",
    body: "Live figures come from your authenticated session to the API—not the hero preview.",
    icon: ShieldCheck,
  },
] as const;

const homeNews = NEWS_ARTICLES.slice(0, 3);

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

export default function Home() {
  return (
    <div className="space-y-0 pb-6">
      <Panel variant="hero" className="relative" id="introduction" aria-labelledby="hero-heading">
        <HeroGradientBackdrop />
        <div className="relative grid gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-12 lg:py-16">
          <div>
            <Text variant="overline">FX &amp; macro monitor</Text>

            <h1
              id="hero-heading"
              className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-7xl"
            >
              Compare exchange rates with context.
            </h1>
            <Text variant="bodyLg" className="mt-4 max-w-md">
              Watch quotes from multiple sources and scan stories that sit next to your FX workflow. No execution, no
              implied performance.
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

      <section className="mt-14 scroll-mt-24 sm:mt-20" aria-labelledby="value-props-heading">
        <h2 id="value-props-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
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
            <Heading level="h2" className="mt-2">
              FX board
            </Heading>
            <Text variant="muted" className="mt-2 max-w-lg">
              Filters, per-source tables, and a converter once you open the dashboard.
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
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  {item.label}
                </p>
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
            <Heading level="h2" className="mt-2">
              Headlines
            </Heading>
            <Text variant="muted" className="mt-2 max-w-lg">
              Stories you can cross-check with moves on the board and in Analytics.
            </Text>
          </div>
          <TextLink href="/analytics" variant="inline">
            News &amp; charts in Analytics
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TextLink>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {homeNews.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          <TextLink href="/analytics" variant="pill">
            <BarChart3 className="h-4 w-4 text-[#00d3e5]" aria-hidden />
            Analytics
          </TextLink>
          <TextLink href="/signup" variant="inlineMuted">
            Need an account? Sign up
          </TextLink>
        </div>
      </section>
    </div>
  );
}
