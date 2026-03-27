import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const containerVariants = cva("mx-auto w-full", {
  variants: {
    maxWidth: {
      default: "max-w-7xl px-4 sm:px-6 lg:px-8",
      narrow: "max-w-5xl",
      prose: "max-w-2xl",
    },
    verticalPadding: {
      none: "",
      sm: "py-6",
      md: "py-8",
    },
  },
  defaultVariants: {
    maxWidth: "default",
    verticalPadding: "none",
  },
});

export interface ContainerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

export function Container({ className, maxWidth, verticalPadding, ...props }: ContainerProps) {
  return <div className={cn(containerVariants({ maxWidth, verticalPadding }), className)} {...props} />;
}
