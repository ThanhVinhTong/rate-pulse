import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const textLinkVariants = cva("transition", {
  variants: {
    variant: {
      primary: "font-medium text-primary hover:text-accent",
      nav: "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-text-primary",
      navCta: "inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-primary-muted",
      navOutline:
        "inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-white/15 px-4 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-text-primary",
      subtle: "text-center text-sm font-medium text-text-muted underline-offset-4 hover:text-text-primary sm:text-left",
      cta: "inline-flex min-h-11 min-w-[200px] items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-text-primary shadow-sm transition hover:bg-primary-muted",
      inline: "inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-muted",
      inlineMuted: "text-sm font-medium text-text-muted transition hover:text-text-primary",
      pill: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type NextLinkProps = ComponentProps<typeof Link>;

export interface TextLinkProps extends NextLinkProps, VariantProps<typeof textLinkVariants> {}

export function TextLink({ className, variant, ...props }: TextLinkProps) {
  return <Link className={cn(textLinkVariants({ variant }), className)} {...props} />;
}
