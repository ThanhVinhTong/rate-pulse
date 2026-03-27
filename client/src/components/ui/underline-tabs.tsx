import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnderlineTabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface UnderlineTabsProps<T extends string> {
  items: ReadonlyArray<UnderlineTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div className={cn("overflow-x-auto border-b border-border", className)}>
      <div className="flex min-w-max items-center" role="tablist" aria-label="Sections">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = value === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${item.id}-panel`}
              id={`${item.id}-tab`}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-medium transition-all",
                isActive ? "text-primary" : "text-text-muted hover:text-text-primary",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary transition-all",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
