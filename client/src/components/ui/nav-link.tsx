"use client";

import { cva } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const topNavLinkVariants = cva("rounded-lg px-3 py-2 text-sm font-medium transition", {
  variants: {
    active: {
      true: "bg-primary/12 text-primary dark:bg-white/10 dark:text-white",
      false:
        "text-text-muted hover:bg-black/[0.04] hover:text-text-primary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white",
    },
  },
  defaultVariants: {
    active: false,
  },
});

export const sidebarNavLinkVariants = cva(
  "flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
  {
    variants: {
      active: {
        true: "bg-primary text-white",
        false: "text-text-muted hover:bg-white/5 hover:text-white",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

type NextLinkProps = ComponentProps<typeof Link>;

export interface NavLinkProps extends NextLinkProps {
  active?: boolean;
}

export function NavLink({ className, active, ...props }: NavLinkProps) {
  return (
    <Link className={cn(topNavLinkVariants({ active: active ?? false }), className)} {...props} />
  );
}

export interface SidebarNavLinkProps extends NextLinkProps {
  active?: boolean;
}

export function SidebarNavLink({ className, active, ...props }: SidebarNavLinkProps) {
  return (
    <Link
      className={cn(sidebarNavLinkVariants({ active: active ?? false }), className)}
      {...props}
    />
  );
}
