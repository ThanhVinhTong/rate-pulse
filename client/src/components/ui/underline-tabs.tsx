import { ChevronDown } from "lucide-react";
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
  const activeItem = items.find((item) => item.id === value);
  const ActiveIcon = activeItem?.icon;

  // True when the current value belongs to this tab group
  const isActiveGroup = !!activeItem;

  return (
    <>
      {/* Mobile: styled dropdown */}
      <div className="relative mx-2 mb-1 sm:hidden">
        {/* Active badge */}
        {isActiveGroup && (
          <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
            Active
          </span>
        )}
        {ActiveIcon && (
          <ActiveIcon
            size={16}
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
              isActiveGroup ? "text-primary" : "text-text-muted",
            )}
            aria-hidden="true"
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            "w-full appearance-none rounded-lg border py-2.5 pl-9 pr-9 text-sm font-medium transition-colors focus:outline-none focus:ring-1",
            isActiveGroup
              ? "border-primary bg-primary/5 text-text-primary ring-primary focus:border-primary"
              : "border-border bg-surface text-text-muted focus:border-primary focus:ring-primary",
          )}
          aria-label="Select category"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
      </div>

      {/* Tablet/Desktop: underline tab bar */}
      <div className={cn("hidden overflow-x-auto border-b border-border sm:block", className)}>
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
    </>
  );
}
