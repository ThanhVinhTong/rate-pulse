"use client";

import { useState, useMemo, useEffect } from "react";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";
import { TIME_RANGES, ANALYTICS_DATA_POINTS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsDataPoint {
  RateValue: string;
  UpdatedAt: {
    Time: string;
    Valid: boolean;
  };
  TypeID: {
    Int32: number;
    Valid: boolean;
  };
}

interface AnalyticsClientProps {
  apiBase: string;
  currencies: Currency[];
  rateSources: RateSourceMetadata[];
}

interface ExchangeRateType {
  type_id: number;
  type_name: string;
}

interface ChartDataPoint {
  date: string;
  rate: number;
}

export function AnalyticsClient({
  apiBase,
  currencies,
  rateSources,
}: AnalyticsClientProps) {
  const [fromCurrency, setFromCurrency] = useState(
    currencies[0]?.CurrencyCode ?? "USD"
  );
  const [toCurrency, setToCurrency] = useState(
    currencies[1]?.CurrencyCode ?? "USD"
  );
  const [selectedSource, setSelectedSource] = useState(
    rateSources[0]?.SourceID ?? 1
  );
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("24h");
  const [conversionAmount, setConversionAmount] = useState("100");
  const [selectedType, setSelectedType] = useState<number | null>(null);
  
  const [analyticsRates, setAnalyticsRates] = useState<AnalyticsDataPoint[]>([]);
  const [exchangeRateTypes, setExchangeRateTypes] = useState<ExchangeRateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ code: c.CurrencyCode, name: c.CurrencyName })),
    [currencies]
  );

  const sourceOptions = useMemo(
    () =>
      rateSources.map((s) => ({ id: s.SourceID, name: s.SourceName, code: s.SourceCode })),
    [rateSources]
  );

  // Create mapping from type ID to type name
  const typeNameMap = useMemo(() => {
    const map = new Map<number, string>();
    exchangeRateTypes.forEach((type) => {
      map.set(type.type_id, type.type_name);
    });
    return map;
  }, [exchangeRateTypes]);

  // Extract unique types from analytics data
  const availableTypes = useMemo(() => {
    const types = new Map<number, number>();
    analyticsRates.forEach((rate) => {
      if (rate.TypeID.Valid && rate.TypeID.Int32) {
        types.set(rate.TypeID.Int32, rate.TypeID.Int32);
      }
    });
    return Array.from(types.values()).sort((a, b) => a - b);
  }, [analyticsRates]);

  // Find the source currency ID from the code
  const sourceCurrencyId = useMemo(() => {
    return currencies.find((c) => c.CurrencyCode === fromCurrency)?.CurrencyID ?? 150;
  }, [fromCurrency, currencies]);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const dataPoints = ANALYTICS_DATA_POINTS[timeRange];
        const toCurrencyId = currencies.find((c) => c.CurrencyCode === toCurrency)?.CurrencyID;
        
        if (!toCurrencyId) {
          setAnalyticsRates([]);
          return;
        }

        const url = new URL(`${apiBase}/exchange-rates/analytics`);
        url.searchParams.append("source_currency_id", String(sourceCurrencyId));
        url.searchParams.append("destination_currency_id", String(toCurrencyId));
        url.searchParams.append("source_id", String(selectedSource));
        url.searchParams.append("time_range", timeRange);
        url.searchParams.append("data_points", String(dataPoints));

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const rates = Array.isArray(data) ? data : data?.data || [];
          setAnalyticsRates(rates);
        } else {
          console.error("API Error:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setAnalyticsRates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiBase, sourceCurrencyId, toCurrency, selectedSource, timeRange, currencies]);

  // Fetch exchange rate types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch(`${apiBase}/exchange-rate-types`);
        if (res.ok) {
          const data = await res.json();
          const types = Array.isArray(data) ? data : data?.data || [];
          setExchangeRateTypes(types);
        } else {
          console.error("Failed to fetch exchange rate types");
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate types:", error);
      }
    };

    fetchTypes();
  }, [apiBase]);

  // Set selectedType to first available type when availableTypes changes
  useEffect(() => {
    if (availableTypes.length > 0 && selectedType === null) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  // Transform analytics data to chart format
  const chartData = useMemo(() => {
    const transformed = analyticsRates
      .filter((rate) => {
        // Filter by selected type
        if (selectedType !== null && rate.TypeID.Valid && rate.TypeID.Int32 !== selectedType) {
          return false;
        }
        return rate.UpdatedAt.Valid && rate.RateValue;
      })
      .map((rate) => ({
        date: rate.UpdatedAt.Time.split("T")[0],
        rate: parseFloat(rate.RateValue),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return transformed;
  }, [analyticsRates, selectedType]);

  // Get latest rate for conversion
  const baseRate = useMemo(() => {
    if (chartData.length === 0) return 1.2;
    return chartData[chartData.length - 1]?.rate ?? 1.2;
  }, [chartData]);

  const convertedAmount = useMemo(() => {
    const amount = parseFloat(conversionAmount) || 0;
    return (amount * baseRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [conversionAmount, baseRate]);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <section
        className="rounded-xl border border-emerald-700 bg-emerald-50/90 p-4 dark:border-emerald-700 dark:bg-emerald-950/50"
        aria-label="Filters"
      >
        <h2 className="mb-4 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Filters
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label className="block shrink-0 md:min-w-[11rem]">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Rate Source
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(Number(e.target.value))}
              className="mt-1 w-full min-w-[10rem] rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25"
            >
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Converter Section */}
      <section
        className="rounded-xl border border-emerald-700 bg-emerald-50/90 p-4 dark:border-emerald-700 dark:bg-emerald-950/50"
        aria-label="Currency Converter"
      >
        <h2 className="mb-4 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Currency Converter
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <div className="flex-1 md:min-w-[22rem]">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                From
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(e.target.value)}
                  placeholder="100"
                  className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25"
                />
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="text-2xl text-emerald-600 dark:text-emerald-400 hidden md:block">→</div>

          <div className="flex-1 md:min-w-[22rem]">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                To
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  value={convertedAmount}
                  readOnly
                  placeholder="120"
                  className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25"
                />
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-emerald-950/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-emerald-100">
            Exchange Rate Trends
          </h2>
          <div className="flex gap-2">
            {availableTypes.length > 0 && (
              <select
                value={selectedType ?? availableTypes[0]}
                onChange={(e) => setSelectedType(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-emerald-900/80 dark:border-emerald-600 dark:text-emerald-100"
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeNameMap.get(type) || `Type ${type}`}
                  </option>
                ))}
              </select>
            )}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-emerald-900/80 dark:border-emerald-600 dark:text-emerald-100"
            >
              {TIME_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative h-96 rounded-2xl border border-gray-200 bg-gray-50 dark:bg-emerald-900/20 dark:border-emerald-700">

          <div className="w-full h-full flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 dark:border-emerald-400"></div>
              <p className="text-gray-500 dark:text-emerald-300">Loading analytics data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b5e4a" />
                <XAxis
                  dataKey="date"
                  stroke="#10b981"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#10b981"
                  style={{ fontSize: "12px" }}
                  domain={["dataMin - 0.5%", "dataMax + 0.5%"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#065f46",
                    border: "1px solid #059669",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#10b981", fontSize: "14px", fontWeight: "bold" }}
                  formatter={(value) => {
                    if (typeof value === "number") {
                      return [value.toFixed(4), "Rate"];
                    }
                    return [value, "Rate"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-gray-400 font-medium">
                  No analytics data available
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
