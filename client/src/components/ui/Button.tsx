import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-sm hover:bg-primary-muted",
        secondary:
          "border border-border bg-card text-white shadow-sm hover:border-primary/50 hover:bg-panel",
        ghost:
          "text-white hover:bg-panel",
        outline:
          "min-h-10 rounded-md border border-border bg-transparent px-4 text-sm font-medium text-white hover:border-primary hover:text-primary",
        outlineMobile:
          "min-h-10 w-full rounded-md border border-border bg-transparent px-4 text-sm font-medium text-white hover:border-primary hover:text-primary",
        navCta:
          "inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-muted",
        icon: "inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-white shadow-sm hover:bg-panel",
        iconSquare:
          "flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-muted",
        destructive:
          "border border-status-danger/30 bg-status-danger/10 text-status-danger hover:bg-status-danger/20",
        compact:
          "inline-flex min-h-0 items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-muted disabled:cursor-not-allowed disabled:opacity-50",
        passwordSubmit:
          "rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-muted disabled:opacity-50",
        dangerSolid:
          "whitespace-nowrap rounded-md bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-900/80 dark:text-red-100 dark:hover:bg-red-900",
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
