"use client";

import { cva } from "class-variance-authority";
import {
  type SelectHTMLAttributes,
  forwardRef,
  useState,
  useRef,
  useEffect,
  Children,
  isValidElement,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

const selectTriggerVariants = cva(
  "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm transition hover:border-primary/60",
);

const selectChevronVariants = cva(
  "h-4 w-4 fill-text-tertiary transition-transform duration-300",
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
  "absolute left-0 top-[calc(100%+8px)] z-50 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-lg transition-all duration-300",
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
  "cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary transition-colors hover:bg-panel",
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, name, defaultValue, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const options = Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        const el = child as ReactElement<{ value?: string; children?: React.ReactNode }>;
        return {
          value: el.props.value ?? el.props.children,
          label: el.props.children,
        };
      });

    const [selectedValue, setSelectedValue] = useState(defaultValue ?? value ?? options[0]?.value ?? "");

    const selectedLabel = options.find((opt) => String(opt.value) === String(selectedValue))?.label || selectedValue;

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleSelect = (val: string) => {
      setSelectedValue(val);
      setIsOpen(false);

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
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
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

        <div className={selectDropdownVariants({ open: isOpen })}>
          {options.map((option) => (
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
                String(selectedValue) === String(option.value) && "hidden",
              )}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
