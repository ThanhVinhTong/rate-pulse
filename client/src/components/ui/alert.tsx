import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const alertVariants = cva("rounded-xl px-4 py-3 text-sm", {
  variants: {
    variant: {
      error: "border border-status-danger/30 bg-status-danger/10 text-status-danger",
      dangerPanel: "rounded-xl border border-status-danger/20 bg-status-danger/10 p-6",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}
