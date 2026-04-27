"use client";

import { LayoutDashboard, Settings, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { IconBox } from "@/components/ui/icon-box";
import { Panel } from "@/components/ui/panel";
import { SidebarNavLink } from "@/components/ui/nav-link";
import { Text } from "@/components/ui/typography";
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
    <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <Panel variant="inset" className="rounded-xl border border-border bg-panel p-5 text-text-primary">
        <div className="flex items-center gap-3">
          <IconBox variant="brand">
            <ShieldCheck className="h-5 w-5" />
          </IconBox>
          <div>
            <p className="font-semibold text-text-primary">{session.name}</p>
            <Text variant="muted" className="text-sm">
              {`${session.email.split("@")[0].slice(0, 2)}•••••@${session.email.split("@")[1].slice(0, 2)}•••••`}
            </Text>
          </div>
        </div>
        <Badge className="mt-4">{session.role}</Badge>
      </Panel>

      <nav className="mt-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <SidebarNavLink key={item.href} href={item.href} active={active}>
              <Icon className="h-4 w-4" />
              {item.label}
            </SidebarNavLink>
          );
        })}
      </nav>
    </aside>
  );
}
