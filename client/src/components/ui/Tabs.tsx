import { cn } from "@/lib/utils";

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
    <div className={cn("inline-flex rounded-xl border border-white/10 bg-white/5 p-1", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "min-h-11 rounded-lg px-4 text-sm font-medium transition",
            item.id === value ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-white",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
