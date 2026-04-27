import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const tabsListVariants = cva("inline-flex rounded-xl border border-border bg-surface-elevated p-1", {
  variants: {},
});

export const tabsTriggerVariants = cva(
  "min-h-11 rounded-lg px-4 text-sm font-medium transition",
  {
    variants: {
      active: {
        true: "bg-primary text-text-primary shadow-sm",
        false: "text-text-muted hover:text-text-primary",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

interface TabsProps<T extends string> {
  items: ReadonlyArray<{
    id: T;
    label: string;
  }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={cn(tabsListVariants(), className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(tabsTriggerVariants({ active: item.id === value }))}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
