import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Heading, Text } from "./typography";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, className, action }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <Heading level="section">{title}</Heading>
        {description ? (
          <Text variant="muted" className="mt-1">
            {description}
          </Text>
        ) : null}
      </div>
      {action}
    </div>
  );
}

interface PageHeaderSimpleProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeaderSimple({ title, description, className }: PageHeaderSimpleProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <Heading level="section">{title}</Heading>
      {description ? (
        <Text variant="muted" className="lg:text-base">
          {description}
        </Text>
      ) : null}
    </header>
  );
}
