import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Globe2, Newspaper, ShieldCheck } from "lucide-react";

import { NewsArticleCard } from "@/components/dashboard/NewsArticleCard";
import { HomeHeroShowcase } from "@/components/home/HomeHeroShowcase";
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

const previewPairs = [
  { pair: "USD / JPY", tag: "Cash & transfer" },
  { pair: "EUR / VND", tag: "Per bank & type" },
  { pair: "GBP / USD", tag: "Converter & chart" },
] as const;

const homeNews = NEWS_ARTICLES.slice(0, 3);

export default function Home() {
  return (
    <div className="space-y-0 pb-6">
      <section
        id="introduction"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#242e44] shadow-panel"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 105, 254, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0, 211, 229, 0.2), transparent)",
          }}
        />
        <div className="relative grid gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-12 lg:py-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary">
              FX &amp; macro monitor
            </p>

            <h1
              id="hero-heading"
              className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl"
            >
              <span className="gradient-text-animated">Rates, news, and why they move.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg font-medium text-text-muted sm:text-xl">
              Watch quotes from multiple sources and scan stories that sit next to your FX workflow—no execution,
              no implied performance.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/exchange-rates"
                className="inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-xl bg-[#0069fe] px-8 text-base font-semibold text-white shadow-lg shadow-[#0069fe]/25 transition hover:bg-[#0058d6]"
              >
                View exchange rates
              </Link>
              <Link
                href="/login"
                className="text-center text-sm font-medium text-text-muted underline-offset-4 hover:text-white sm:text-left"
              >
                Sign in for live data
              </Link>
            </div>
          </div>

          <HomeHeroShowcase />
        </div>
      </section>

      <section className="mt-14 scroll-mt-24 sm:mt-20" aria-labelledby="value-props-heading">
        <h2 id="value-props-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {valueProps.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#242e44]/80 p-6 transition hover:border-[#00d3e5]/40"
            >
              <item.icon className="h-8 w-8 text-[#00d3e5]" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="exchange-rates"
        aria-labelledby="fx-heading"
        className="scroll-mt-24 border-t border-white/10 pt-14 sm:pt-20"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00d3e5]">Markets</p>
            <h2 id="fx-heading" className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              FX board
            </h2>
            <p className="mt-2 max-w-lg text-sm text-text-muted">
              Filters, per-source tables, and a converter once you open the dashboard.
            </p>
          </div>
          <Link
            href="/exchange-rates"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0069fe] transition hover:text-[#00d3e5]"
          >
            Open rates
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {previewPairs.map((item) => (
            <article
              key={item.pair}
              className="rounded-2xl border border-white/10 bg-[#242e44]/60 p-6 ring-1 ring-white/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{item.tag}</p>
              <h3 className="mt-3 text-xl font-bold text-white">{item.pair}</h3>
              <p className="mt-6 text-xs text-text-tertiary">Shown in-app when data is available</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="news"
        aria-labelledby="news-heading"
        className="scroll-mt-24 border-t border-white/10 pt-14 sm:pb-8 sm:pt-20"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00d3e5]">Macro</p>
            <h2 id="news-heading" className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Headlines
            </h2>
            <p className="mt-2 max-w-lg text-sm text-text-muted">
              Stories you can cross-check with moves on the board and in Analytics.
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0069fe] transition hover:text-[#00d3e5]"
          >
            News &amp; charts in Analytics
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {homeNews.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#242e44] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#00d3e5]/50"
          >
            <BarChart3 className="h-4 w-4 text-[#00d3e5]" aria-hidden />
            Analytics
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-text-muted transition hover:text-white"
          >
            Need an account? Sign up
          </Link>
        </div>
      </section>
    </div>
  );
}
