import { Container } from "@/components/ui/container";
import { panelVariants } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className={cn(panelVariants({ variant: "footer" }))}>
      <Container className="flex max-w-7xl flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="footer">
          Rate-pulse workspace for exchange rates, analytics, and protected account flows.
        </Text>
        <Text variant="footer">Built with Next.js App Router and reusable feature modules.</Text>
      </Container>
    </footer>
  );
}
