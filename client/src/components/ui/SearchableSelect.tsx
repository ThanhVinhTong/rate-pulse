"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  name: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  onChange?: (value: string) => void;
}

export function SearchableSelect({
  name,
  options,
  defaultValue = "",
  searchQuery,
  setSearchQuery,
  placeholder = "-- None --",
  searchPlaceholder = "Search...",
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setSelected(defaultValue);
  }, [defaultValue]);

  const handleSelect = (val: string) => {
    setSelected(val);
    setIsOpen(false);
    if (onChange) {
      onChange(val);
    }
  };

  // Find dynamic display label
  const selectedOption = options.find((opt) => opt.value === selected);
  
  // If the selected option is not yet resolved in the limited filtered list,
  // resolve its label dynamically if possible (e.g., using Intl or raw value as fallback)
  const displayLabel = selected
    ? (selectedOption?.label || (() => {
        // Special timezone, language or region resolution fallback
        if (name === "timezone") return selected;
        
        let type: "language" | "region" = name === "language" ? "language" : "region";
        let displayNames: Intl.DisplayNames | null = null;
        try {
          if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
            displayNames = new Intl.DisplayNames(["en"], { type });
          }
        } catch (e) {}
        
        let resolvedName = selected;
        if (displayNames) {
          try {
            resolvedName = displayNames.of(selected) || selected;
          } catch (e) {}
        }
        return `${resolvedName} (${selected})`;
      })())
    : placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={selected} />

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
        className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm transition hover:border-primary/60"
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className={`h-4 w-4 fill-text-tertiary transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-md border border-border bg-card p-2 shadow-lg transition-all duration-300">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("")}
              className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-panel"
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div
                key={opt.value}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(opt.value)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-panel ${
                  selected === opt.value ? "bg-panel font-semibold text-primary" : "text-text-primary"
                }`}
              >
                {opt.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted text-center">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
