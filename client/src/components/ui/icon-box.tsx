import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const iconBoxVariants = cva("flex items-center justify-center rounded-xl", {
  variants: {
    variant: {
      brand: "h-11 w-11 bg-primary/15 text-primary",
      brandSm: "mt-1 p-2 rounded-lg bg-primary/10 text-primary",
      setting: "h-12 w-12 bg-primary/10 text-primary",
    },
    shape: {
      square: "",
      circle: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "brand",
    shape: "square",
  },
});

export interface IconBoxProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof iconBoxVariants> {}

export function IconBox({ className, variant, shape, ...props }: IconBoxProps) {
  return <div className={cn(iconBoxVariants({ variant, shape }), className)} {...props} />;
}
