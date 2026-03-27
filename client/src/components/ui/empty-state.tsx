import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { Heading, Text } from "./typography";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
}

export function EmptyState({ title, description, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-panel px-6 py-10 text-center", className)}
      {...props}
    >
      <Heading level="mutedTitle">{title}</Heading>
      <Text variant="muted" className="mt-2">
        {description}
      </Text>
    </div>
  );
}
