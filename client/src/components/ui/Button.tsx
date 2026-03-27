import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-[#1b78ff]",
        secondary:
          "border border-border bg-panel/50 text-text-primary hover:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:hover:text-white",
        ghost:
          "text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/5 dark:hover:text-white",
        outline:
          "min-h-11 rounded-xl border border-border px-4 text-sm font-medium text-text-primary hover:border-primary hover:text-primary dark:border-white/10 dark:text-slate-200 dark:hover:text-white",
        outlineMobile:
          "min-h-11 w-full rounded-xl border border-border px-4 text-sm font-medium text-text-primary hover:border-primary dark:border-white/10 dark:text-slate-200 dark:hover:text-white",
        navCta:
          "inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1b78ff]",
        icon: "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-panel/50 text-text-primary dark:border-white/10 dark:bg-white/5 dark:text-white",
        iconSquare:
          "flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary/90",
        destructive:
          "border border-status-danger/30 bg-status-danger/10 text-red-200 hover:bg-status-danger/20",
        compact:
          "inline-flex min-h-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
        passwordSubmit:
          "rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50",
        dangerSolid:
          "whitespace-nowrap rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-900/80 dark:text-red-100 dark:hover:bg-red-900",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {}

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
