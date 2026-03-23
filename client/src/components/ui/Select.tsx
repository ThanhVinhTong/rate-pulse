"use client";

import {
  type SelectHTMLAttributes,
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, name, defaultValue, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Extract options from standard <option> children to map them to the custom UI
    const options = Children.toArray(children)
      .filter(isValidElement)
      .map((child: any) => ({
        value: child.props.value ?? child.props.children,
        label: child.props.children,
      }));

    const [selectedValue, setSelectedValue] = useState(defaultValue ?? value ?? options[0]?.value ?? "");

    const selectedLabel = options.find((opt) => String(opt.value) === String(selectedValue))?.label || selectedValue;

    const filteredOptions = useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return options;
      }

      return options.filter((option) => {
        const rawLabel = option.label;
        const labelText =
          typeof rawLabel === "string" || typeof rawLabel === "number"
            ? String(rawLabel)
            : String(option.value);

        return labelText.toLowerCase().includes(normalizedQuery);
      });
    }, [options, query]);

    // Handle closing the dropdown when clicking outside
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
      if (!isOpen) {
        setQuery("");
      }
    }, [isOpen]);

    const handleSelect = (val: string) => {
      setSelectedValue(val);
      setIsOpen(false);
      
      if (onChange) {
        // Mock a standard React change event for controlled usage
        const event = {
          target: { value: val, name },
          currentTarget: { value: val, name }
        } as any;
        onChange(event);
      }
    };

    return (
      <div 
        ref={containerRef}
        className={`relative w-full ${className || ""}`}
      >
        {/* Hidden standard select so that standard form submissions (like Next.js Actions) work perfectly */}
        <select
          ref={ref}
          name={name}
          value={selectedValue}
          onChange={(e) => handleSelect(e.target.value)}
          className="hidden"
          {...props}
        >
          {children}
        </select>

        {/* Selected Display Box */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-all duration-300 hover:border-gray-300 dark:border-white/10 dark:bg-[#0c1220] dark:text-white dark:hover:border-white/20"
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 512 512"
            className={`h-4 w-4 fill-gray-400 transition-transform duration-300 dark:fill-white/50 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
          </svg>
        </div>

        {/* Custom Dropdown Menu */}
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-50 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg transition-all duration-300 dark:border-white/10 dark:bg-[#131b2f] ${
            isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          }`}
        >
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
                onClick={() => handleSelect(String(option.value))}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  String(selectedValue) === String(option.value)
                    ? "hidden" /* Hide the current selected option like the design */
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
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
  }
);

Select.displayName = "Select";
