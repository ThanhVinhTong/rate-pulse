"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ShieldCheck, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthSession } from "@/types";

const baseItems = [
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;

interface SidebarProps {
  session: AuthSession;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const items =
    session.role === "admin"
      ? [
          ...baseItems,
          {
            href: "/admin",
            label: "Admin",
            icon: LayoutDashboard,
          },
        ]
      : baseItems;

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="rounded-2xl border border-white/10 bg-[#0c1220] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">{session.name}</p>
            <p className="text-sm text-text-muted">
              {`${session.email.split("@")[0].slice(0, 2)}•••••@${session.email.split("@")[1].slice(0, 2)}•••••`}
            </p>
          </div>
        </div>
        <p className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          {session.role}
        </p>
      </div>

      <nav className="mt-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                active ? "bg-primary text-white" : "text-text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
