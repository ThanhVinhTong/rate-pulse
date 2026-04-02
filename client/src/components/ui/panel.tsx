import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const panelVariants = cva("rounded-2xl", {
  variants: {
    variant: {
      glass: "border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-panel",
      sheet:
        "border border-border bg-card text-text-primary shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none",
      inset: "border border-white/10 bg-[#0c1220] text-oninset",
      insetMuted: "bg-[#0c1220]/40 text-oninset",
      dark: "border border-border bg-surface-elevated text-text-primary dark:border-white/10 dark:bg-[#0d1322]",
      darkSection: "overflow-hidden rounded-2xl border border-border bg-surface-elevated dark:border-white/10 dark:bg-[#0d1322]",
      hero: "relative overflow-hidden rounded-[2rem] border border-border bg-[#1e293b] shadow-lg dark:border-white/10 dark:bg-[#242e44] dark:shadow-panel",
      heroCard:
        "rounded-2xl border border-border bg-card shadow-md transition hover:border-primary/25 dark:border-white/10 dark:bg-[#242e44]/90 dark:hover:border-accent/40",
      preview:
        "rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50 dark:border-white/10 dark:bg-[#242e44]/60 dark:ring-white/5",
      dashed:
        "rounded-2xl border border-dashed border-border bg-card/80 shadow-sm dark:border-white/15 dark:bg-[#242e44]/80 dark:shadow-panel",
      ticker:
        "relative overflow-hidden rounded-2xl border border-border bg-surface-elevated py-3 shadow-sm dark:border-white/10 dark:bg-[#242e44]",
      chart:
        "overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm dark:border-white/10 dark:bg-[#242e44]",
      footer: "border-t border-border bg-surface-elevated dark:border-white/10 dark:bg-[#0f1522]/95",
      mobileNav: "border-t border-border bg-surface-elevated px-4 py-4 dark:border-white/10 dark:bg-[#0f1522] lg:hidden",
      session:
        "rounded-xl border border-border bg-card px-4 py-2 text-right shadow-sm dark:border-white/10 dark:bg-white/5",
      searchBar: "rounded-xl border border-border bg-panel p-4",
      heatmap: "rounded-xl border border-border bg-panel p-6",
      legend:
        "flex flex-wrap items-center justify-center gap-6 rounded-xl border border-border bg-panel p-4 text-sm",
      rateCell:
        "rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-oninset dark:bg-[#0c1220]/70",
      converterBox:
        "flex flex-col gap-2 rounded-xl border border-white/10 bg-[#0f172a] p-4 text-oninset dark:bg-[#0c1220]",
      settingRow:
        "flex items-center justify-between rounded-2xl border border-border bg-panel p-4 transition-colors dark:border-transparent dark:bg-[#0c1220]/50",
      exchangeRateFooter:
        "mt-4 flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-xs text-text-muted dark:border-white/10 dark:bg-white/5",
      securityShell:
        "mt-8 w-full space-y-12 rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-transparent dark:bg-transparent dark:p-0 dark:shadow-none",
      dangerZone:
        "flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/20 dark:bg-[#0c1220]",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    },
  },
  defaultVariants: {
    variant: "glass",
    padding: "none",
  },
});

export interface PanelProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof panelVariants> {}

export function Panel({ className, variant, padding, ...props }: PanelProps) {
  return <div className={cn(panelVariants({ variant, padding }), className)} {...props} />;
}
