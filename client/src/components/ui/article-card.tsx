import { cva } from "class-variance-authority";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const newsArticleLinkVariants = cva(
  "block rounded-xl border border-border bg-panel p-6 transition-all hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

export const articlePanelVariants = cva(
  "rounded-xl border border-border bg-panel p-6 transition-all hover:border-primary/50",
);

export const tagPillVariants = cva("rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide");

export const categoryPillVariants = cva(
  "rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-xs font-medium text-accent",
);

export const regionPillVariants = cva(
  "rounded-md border border-border px-2 py-1 text-xs font-medium text-text-muted",
);

export const assetTagVariants = cva(
  "rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary",
);

export function NewsArticleLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn(newsArticleLinkVariants(), className)} {...props} />;
}

export function ArticlePanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <article className={cn(articlePanelVariants(), className)} {...props} />;
}
