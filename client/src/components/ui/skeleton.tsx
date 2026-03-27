import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const skeletonVariants = cva("animate-pulse rounded-2xl border border-white/10 bg-white/5", {
  variants: {
    size: {
      banner: "h-40",
      card: "h-64",
    },
  },
  defaultVariants: {
    size: "card",
  },
});

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, size, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ size }), className)} {...props} />;
}

interface LoadingSkeletonProps {
  cards?: number;
}

export function LoadingSkeletonLayout({ cards = 4 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <Skeleton size="banner" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} size="card" />
        ))}
      </div>
    </div>
  );
}
