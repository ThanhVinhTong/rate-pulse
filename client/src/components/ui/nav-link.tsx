"use client";

import { cva } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const topNavLinkVariants = cva("rounded-md px-3 py-2 text-sm font-medium transition", {
  variants: {
    active: {
      true: "bg-white/10 text-white",
      false:
        "text-slate-300 hover:bg-white/10 hover:text-white",
    },
  },
  defaultVariants: {
    active: false,
  },
});

export const sidebarNavLinkVariants = cva(
  "flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
  {
    variants: {
      active: {
        true: "bg-primary text-white",
        false: "text-text-muted hover:bg-panel hover:text-text-primary",
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
