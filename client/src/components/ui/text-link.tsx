import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const textLinkVariants = cva("transition", {
  variants: {
    variant: {
      primary: "font-medium text-primary hover:text-accent",
      nav: "inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-slate-200 hover:text-white",
      navCta: "inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1b78ff]",
      navOutline:
        "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-slate-200 hover:text-white",
      subtle: "text-center text-sm font-medium text-text-muted underline-offset-4 hover:text-white sm:text-left",
      cta: "inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-xl bg-[#0069fe] px-8 text-base font-semibold text-white shadow-lg shadow-[#0069fe]/25 transition hover:bg-[#0058d6]",
      inline: "inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0069fe] transition hover:text-[#00d3e5]",
      inlineMuted: "text-sm font-medium text-text-muted transition hover:text-white",
      pill: "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#242e44] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#00d3e5]/50",
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
