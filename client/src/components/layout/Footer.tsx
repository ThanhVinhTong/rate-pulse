import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { IconBox } from "@/components/ui/icon-box";
import { panelVariants } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const footerSections = [
  {
    title: "Workspace",
    links: [
      { href: "/exchange-rates", label: "Exchange rates" },
      { href: "/converter", label: "Converter" },
      { href: "/historical", label: "Historical" },
      { href: "/news", label: "News" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
      { href: "/profile", label: "Profile" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={cn(panelVariants({ variant: "footer" }))}>
      <Container className="max-w-7xl py-8 sm:py-10">
        <div className="grid gap-8 border-b border-border pb-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <IconBox variant="brand">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </IconBox>
              <div>
                <p className="text-base font-semibold text-text-primary">Rate-pulse</p>
                <Text variant="caption">Exchange-rate comparison</Text>
              </div>
            </Link>
            <Text variant="footer" className="mt-4 max-w-sm leading-6">
              Compare exchange-rate sources, review historical movement, and keep macro headlines beside the data.
            </Text>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <p className="text-sm font-semibold text-text-primary">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-primary"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="footer">&copy; {year} Rate-pulse. Informational data workspace.</Text>
          <Text variant="footer">No execution, advice, or guaranteed market pricing.</Text>
        </div>
      </Container>
    </footer>
  );
}
