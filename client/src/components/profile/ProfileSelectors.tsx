"use client";

import { useTimezones } from "@/hooks/useTimezones";
import { useLanguages } from "@/hooks/useLanguages";
import { useCountries } from "@/hooks/useCountries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useCurrencies } from "@/hooks/useCurrencies";
import type { Currency } from "@/types/exchange-rates";

export interface ProfileSelectProps {
  name: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export interface CurrencySelectProps extends ProfileSelectProps {
  currencies: Currency[];
}

export function TimezoneSelect({ name, defaultValue = "", onChange }: ProfileSelectProps) {
  const { searchQuery, setSearchQuery, filteredTimezones } = useTimezones(defaultValue);
  
  const options = filteredTimezones.map((tz) => ({
    value: tz,
    label: tz,
  }));

  return (
    <SearchableSelect
      name={name}
      defaultValue={defaultValue}
      options={options}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="-- None --"
      searchPlaceholder="Search time zones..."
      onChange={onChange}
    />
  );
}

export function LanguageSelect({ name, defaultValue = "", onChange }: ProfileSelectProps) {
  const { searchQuery, setSearchQuery, filteredLanguages } = useLanguages(defaultValue);
  
  const options = filteredLanguages.map((lang) => ({
    value: lang.code,
    label: lang.displayName,
  }));

  return (
    <SearchableSelect
      name={name}
      defaultValue={defaultValue}
      options={options}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="-- None --"
      searchPlaceholder="Search languages..."
      onChange={onChange}
    />
  );
}

export function CountrySelect({ name, defaultValue = "", onChange }: ProfileSelectProps) {
  const { searchQuery, setSearchQuery, filteredCountries } = useCountries(defaultValue);
  
  const options = filteredCountries.map((country) => ({
    value: country.code,
    label: country.displayName,
  }));

  return (
    <SearchableSelect
      name={name}
      defaultValue={defaultValue}
      options={options}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="-- None --"
      searchPlaceholder="Search countries..."
      onChange={onChange}
    />
  );
}

export function CurrencySelect({ name, defaultValue = "", onChange, currencies }: CurrencySelectProps) {
  const { searchQuery, setSearchQuery, filteredCurrencies } = useCurrencies(currencies, defaultValue);

  const options = filteredCurrencies.map((c) => ({
    value: c.CurrencyCode,
    label: `${c.CurrencyCode} - ${c.CurrencyName}`,
  }));

  return (
    <SearchableSelect
      name={name}
      defaultValue={defaultValue}
      options={options}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="-- None --"
      searchPlaceholder="Search currencies..."
      onChange={onChange}
    />
  );
}
