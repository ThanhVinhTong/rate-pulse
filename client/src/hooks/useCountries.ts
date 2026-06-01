"use client";

import { useState, useMemo } from "react";

export interface CountryItem {
  code: string;
  name: string;
  displayName: string;
}

// Complete list of the 144 country codes supported by the system
const SUPPORTED_COUNTRIES = [
  "AE", "AF", "AL", "AM", "AO", "AR", "AU", "AZ", "BA", "BB", "BD", "BH", "BI", "BM", "BN", "BO", "BR", 
  "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CH", "CL", "CN", "CO", "CR", "CU", "CV", "CZ", "DJ", "DK", 
  "DO", "DZ", "EG", "ER", "ET", "EU", "FJ", "FK", "GB", "GE", "GH", "GI", "GM", "GN", "GT", "GY", "HK", 
  "HN", "HT", "HU", "ID", "IL", "IN", "IQ", "IR", "IS", "JM", "JO", "JP", "KE", "KG", "KH", "KM", "KP", 
  "KR", "KW", "KY", "KZ", "LA", "LB", "LK", "LR", "LS", "LY", "MA", "MD", "MG", "MK", "MM", "MN", "MO", 
  "MR", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NG", "NI", "NO", "NP", "NZ", "OM", "PA", "PE", "PG", 
  "PH", "PK", "PL", "PY", "QA", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SO", 
  "SR", "ST", "SV", "SY", "SZ", "TH", "TJ", "TM", "TN", "TO", "TR", "TT", "TW", "TZ", "UA", "UG", "US", 
  "UY", "UZ", "VN", "VU", "WS", "ZA", "ZM", "ZW"
];

export function useCountries(initialCountry?: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry || "");

  const allCountries = useMemo<CountryItem[]>(() => {
    let displayNames: Intl.DisplayNames | null = null;
    try {
      if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
        displayNames = new Intl.DisplayNames(["en"], { type: "region" });
      }
    } catch (e) {
      console.warn("Intl.DisplayNames for region is not supported or failed", e);
    }

    return SUPPORTED_COUNTRIES.map((code) => {
      let name = code;
      if (displayNames) {
        try {
          name = displayNames.of(code) || code;
        } catch (e) {
          // Fallback to code if resolution fails
        }
      }
      return {
        code,
        name,
        displayName: `${name} (${code})`,
      };
    });
  }, []);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return allCountries.slice(0, 8);
    }
    return allCountries
      .filter(
        (country) =>
          country.code.toLowerCase().includes(query) ||
          country.name.toLowerCase().includes(query) ||
          country.displayName.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allCountries, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredCountries,
    allCountries,
    selectedCountry,
    setSelectedCountry,
  };
}
