"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Filter, Search, Star } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSection,
} from "@/components/ui/dropdown-menu";
import { FavoritesToggle } from "@/components/ui/filter-chip";
import { FieldCaption } from "@/components/ui/label";
import { Input, inputVariants } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface CurrencyOption {
  code: string;
  name: string;
  symbol?: string;
}

interface ExchangeRateFiltersProps {
  baseCurrency: string;
  targetCurrency: string;
  currencies: CurrencyOption[];
  sourceOptions: string[];
  selectedSource: string;
  conversionUpdatedAt: string;
  favoritesOnly: boolean;
  userCurrencyPreferences?: {
    baseCurrencyCode?: string;
    targetCurrencyCode?: string;
  };
  preferredBaseCurrencies?: CurrencyOption[];
  preferredTargetCurrencies?: CurrencyOption[];
  onBaseCurrencyChange: (currency: string) => void;
  onTargetCurrencyChange: (currency: string) => void;
  onSourceChange: (source: string) => void;
  onFavoritesOnlyToggle: () => void;
}

interface CurrencyDropdownProps {
  label: string;
  value: string;
  options: Array<CurrencyOption & { isBasePreference?: boolean; isTargetPreference?: boolean }>;
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
        option.code.toLowerCase().includes(keyword) || option.name.toLowerCase().includes(keyword),
    );
  }, [options, searchText]);

  return (
    <div ref={containerRef} className="relative">
      <FieldCaption variant="upper">{label}</FieldCaption>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(inputVariants({ variant: "dropdownTrigger" }), "w-full")}
      >
        <span className="truncate text-left">
          {selected ? `${selected.code} - ${selected.name}` : value}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <DropdownMenu>
          <DropdownMenuSection>
            <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              variant="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="pl-10"
            />
          </DropdownMenuSection>

          <div className="max-h-64 overflow-auto p-2">
            {filteredOptions.map((option) => (
              <DropdownMenuItem
                key={option.code}
                active={option.code === value}
                onClick={() => {
                  onSelect(option.code);
                  setSearchText("");
                  setIsOpen(false);
                }}
              >
                <span className="flex-1">
                  {option.code} - {option.name}
                </span>
                {(option.isBasePreference || option.isTargetPreference) && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {option.isBasePreference ? "Base" : "Target"}
                  </span>
                )}
              </DropdownMenuItem>
            ))}

            {filteredOptions.length === 0 && (
              <Text variant="muted" className="px-2 py-3">
                No currencies found.
              </Text>
            )}
          </div>
        </DropdownMenu>
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
  userCurrencyPreferences,
  preferredBaseCurrencies,
  preferredTargetCurrencies,
  onBaseCurrencyChange,
  onTargetCurrencyChange,
  onSourceChange,
  onFavoritesOnlyToggle,
}: ExchangeRateFiltersProps) {
  const withSelectedCurrency = (options: CurrencyOption[], code: string): CurrencyOption[] => {
    if (options.some((item) => item.code === code)) {
      return options;
    }
    const selected = currencies.find((item) => item.code === code);
    return selected ? [...options, selected] : options;
  };

  const baseAvailableCurrencies = useMemo(() => {
    const baseOptions =
      preferredBaseCurrencies && preferredBaseCurrencies.length > 0
        ? preferredBaseCurrencies
        : currencies;
    return withSelectedCurrency(baseOptions, baseCurrency);
  }, [preferredBaseCurrencies, currencies, baseCurrency]);

  const targetAvailableCurrencies = useMemo(() => {
    const targetOptions =
      preferredTargetCurrencies && preferredTargetCurrencies.length > 0
        ? preferredTargetCurrencies
        : currencies;
    return withSelectedCurrency(targetOptions, targetCurrency);
  }, [preferredTargetCurrencies, currencies, targetCurrency]);

  const targetOptions = targetAvailableCurrencies.filter((currency) => currency.code !== baseCurrency);

  // Add preference indicators
  const currenciesWithPreferences = baseAvailableCurrencies.map((currency) => ({
    ...currency,
    isBasePreference: userCurrencyPreferences?.baseCurrencyCode === currency.code,
    isTargetPreference: userCurrencyPreferences?.targetCurrencyCode === currency.code,
  }));

  const targetOptionsWithPreferences = targetOptions.map((currency) => ({
    ...currency,
    isBasePreference: userCurrencyPreferences?.baseCurrencyCode === currency.code,
    isTargetPreference: userCurrencyPreferences?.targetCurrencyCode === currency.code,
  }));

  return (
    <Panel variant="sheet" padding="md" className="mb-6">
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <Heading level="h3">Filters</Heading>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <CurrencyDropdown
          label="Base Currency"
          value={baseCurrency}
          options={currenciesWithPreferences}
          onSelect={onBaseCurrencyChange}
        />

        <CurrencyDropdown
          label="Target Currency"
          value={targetCurrency}
          options={targetOptionsWithPreferences}
          onSelect={onTargetCurrencyChange}
        />

        <div>
          <FieldCaption variant="upper">Source</FieldCaption>
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(event) => onSourceChange(event.target.value)}
              className={inputVariants({ variant: "nativeSelect" })}
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
        <Text variant="muted">
          The conversion was updated at <span className="font-medium text-text-primary">{conversionUpdatedAt}</span>.
        </Text>
      </div>

      <div className="mb-4">
        <FavoritesToggle active={favoritesOnly} onClick={onFavoritesOnlyToggle}>
          <Star size={14} className={favoritesOnly ? "fill-primary" : ""} />
          Favorites Only
        </FavoritesToggle>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-white/10">
        <Text variant="muted">
          Active pair:{" "}
          <span className="font-semibold text-primary">
            {baseCurrency}/{targetCurrency}
          </span>
        </Text>
      </div>
    </Panel>
  );
}
