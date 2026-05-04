import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const themeToggleButtonVariants = cva(
  [
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
    "border border-white/15 bg-transparent text-slate-300",
    "hover:bg-white/10 hover:text-white",
    "active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1424]",
  ].join(" "),
);

export interface ThemeToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function ThemeToggleButton({ className, ...props }: ThemeToggleButtonProps) {
  return <button type="button" className={cn(themeToggleButtonVariants(), className)} {...props} />;
}
