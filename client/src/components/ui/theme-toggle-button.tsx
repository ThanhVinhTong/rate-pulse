import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const themeToggleButtonVariants = cva(
  [
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
    "border-2 border-[#00d3e5]/50 bg-[#070d18]/95 text-[#00d3e5]",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_4px_14px_rgba(0,0,0,0.35)]",
    "hover:border-[#00d3e5] hover:bg-[#0069fe]/25 hover:text-white",
    "active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d3e5]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121826]",
  ].join(" "),
);

export interface ThemeToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function ThemeToggleButton({ className, ...props }: ThemeToggleButtonProps) {
  return <button type="button" className={cn(themeToggleButtonVariants(), className)} {...props} />;
}
