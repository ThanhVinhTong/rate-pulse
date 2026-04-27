import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const panelVariants = cva("rounded-xl", {
  variants: {
    variant: {
      glass: 
        "border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm dark:border-border dark:bg-surface-elevated dark:shadow-panel",
      sheet:
        "border border-border bg-card text-text-primary shadow-md dark:border-border dark:bg-white/[0.06] dark:shadow-none",
      inset: 
        "border border-border bg-panel text-text-primary",
      insetMuted: 
        "bg-panel text-text-primary",
      dark: 
        "border border-border bg-surface-elevated text-text-primary dark:border-border dark:bg-[#0d1322]",
      hero: 
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm",
      heroCard: 
        "rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30",
      chart: 
        "overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm dark:border-border dark:bg-surface-elevated",
      darkSection: 
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-border dark:bg-surface-elevated",
      preview:
        "rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/50",
      dashed:
        "rounded-xl border border-dashed border-border bg-card/80 shadow-sm",
      ticker:
        "relative overflow-hidden rounded-xl border border-border bg-card py-3 shadow-sm",
      footer: 
        "border-t border-border bg-surface-elevated dark:border-border dark:bg-surface-elevated",
      mobileNav: 
        "border-t border-border bg-surface-elevated px-4 py-4 dark:border-border dark:bg-surface-elevated lg:hidden",
      session:
        "rounded-xl border border-border bg-card px-4 py-2 text-right shadow-sm dark:border-border dark:bg-surface-elevated",
      searchBar: 
        "rounded-xl border border-border bg-panel p-4 dark:border-border dark:bg-surface-elevated",
      heatmap: 
        "rounded-xl border border-border bg-panel p-6",
      legend:
        "flex flex-wrap items-center justify-center gap-6 rounded-xl border border-border bg-panel p-4 text-sm",
      rateCell:
        "rounded-lg border border-border bg-panel px-3 py-2 text-text-primary",
      converterBox:
        "flex flex-col gap-2 rounded-xl border border-border bg-panel p-4 text-text-primary",
      settingRow:
        "flex items-center justify-between rounded-xl border border-border bg-panel p-4 transition-colors",
      exchangeRateFooter:
        "mt-4 flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-xs text-text-muted dark:border-border dark:bg-surface-elevated",
      securityShell:
        "mt-8 w-full space-y-12 rounded-xl border border-border bg-card p-6 shadow-sm",
      dangerZone:
        "flex flex-col gap-4 rounded-xl border border-status-danger/20 bg-status-danger/10 p-6 sm:flex-row sm:items-center sm:justify-between",
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
