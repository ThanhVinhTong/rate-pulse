import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-primary/10 uppercase tracking-wide text-primary",
      success: "bg-status-success/10 text-status-success",
      warning: "bg-status-warning/10 text-status-warning",
      danger: "bg-status-danger/10 text-status-danger",
      muted: "bg-white/5 text-text-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
