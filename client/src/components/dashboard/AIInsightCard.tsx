"use client";

import { memo } from "react";
import { Clock } from "lucide-react";
import { cva } from "class-variance-authority";

import { ArticlePanel, assetTagVariants } from "@/components/ui/article-card";
import { Heading, Text } from "@/components/ui/typography";
import { getAICategoryIcon, getAIConfidenceColor, formatTimestamp } from "@/data/newsData";
import { cn } from "@/lib/utils";
import type { AIInsight } from "@/types";

const confidenceBadge = cva("inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold");

interface AIInsightCardProps {
  insight: AIInsight;
}

export const AIInsightCard = memo(function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <ArticlePanel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="text-4xl leading-none" aria-hidden="true">
            {getAICategoryIcon(insight.category)}
          </span>

          <div>
            <Heading level="mutedTitle">{insight.title}</Heading>
            <Text variant="muted" className="mt-3 leading-relaxed">
              {insight.insight}
            </Text>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                <Clock size={14} aria-hidden="true" />
                {formatTimestamp(insight.timestamp)}
              </span>

              <div className="flex flex-wrap gap-2">
                {insight.relatedAssets.map((asset) => (
                  <span key={asset} className={assetTagVariants()}>
                    {asset}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <span className={cn(confidenceBadge(), getAIConfidenceColor(insight.confidence))}>
          {insight.confidence}% Confidence
        </span>
      </div>
    </ArticlePanel>
  );
});
