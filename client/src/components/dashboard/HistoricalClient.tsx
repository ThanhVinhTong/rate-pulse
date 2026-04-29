"use client";

import { useState, useMemo, useEffect } from "react";
import type { Currency, RateSourceMetadata } from "@/types/exchange-rates";
import { DEFAULT_SOURCE_CURRENCY_ID, DEFAULT_TARGET_CURRENCY_CODE } from "@/types/exchange-rates";
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

interface HistoricalDataPoint {
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

interface HistoricalClientProps {
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

export function HistoricalClient({
  apiBase,
  currencies,
  rateSources,
}: HistoricalClientProps) {
  const [fromCurrency, setFromCurrency] = useState(
    currencies.find((c) => c.CurrencyID === DEFAULT_SOURCE_CURRENCY_ID)?.CurrencyCode ?? "VND"
  );
  const [toCurrency, setToCurrency] = useState(
    currencies.find((c) => c.CurrencyCode === DEFAULT_TARGET_CURRENCY_CODE)?.CurrencyCode ?? DEFAULT_TARGET_CURRENCY_CODE
  );
  const [selectedSource, setSelectedSource] = useState(
    rateSources[0]?.SourceID ?? 1
  );
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("24h");
  const [selectedType, setSelectedType] = useState<number | null>(null);
  
  const [historicalRates, setHistoricalRates] = useState<HistoricalDataPoint[]>([]);
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

  // Extract unique types from historical data
  const availableTypes = useMemo(() => {
    const types = new Map<number, number>();
    historicalRates.forEach((rate) => {
      if (rate.TypeID.Valid && rate.TypeID.Int32) {
        types.set(rate.TypeID.Int32, rate.TypeID.Int32);
      }
    });
    return Array.from(types.values()).sort((a, b) => a - b);
  }, [historicalRates]);

  // Find the source currency ID from the code
  const sourceCurrencyId = useMemo(() => {
    return currencies.find((c) => c.CurrencyCode === fromCurrency)?.CurrencyID ?? DEFAULT_SOURCE_CURRENCY_ID;
  }, [fromCurrency, currencies]);

  // Fetch historical data from API
  useEffect(() => {
    const fetchHistorical = async () => {
      setIsLoading(true);
      try {
        const dataPoints = ANALYTICS_DATA_POINTS[timeRange];
        const toCurrencyId = currencies.find((c) => c.CurrencyCode === toCurrency)?.CurrencyID;
        
        if (!toCurrencyId) {
          setHistoricalRates([]);
          return;
        }

        const url = new URL(`${apiBase}/exchange-rates/historical`);
        url.searchParams.append("source_currency_id", String(sourceCurrencyId));
        url.searchParams.append("destination_currency_id", String(toCurrencyId));
        url.searchParams.append("source_id", String(selectedSource));
        url.searchParams.append("time_range", timeRange);
        url.searchParams.append("data_points", String(dataPoints));

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const rates = Array.isArray(data) ? data : data?.data || [];
          setHistoricalRates(rates);
        } else {
          console.error("API Error:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch historical:", error);
        setHistoricalRates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistorical();
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
    if (availableTypes.length > 0) {
      // If selectedType is null or not in availableTypes, set to first available
      if (selectedType === null || !availableTypes.includes(selectedType)) {
        setSelectedType(availableTypes[0]);
      }
    }
  }, [availableTypes, selectedType]);

  // Transform historical data to chart format
  const chartData = useMemo(() => {
    const transformed = historicalRates
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
  }, [historicalRates, selectedType]);



  const labelClass = "text-xs font-medium text-text-muted";
  const controlClass =
    "mt-1 h-10 rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm " +
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <section
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
        aria-label="Filters"
      >
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Filters
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label className="block shrink-0 md:min-w-[11rem]">
            <span className={labelClass}>
              Rate Source
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(Number(e.target.value))}
              className={`${controlClass} w-full min-w-[10rem]`}
            >
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block shrink-0 md:min-w-[8rem]">
            <span className={labelClass}>
              From Currency
            </span>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className={`${controlClass} w-full`}
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
          <label className="block shrink-0 md:min-w-[8rem]">
            <span className={labelClass}>
              To Currency
            </span>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className={`${controlClass} w-full`}
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Chart Section */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            Exchange Rate Trends
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            {availableTypes.length > 0 && (
              <select
                value={selectedType ?? availableTypes[0]}
                onChange={(e) => setSelectedType(Number(e.target.value))}
                className={`${controlClass} flex-1`}
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
              className={`${controlClass} flex-1`}
            >
              {TIME_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative h-96 rounded-lg border border-border bg-panel">

          <div className="w-full h-full flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-text-muted">Loading historical data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-text-tertiary)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  style={{ fontSize: "12px" }}
                  domain={["dataMin - 0.5%", "dataMax + 0.5%"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ 
                    color: "var(--color-text-primary)", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}
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
                  stroke="var(--color-primary)"
                  dot={{ fill: "var(--color-primary)", r: 4 }}
                  activeDot={{ r: 6, fill: "var(--color-primary)" }}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="font-medium text-text-muted">
                  No historical data available
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
