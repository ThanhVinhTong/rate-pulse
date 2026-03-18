"use client";

import { memo } from "react";
import { Clock, Minus, TrendingDown, TrendingUp } from "lucide-react";

import {
  formatTimestamp,
  getImpactBadge,
  getSentimentBg,
  getSentimentColor,
} from "@/data/newsData";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

interface NewsArticleCardProps {
  article: NewsArticle;
}

function SentimentIndicator({ sentiment }: Pick<NewsArticle, "sentiment">) {
  const sharedClassName = cn(
    "inline-flex h-10 w-10 items-center justify-center rounded-full",
    getSentimentBg(sentiment),
    getSentimentColor(sentiment),
  );

  switch (sentiment) {
    case "positive":
      return (
        <span className={sharedClassName} aria-label="Positive sentiment">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </span>
      );
    case "negative":
      return (
        <span className={sharedClassName} aria-label="Negative sentiment">
          <TrendingDown className="h-5 w-5" aria-hidden="true" />
        </span>
      );
    default:
      return (
        <span className={sharedClassName} aria-label="Neutral sentiment">
          <Minus className="h-5 w-5" aria-hidden="true" />
        </span>
      );
  }
}

export const NewsArticleCard = memo(function NewsArticleCard({ article }: NewsArticleCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-border bg-panel p-6 transition-all hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Open article: ${article.title}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide",
              getImpactBadge(article.impact),
            )}
          >
            {article.impact} impact
          </span>
          <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
            {article.category}
          </span>
          {article.region ? (
            <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-text-muted">
              {article.region}
            </span>
          ) : null}
        </div>

        <SentimentIndicator sentiment={article.sentiment} />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-text-primary">{article.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{article.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span>{article.source}</span>
        <span aria-hidden="true">•</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatTimestamp(article.timestamp)}
        </span>
        <span aria-hidden="true">•</span>
        <span>{article.readTime}</span>
      </div>
    </a>
  );
});
