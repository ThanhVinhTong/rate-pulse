import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const segmentedRootVariants = cva(
  "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border p-1",
  {
    variants: {
      tone: {
        default: "border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#0c1220]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export const segmentedItemVariants = cva(
  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
  {
    variants: {
      active: {
        true: "bg-primary text-white",
        false:
          "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-text-muted dark:hover:bg-white/5 dark:hover:text-white",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof segmentedRootVariants> {}

export function SegmentedControl({ className, tone, ...props }: SegmentedControlProps) {
  return <div className={cn(segmentedRootVariants({ tone }), className)} role="group" {...props} />;
}

interface SegmentedItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function SegmentedItem({ className, active, type = "button", ...props }: SegmentedItemProps) {
  return (
    <button
      type={type}
      className={cn(segmentedItemVariants({ active: active ?? false }), className)}
      {...props}
    />
  );
}
