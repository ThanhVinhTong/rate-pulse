"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Star } from "lucide-react";

import { useRealtimeRates } from "@/hooks/useRealtimeRates";
import { refreshExchangeRatesAction } from "@/app/actions";
import type { BankRate, CurrencyPair, TimeRange } from "@/types";

import { ExchangeRateFilters } from "./ExchangeRateFilters";
import { CurrencyConverter } from "./CurrencyConverter";
import { ExchangeRateChart } from "./ExchangeRateChart";

interface ExchangeRatesDashboardProps {
  initialPairs: CurrencyPair[];
  initialBankRates: BankRate[];
  supportedCurrencyOptions: Array<{
    code: string;
    name: string;
    symbol: string;
    continent: string;
  }>;
  range: TimeRange;
}

export function ExchangeRatesDashboard({
  initialPairs,
  initialBankRates,
  supportedCurrencyOptions,
  range,
}: ExchangeRatesDashboardProps) {
  const [bankRates, setBankRates] = useState(initialBankRates);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const realtimePairs = useRealtimeRates(initialPairs);
  const defaultPair = realtimePairs[0]?.pair ?? "USD/JPY";
  const [initialBase, initialTarget] = defaultPair.split("/");
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState(initialBase);
  const [selectedTargetCurrency, setSelectedTargetCurrency] = useState(initialTarget);
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshExchangeRatesAction();
      if (result.status === "success" && Array.isArray(result.data)) {
        setBankRates(result.data);
      }
    } catch (error) {
      console.error("Failed to refresh rates:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const conversionUpdatedAt = useMemo(() => {
    if (bankRates.length === 0) return "N/A";
    const latestTimestamp = bankRates
      .filter((rate) => rate.timestamp)
      .map((rate) => new Date(rate.timestamp!))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    
    if (!latestTimestamp) return "N/A";
    
    const hours = String(latestTimestamp.getHours()).padStart(2, "0");
    const minutes = String(latestTimestamp.getMinutes()).padStart(2, "0");
    const day = String(latestTimestamp.getDate()).padStart(2, "0");
    const month = String(latestTimestamp.getMonth() + 1).padStart(2, "0");
    const year = latestTimestamp.getFullYear();
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }, [bankRates]);

  const availableCurrencies = useMemo(() => {
    const pairCurrencies = realtimePairs
      .flatMap((pair) => pair.pair.split("/"))
      .filter(Boolean);

    // Keep all supported currencies selectable (including VND),
    // then merge in any extra codes discovered from live pairs.
    const mergedCodes = Array.from(
      new Set([...supportedCurrencyOptions.map((currency) => currency.code), ...pairCurrencies]),
    );

    return mergedCodes.map((code) => {
      const matched = supportedCurrencyOptions.find((currency) => currency.code === code);
      return { code, name: matched?.name ?? code, continent: matched?.continent ?? "Other" };
    });
  }, [realtimePairs, supportedCurrencyOptions]);

  const directPair = realtimePairs.find((pair) => pair.pair === `${selectedBaseCurrency}/${selectedTargetCurrency}`);
  const inversePair = realtimePairs.find((pair) => pair.pair === `${selectedTargetCurrency}/${selectedBaseCurrency}`);
  const marketReferenceRate = directPair?.rate ?? (inversePair ? Number((1 / inversePair.rate).toFixed(6)) : null);

  const sourceOptions = useMemo(
    () => [
      "All Sources",
      ...Array.from(
        new Set(
          bankRates
            .filter((rate) => rate.baseCurrency === selectedBaseCurrency)
            .map((rate) => rate.source),
        ),
      ),
    ],
    [bankRates, selectedBaseCurrency],
  );

  const effectiveSelectedSource = sourceOptions.includes(selectedSource)
    ? selectedSource
    : "All Sources";

  const chartSeries = (directPair?.sparkline ?? inversePair?.sparkline ?? []).map((rate, index) => ({
    date: `P${index + 1}`,
    rate: directPair ? Number(rate.toFixed(4)) : Number((1 / rate).toFixed(6)),
  }));

  const rates = bankRates.filter((rate) => {
    const matchPair =
      rate.baseCurrency === selectedBaseCurrency && rate.targetCurrency === selectedTargetCurrency;
    const matchSource = effectiveSelectedSource === "All Sources" || rate.source === effectiveSelectedSource;
    const matchFavorite = !favoritesOnly || rate.favorite;
    return matchPair && matchSource && matchFavorite;
  });

  // Keep only the latest rate from each source
  const latestRatesBySource = useMemo(() => {
    const sourceMap = new Map<string, BankRate>();
    for (const rate of rates) {
      const existing = sourceMap.get(rate.source);
      if (!existing || (rate.timestamp && existing.timestamp && rate.timestamp > existing.timestamp)) {
        sourceMap.set(rate.source, rate);
      }
    }
    return Array.from(sourceMap.values());
  }, [rates]);

  const bestWireSellRateFromTable = latestRatesBySource.length > 0
    ? Math.min(...latestRatesBySource.map((rate) => rate.wireSell))
    : null;

  const conversionRate = bestWireSellRateFromTable ?? marketReferenceRate ?? 1;

  const groupedRates = latestRatesBySource.reduce<Record<string, typeof latestRatesBySource>>((groups, rate) => {
    if (!groups[rate.baseCurrency]) {
      groups[rate.baseCurrency] = [];
    }
    groups[rate.baseCurrency].push(rate);
    return groups;
  }, {});

  const handleBaseCurrencyChange = (currency: string) => {
    setSelectedBaseCurrency(currency);
    if (currency === selectedTargetCurrency) {
      const nextTarget = availableCurrencies.find((item) => item.code !== currency)?.code ?? currency;
      setSelectedTargetCurrency(nextTarget);
    }
  };

  const handleTargetCurrencyChange = (currency: string) => {
    setSelectedTargetCurrency(currency);
    if (currency === selectedBaseCurrency) {
      const nextBase = availableCurrencies.find((item) => item.code !== currency)?.code ?? currency;
      setSelectedBaseCurrency(nextBase);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-white">Exchange Rates</h1>
          <p className="text-sm text-text-muted mt-1">Real-time currency exchange rates from multiple sources</p>
        </div>
        <button
          onClick={handleRefreshRates}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh Rates"}</span>
          <span className="sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
        </button>
      </div>

      <ExchangeRateFilters
        baseCurrency={selectedBaseCurrency}
        targetCurrency={selectedTargetCurrency}
        currencies={availableCurrencies}
        sourceOptions={sourceOptions}
        selectedSource={effectiveSelectedSource}
        conversionUpdatedAt={conversionUpdatedAt}
        favoritesOnly={favoritesOnly}
        onBaseCurrencyChange={handleBaseCurrencyChange}
        onTargetCurrencyChange={handleTargetCurrencyChange}
        onSourceChange={setSelectedSource}
        onFavoritesOnlyToggle={() => setFavoritesOnly((current) => !current)}
      />

      <CurrencyConverter
        baseCurrency={selectedBaseCurrency}
        targetCurrency={selectedTargetCurrency}
        conversionRate={conversionRate}
        currencyOptions={supportedCurrencyOptions}
        updatedAt={conversionUpdatedAt}
      />

      {/* Grouped Exchange Rates Tables */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-panel">
        <div className="bg-[#0c1220] px-4 md:px-6 py-4 border-b border-white/10">
          <h3 className="text-base md:text-lg font-semibold text-primary">
            {selectedBaseCurrency} → {selectedTargetCurrency}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {latestRatesBySource.length} sources available
          </p>
        </div>
        {Object.entries(groupedRates).map(([baseCurrency, group]) => (
          <div key={baseCurrency} className="border-t border-white/10 first:border-t-0">
            <div className="px-4 md:px-6 py-3 bg-[#0c1220]/60 text-xs uppercase tracking-wider text-text-muted">
              Base Currency: <span className="text-primary font-semibold">{baseCurrency}</span>
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
                    {/* <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Change</th> */}
                    <th className="px-5 py-4 font-medium uppercase text-xs tracking-wider">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((rate, idx) => (
                    <tr key={rate.id} className="border-t border-white/10 text-text-primary hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <button className={idx === 0 ? "text-warning" : "text-text-muted hover:text-warning"}>
                          <Star size={16} fill={idx === 0 ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="px-5 py-4 font-medium text-white">{rate.source}</td>
                      <td className="px-5 py-4 font-semibold text-white">{rate.cashBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 font-semibold text-white">{rate.wireBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 font-semibold text-white">{rate.cashSell.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 font-semibold text-white">{rate.wireSell.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      {/* <td className="px-5 py-4">
                        <div className={`flex items-center gap-1 font-semibold ${rate.change >= 0 ? "text-status-success" : "text-status-danger"}`}>
                          {rate.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {rate.change >= 0 ? "+" : ""}{rate.change}%
                        </div>
                      </td> */}
                      <td className="px-5 py-4 text-text-muted">{rate.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-white/10">
              {group.map((rate, idx) => (
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
                      <div className="font-semibold text-white">{rate.cashBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Wire Buy</div>
                      <div className="font-semibold text-white">{rate.wireBuy.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <div className="text-xs text-text-muted mb-1">Cash Sell</div>
                      <div className="font-semibold text-white">{rate.cashSell.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Wire Sell</div>
                      <div className="font-semibold text-white">{rate.wireSell.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {latestRatesBySource.length === 0 && (
          <div className="px-6 py-8 text-center text-text-muted text-sm">
            No source data available for {selectedBaseCurrency}/{selectedTargetCurrency}.
          </div>
        )}
      </div>

      <ExchangeRateChart
        baseCurrency={selectedBaseCurrency}
        targetCurrency={selectedTargetCurrency}
        data={chartSeries}
        initialRange={range}
      />
    </div>
  );
}
