"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

import { logoutAction } from "@/app/actions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
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
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            pathname === item.href
              ? "bg-white/10 text-white"
              : "text-text-muted hover:bg-white/5 hover:text-white",
          )}
        >
          {item.label}
        </Link>
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121826]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-wide text-white">Rate-pulse</p>
            <p className="text-xs text-text-tertiary">Institutional-grade trading UI</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLinks items={navItems} pathname={pathname} />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {auth.isAuthenticated ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                <p className="text-sm font-medium text-white">{auth.session?.name}</p>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                  {auth.session?.role}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-medium text-text-primary transition hover:border-primary/60 hover:text-white"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-text-primary transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1b78ff]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#0f1522] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            <NavLinks items={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-2 flex items-center gap-3">
              <ThemeToggle />
              {auth.isAuthenticated ? (
                <form action={logoutAction} className="flex-1">
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl border border-white/10 px-4 text-sm font-medium text-text-primary"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-text-primary"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
