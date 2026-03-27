import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const dropdownMenuVariants = cva(
  "absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0c1220]",
);

export const dropdownMenuSectionVariants = cva(
  "relative border-b border-slate-200 p-3 dark:border-white/10",
);

export const dropdownMenuItemVariants = cva("w-full rounded-lg px-2 py-2 text-left text-sm transition", {
  variants: {
    active: {
      true: "bg-primary text-white",
      false: "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
    },
  },
  defaultVariants: {
    active: false,
  },
});

interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {}

export function DropdownMenu({ className, ...props }: DropdownMenuProps) {
  return <div className={cn(dropdownMenuVariants(), className)} {...props} />;
}

export function DropdownMenuSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(dropdownMenuSectionVariants(), className)} {...props} />;
}

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function DropdownMenuItem({ className, active, type = "button", ...props }: DropdownMenuItemProps) {
  return (
    <button type={type} className={cn(dropdownMenuItemVariants({ active: active ?? false }), className)} {...props} />
  );
}
