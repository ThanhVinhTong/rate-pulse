import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const filterChipVariants = cva(
  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
  {
    variants: {
      active: {
        true: "bg-primary text-white",
        false:
          "border border-border bg-transparent text-text-primary hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface FilterChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterChipVariants> {}

export function FilterChip({ className, active, type = "button", ...props }: FilterChipProps) {
  return (
    <button type={type} className={cn(filterChipVariants({ active: active ?? false }), className)} {...props} />
  );
}

export const favoritesToggleVariants = cva(
  "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
  {
    variants: {
      active: {
        true: "border-primary bg-primary/10 text-primary",
        false:
          "border-slate-200 bg-transparent text-text-primary hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface FavoritesToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof favoritesToggleVariants> {}

export function FavoritesToggle({ className, active, type = "button", ...props }: FavoritesToggleProps) {
  return (
    <button
      type={type}
      className={cn(favoritesToggleVariants({ active: active ?? false }), className)}
      {...props}
    />
  );
}
