"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Filter, Search, Star } from "lucide-react";

interface CurrencyOption {
  code: string;
  name: string;
  continent: string;
}

interface ExchangeRateFiltersProps {
  baseCurrency: string;
  targetCurrency: string;
  currencies: CurrencyOption[];
  sourceOptions: string[];
  selectedSource: string;
  conversionUpdatedAt: string;
  favoritesOnly: boolean;
  onBaseCurrencyChange: (currency: string) => void;
  onTargetCurrencyChange: (currency: string) => void;
  onSourceChange: (source: string) => void;
  onFavoritesOnlyToggle: () => void;
}

interface CurrencyDropdownProps {
  label: string;
  value: string;
  options: CurrencyOption[];
  onSelect: (code: string) => void;
}

function CurrencyDropdown({ label, value, options, onSelect }: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.code === value);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter(
      (option) =>
        option.code.toLowerCase().includes(keyword)
        || option.name.toLowerCase().includes(keyword)
        || option.continent.toLowerCase().includes(keyword),
    );
  }, [options, searchText]);

  const groupedOptions = useMemo(() => {
    return filteredOptions.reduce<Record<string, CurrencyOption[]>>((groups, option) => {
      if (!groups[option.continent]) {
        groups[option.continent] = [];
      }
      groups[option.continent].push(option);
      return groups;
    }, {});
  }, [filteredOptions]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1220] px-4 py-2.5 text-sm text-white outline-none transition hover:border-primary/60 focus:border-primary"
      >
        <span className="truncate text-left">{selected ? `${selected.code} - ${selected.name}` : value}</span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] shadow-xl">
          <div className="relative p-3 border-b border-white/10">
            <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-64 overflow-auto p-2">
            {Object.entries(groupedOptions).map(([continent, continentOptions]) => (
              <div key={continent} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-[12px] font-bold uppercase tracking-wider text-primary/90">{continent}</p>
                {continentOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      onSelect(option.code);
                      setSearchText("");
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                      option.code === value
                        ? "bg-primary text-white"
                        : "text-text-primary hover:bg-white/10"
                    }`}
                  >
                    {option.code} - {option.name}
                  </button>
                ))}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <p className="px-2 py-3 text-sm text-text-muted">No currencies found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExchangeRateFilters({
  baseCurrency,
  targetCurrency,
  currencies,
  sourceOptions,
  selectedSource,
  conversionUpdatedAt,
  favoritesOnly,
  onBaseCurrencyChange,
  onTargetCurrencyChange,
  onSourceChange,
  onFavoritesOnlyToggle,
}: ExchangeRateFiltersProps) {
  const targetOptions = currencies.filter((currency) => currency.code !== baseCurrency);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-white">Filters</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <CurrencyDropdown
          label="Base Currency"
          value={baseCurrency}
          options={currencies}
          onSelect={onBaseCurrencyChange}
        />

        <CurrencyDropdown
          label="Target Currency"
          value={targetCurrency}
          options={targetOptions}
          onSelect={onTargetCurrencyChange}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Source</label>
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(event) => onSourceChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-[#0c1220] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
        </div>

      </div>

      <div className="mb-4">
        <p className="text-sm text-text-muted">
          The conversion was updated at <span className="text-white font-medium">{conversionUpdatedAt}</span>.
        </p>
      </div>

      <div className="mb-4">
        <button
          onClick={onFavoritesOnlyToggle}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
            favoritesOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/10 bg-transparent text-text-primary hover:bg-white/5"
          }`}
        >
          <Star size={14} className={favoritesOnly ? "fill-primary" : ""} />
          Favorites Only
        </button>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-sm text-text-muted">
          Active pair:{" "}
          <span className="font-semibold text-primary">
            {baseCurrency}/{targetCurrency}
          </span>
        </p>
      </div>
    </div>
  );
}
