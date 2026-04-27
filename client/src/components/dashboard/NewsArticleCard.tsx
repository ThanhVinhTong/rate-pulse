"use client";

import { memo } from "react";
import { Clock } from "lucide-react";

import {
  categoryPillVariants,
  NewsArticleLink,
  regionPillVariants,
} from "@/components/ui/article-card";
import { Heading } from "@/components/ui/typography";
import { NEWS_REGIONS } from "@/types";
import type { NewsArticle } from "@/types";

interface NewsArticleCardProps {
  article: NewsArticle;
}

export const NewsArticleCard = memo(function NewsArticleCard({ article }: NewsArticleCardProps) {
  return (
    <NewsArticleLink
      href={article.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open article: ${article.title}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={categoryPillVariants()}>{article.category}</span>
        </div>
      </div>

      <Heading level="mutedTitle" className="mt-4 font-serif text-xl font-bold leading-snug tracking-normal">
        {article.title}
      </Heading>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span>{article.source}</span>
        <span aria-hidden="true">•</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {article.timestamp}
        </span>
      </div>
    </NewsArticleLink>
  );
});
