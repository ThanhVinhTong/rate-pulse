"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { IconBox } from "@/components/ui/icon-box";
import { NavLink } from "@/components/ui/nav-link";
import { Panel } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { TextLink } from "@/components/ui/text-link";
import { useAuth } from "@/hooks/useAuth";
import type { AuthSession } from "@/types";

import { ThemeToggle } from "./ThemeToggle";

const publicItems = [
  { href: "/", label: "Home" },
  { href: "/exchange-rates", label: "Exchange Rates" },
  { href: "/analytics", label: "Analytics" },
] as const;

interface NavbarProps {
  session: AuthSession | null;
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: Array<{ href: string; label: string }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink key={item.href} href={item.href} onClick={onNavigate} active={pathname === item.href}>
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth(session);

  const navItems = useMemo(() => {
    if (!auth.isAuthenticated) {
      return [...publicItems];
    }

    const items = [...publicItems, { href: "/profile", label: "Profile" }];

    if (auth.isAdmin) {
      items.push({ href: "/admin", label: "Admin" });
    }

    return items;
  }, [auth.isAdmin, auth.isAuthenticated]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 text-text-primary shadow-sm backdrop-blur dark:bg-[#121826]/95 dark:text-text-primary dark:shadow-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <IconBox variant="brand">
            <ShieldCheck className="h-5 w-5" />
          </IconBox>
          <div>
            <p className="text-lg font-semibold tracking-wide text-text-primary">Rate-pulse</p>
            <Text variant="caption" className="text-text-tertiary">
              Institutional-grade trading UI
            </Text>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLinks items={navItems} pathname={pathname} />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {auth.isAuthenticated ? (
            <>
              <Panel variant="session">
                <p className="text-sm font-medium text-text-primary">{auth.session?.name}</p>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">{auth.session?.role}</p>
              </Panel>
              <form action={logoutAction}>
                <Button type="submit" variant="outline">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <TextLink href="/login" variant="nav">
                Log in
              </TextLink>
              <TextLink href="/signup" variant="navCta">
                Sign up
              </TextLink>
            </>
          )}
        </div>

        <Button
          type="button"
          aria-label="Open navigation"
          variant="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <Panel variant="mobileNav">
          <div className="flex flex-col gap-2">
            <NavLinks items={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-2 flex items-center gap-3">
              <ThemeToggle />
              {auth.isAuthenticated ? (
                <form action={logoutAction} className="flex-1">
                  <Button type="submit" variant="outlineMobile">
                    Log out
                  </Button>
                </form>
              ) : (
                <>
                  <TextLink
                    href="/login"
                    variant="navOutline"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1"
                  >
                    Log in
                  </TextLink>
                  <TextLink
                    href="/signup"
                    variant="navCta"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center"
                  >
                    Sign up
                  </TextLink>
                </>
              )}
            </div>
          </div>
        </Panel>
      ) : null}
    </header>
  );
}
