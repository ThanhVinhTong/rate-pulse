"use client";

import { cva } from "class-variance-authority";
import { Search } from "lucide-react";
import {
  type SelectHTMLAttributes,
  forwardRef,
  useState,
  useRef,
  useEffect,
  Children,
  isValidElement,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const selectTriggerVariants = cva(
  "flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-all duration-300 hover:border-gray-300 dark:border-white/10 dark:bg-[#0c1220] dark:text-white dark:hover:border-white/20",
);

const selectChevronVariants = cva(
  "h-4 w-4 fill-gray-400 transition-transform duration-300 dark:fill-white/50",
  {
    variants: {
      open: {
        true: "rotate-180",
        false: "rotate-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

const selectDropdownVariants = cva(
  "absolute left-0 top-[calc(100%+8px)] z-50 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg transition-all duration-300 dark:border-white/10 dark:bg-[#131b2f] select-dropdown-scrollbar",
  {
    variants: {
      open: {
        true: "visible translate-y-0 opacity-100",
        false: "invisible -translate-y-2 opacity-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

const selectOptionVariants = cva(
  "cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => extractNodeText(item)).join(" ").trim();
  }

  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return extractNodeText(props.children);
  }

  return "";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, name, defaultValue, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
      setIsOpen((currentOpen) => {
        const nextOpen = !currentOpen;
        if (!nextOpen) {
          setQuery("");
        }
        return nextOpen;
      });
    };

    const options = Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        const el = child as ReactElement<{ value?: string; children?: React.ReactNode }>;
        const resolvedValue = el.props.value ?? el.props.children;
        const labelText = extractNodeText(el.props.children);
        const valueText = extractNodeText(resolvedValue);
        return {
          value: resolvedValue,
          label: el.props.children,
          searchText: `${labelText} ${valueText}`.trim(),
        };
      });

    const [selectedValue, setSelectedValue] = useState(defaultValue ?? value ?? options[0]?.value ?? "");

    const selectedLabel = options.find((opt) => String(opt.value) === String(selectedValue))?.label || selectedValue;

    const filteredOptions = useMemo(() => {
      const regexQuery = query.trim();
      if (!regexQuery) {
        return options;
      }

      const normalizedQuery = normalizeSearchText(regexQuery);

      const matcher = (() => {
        try {
          return new RegExp(regexQuery, "i");
        } catch {
          const escaped = regexQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(escaped, "i");
        }
      })();

      return options.filter((option) => {
        const searchText = option.searchText || String(option.value ?? "");
        const normalizedSearchText = normalizeSearchText(searchText);

        return matcher.test(searchText) || normalizedSearchText.includes(normalizedQuery);
      });
    }, [options, query]);

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setQuery("");
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleSelect = (val: string) => {
      setSelectedValue(val);
      setIsOpen(false);
      setQuery("");

      if (onChange) {
        const event = {
          target: { value: val, name },
          currentTarget: { value: val, name },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
    };

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <select
          ref={ref}
          name={name}
          value={String(selectedValue)}
          onChange={(e) => handleSelect(e.target.value)}
          className="hidden"
          {...props}
        >
          {children}
        </select>

        <div
          role="button"
          tabIndex={0}
          onClick={toggleDropdown}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleDropdown();
            }
          }}
          className={selectTriggerVariants()}
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 512 512"
            className={selectChevronVariants({ open: isOpen })}
          >
            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
          </svg>
        </div>

        {/* Custom Dropdown Menu */}
        <div className={selectDropdownVariants({ open: isOpen })} aria-hidden={!isOpen}>
          <div className="px-1 pb-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Lookup..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white"
              />
            </div>
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={String(option.value)}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(String(option.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(String(option.value));
                  }
                }}
                className={cn(
                  selectOptionVariants(),
                  !query.trim() && String(selectedValue) === String(option.value) && "hidden",
                )}
              >
                {option.label}
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No matching option</p>
          )}
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
