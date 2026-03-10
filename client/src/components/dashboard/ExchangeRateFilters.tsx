"use client";

import { Filter, Search, Star, ChevronDown } from "lucide-react";
import { useState } from "react";

const regions = [
  {
    name: "AMERICAS",
    currencies: [{ code: "USD", label: "US" }],
  },
  {
    name: "ASIA",
    currencies: [
      { code: "JPY", label: "JP" },
      { code: "SGD", label: "SG" },
      { code: "THB", label: "TH" },
    ],
  },
  {
    name: "EUROPE",
    currencies: [
      { code: "EUR", label: "EU" },
      { code: "GBP", label: "GB" },
    ],
  },
  {
    name: "OCEANIA",
    currencies: [{ code: "AUD", label: "AU" }],
  },
];

export function ExchangeRateFilters() {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-white">Filters</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Base Currency</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-xl border border-white/10 bg-[#0c1220] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary">
              <option>VN ₫ VND</option>
              <option>US $ USD</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Search Currency</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full rounded-xl border border-white/10 bg-[#0c1220] pl-10 pr-4 py-2.5 text-sm text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Source</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-xl border border-white/10 bg-[#0c1220] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary">
              <option>All Sources</option>
              <option>Vietcombank</option>
              <option>ACB</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Time</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-xl border border-white/10 bg-[#0c1220] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary">
              <option>Latest</option>
              <option>Historical</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            favoritesOnly 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-white/10 bg-transparent text-text-primary hover:bg-white/5"
          }`}
        >
          <Star className={`h-4 w-4 ${favoritesOnly ? "fill-primary" : ""}`} />
          Favorites Only
        </button>
      </div>

      <div className="border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Select Target Currency To Display</p>
        
        <div className="space-y-4">
          {regions.map((region) => (
            <div key={region.name} className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
              <p className="w-24 text-xs font-semibold uppercase text-primary mt-2">{region.name}</p>
              <div className="flex flex-wrap gap-2">
                {region.currencies.map((currency) => {
                  const isActive = selectedCurrency === currency.code;
                  return (
                    <button
                      key={currency.code}
                      onClick={() => setSelectedCurrency(currency.code)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        isActive 
                          ? "border-primary bg-primary text-white shadow-sm" 
                          : "border-white/10 bg-white/5 text-text-primary hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-xs opacity-70">{currency.label}</span>
                      {currency.code}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-text-muted">
          Selected: <span className="font-semibold text-primary">{selectedCurrency}</span> currency pair
        </p>
      </div>
    </div>
  );
}
