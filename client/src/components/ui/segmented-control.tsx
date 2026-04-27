import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const segmentedRootVariants = cva(
  "inline-flex max-w-full gap-1 overflow-x-auto rounded-md border p-1",
  {
    variants: {
      tone: {
        default: "border-border bg-panel",
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
        false: "text-text-muted hover:bg-card hover:text-text-primary",
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
