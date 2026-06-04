"use client";

import { useState, useMemo } from "react";
import type { Currency } from "@/types/exchange-rates";

// Define the 8 most commonly used/popular currencies as default view
const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];

export function useCurrencies(currencies: Currency[], initialCurrency?: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency || "");

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      // 1. Filter out currencies from API that match the popular codes list
      const popularList = currencies.filter((c) =>
        POPULAR_CURRENCIES.includes(c.CurrencyCode)
      );

      // 2. Ensure the currently selected currency is shown in the list
      const hasSelected = popularList.some(
        (c) => c.CurrencyCode === selectedCurrency
      );

      if (!hasSelected && selectedCurrency) {
        const selected = currencies.find(
          (c) => c.CurrencyCode === selectedCurrency
        );
        if (selected) {
          // Prepend selected currency so the user can see it's active
          return [selected, ...popularList].slice(0, 8);
        }
      }

      // 3. Fallback: if popular list is empty (e.g. API returns unexpected data), return first 8
      if (popularList.length === 0) {
        return currencies.slice(0, 8);
      }

      return popularList.slice(0, 8);
    }

    // If user is searching, return matching currencies limited to 8 to avoid rendering too many DOM nodes
    return currencies
      .filter(
        (c) =>
          c.CurrencyCode.toLowerCase().includes(query) ||
          c.CurrencyName.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [currencies, searchQuery, selectedCurrency]);

  return {
    searchQuery,
    setSearchQuery,
    filteredCurrencies,
    selectedCurrency,
    setSelectedCurrency,
  };
}
