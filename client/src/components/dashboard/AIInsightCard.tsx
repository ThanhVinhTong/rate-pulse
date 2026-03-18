"use client";

import { memo } from "react";
import { Clock } from "lucide-react";

import { getAICategoryIcon, getAIConfidenceColor, formatTimestamp } from "@/data/newsData";
import { cn } from "@/lib/utils";
import type { AIInsight } from "@/types";

interface AIInsightCardProps {
  insight: AIInsight;
}

export const AIInsightCard = memo(function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <article className="rounded-xl border border-border bg-panel p-6 transition-all hover:border-primary/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="text-4xl leading-none" aria-hidden="true">
            {getAICategoryIcon(insight.category)}
          </span>

          <div>
            <h2 className="text-lg font-semibold text-text-primary">{insight.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{insight.insight}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                <Clock size={14} aria-hidden="true" />
                {formatTimestamp(insight.timestamp)}
              </span>

              <div className="flex flex-wrap gap-2">
                {insight.relatedAssets.map((asset) => (
                  <span
                    key={asset}
                    className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {asset}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            getAIConfidenceColor(insight.confidence),
          )}
        >
          {insight.confidence}% Confidence
        </span>
      </div>
    </article>
  );
});
