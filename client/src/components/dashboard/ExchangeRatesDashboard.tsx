"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Star } from "lucide-react";

import { useRealtimeRates } from "@/hooks/useRealtimeRates";
import type { CurrencyPair, TimeRange } from "@/types";
import { bankRates } from "@/lib/mock-data";

import { ExchangeRateFilters } from "./ExchangeRateFilters";
import { CurrencyConverter } from "./CurrencyConverter";
import { ExchangeRateChart } from "./ExchangeRateChart";

interface ExchangeRatesDashboardProps {
  initialPairs: CurrencyPair[];
  range: TimeRange;
}

export function ExchangeRatesDashboard({
  initialPairs,
  range,
}: ExchangeRatesDashboardProps) {
  // Use state to manage filters to match example behavior
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState("VND");
  const [selectedTargetCurrency, setSelectedTargetCurrency] = useState("USD");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [selectedFetchTime, setSelectedFetchTime] = useState("latest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // We are going to use the detailed bankRates mock data for the tables
  // instead of the simple pairs, to match the example design
  const rates = bankRates;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-white">Exchange Rates</h1>
          <p className="text-sm text-text-muted mt-1">Real-time currency exchange rates from multiple sources</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium">
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh Rates</span>
          <span className="sm:hidden">Refresh</span>
        </button>
      </div>

      <ExchangeRateFilters />

      <CurrencyConverter baseCurrency={selectedBaseCurrency} targetCurrency={selectedTargetCurrency} />

      {/* Exchange Rates Header */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-1">
              ₫ {selectedBaseCurrency} Exchange Rates
            </h2>
            <p className="text-xs md:text-sm text-text-muted">
              Showing {rates.length} rates
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Last Updated</p>
            <p className="text-xs md:text-sm font-semibold text-white">
              Latest
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Exchange Rates Tables */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-panel">
        <div className="bg-[#0c1220] px-4 md:px-6 py-4 border-b border-white/10">
          <h3 className="text-base md:text-lg font-semibold text-primary">
            ₫ {selectedBaseCurrency} → $ {selectedTargetCurrency}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {rates.length} sources available
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0c1220]/50 text-text-tertiary">
              <tr>
                <th className="px-5 py-4 font-medium"><Star size={14} /></th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Source</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Cash Buy</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Wire Buy</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Cash Sell</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Wire Sell</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Change</th>
                <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Country</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, idx) => (
                <tr key={rate.id} className="border-t border-white/10 text-text-primary hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <button className={idx === 0 ? "text-warning" : "text-text-muted hover:text-warning"}>
                      <Star size={16} fill={idx === 0 ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-5 py-4 font-medium text-white">{rate.source}</td>
                  <td className="px-5 py-4 font-semibold text-white">{rate.cashBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 font-semibold text-white">{rate.wireBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 font-semibold text-white">{rate.cashSell.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 font-semibold text-white">{rate.wireSell.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4">
                    <div className={`flex items-center gap-1 font-semibold ${rate.change >= 0 ? "text-status-success" : "text-status-danger"}`}>
                      {rate.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {rate.change >= 0 ? "+" : ""}{rate.change}%
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-muted">{rate.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-white/10">
          {rates.map((rate, idx) => (
            <div key={rate.id} className="p-4 bg-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-white/10">
                    <span className="font-semibold text-primary">{selectedTargetCurrency}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{rate.source}</div>
                    <div className="text-xs text-text-muted">{rate.country}</div>
                  </div>
                </div>
                <button className={idx === 0 ? "text-warning" : "text-text-muted hover:text-warning"}>
                  <Star size={18} fill={idx === 0 ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-text-muted mb-1">Cash Buy</div>
                  <div className="font-semibold text-white">{rate.cashBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Wire Buy</div>
                  <div className="font-semibold text-white">{rate.wireBuy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                <div>
                  <div className="text-xs text-text-muted mb-1">Cash Sell</div>
                  <div className="font-semibold text-white">{rate.cashSell.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Wire Sell</div>
                  <div className="font-semibold text-white">{rate.wireSell.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ExchangeRateChart baseCurrency={selectedBaseCurrency} targetCurrency={selectedTargetCurrency} />
    </div>
  );
}
