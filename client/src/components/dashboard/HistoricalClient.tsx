"use client";

import { useState, useMemo, useEffect } from "react";
import { CurrencyPairBadge } from "@/components/currency/currency-flag";
import type { Currency, ExchangeRateLatest, RateSourceMetadata } from "@/types/exchange-rates";
import { DEFAULT_SOURCE_CURRENCY_ID, DEFAULT_TARGET_CURRENCY_CODE, EXCHANGE_RATES_LIMIT } from "@/types/exchange-rates";
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
  UpdatedAt: string; // ISO string
  TypeID: number;
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
  timestamp: number;
  rate: number;
}

type GoNullString = { String: string; Valid: boolean };
type GoNullInt32 = { Int32: number; Valid: boolean };

function wireString(v: string | GoNullString | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v.Valid && typeof v.String === "string") {
    return v.String.trim();
  }
  return "";
}

function wireInt32(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as Partial<GoNullInt32>;
    if (o.Valid === true && typeof o.Int32 === "number") return o.Int32;
  }
  return null;
}

function formatChartLabel(iso: string, timeRange: (typeof TIME_RANGES)[number]): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  if (timeRange === "24h" || timeRange === "48h") {
    const day = date.toLocaleDateString("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "short",
    });
    const time = date.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${day} ${time}`;
  }

  if (timeRange === "7d" || timeRange === "15d" || timeRange === "1m") {
    return date.toLocaleDateString("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "short",
    });
  }

  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function HistoricalClient({
  apiBase,
  currencies,
  rateSources,
}: HistoricalClientProps) {
  const initialSourceCurrencyId =
    currencies.find((c) => c.CurrencyID === DEFAULT_SOURCE_CURRENCY_ID)?.CurrencyID ??
    currencies[0]?.CurrencyID ??
    DEFAULT_SOURCE_CURRENCY_ID;

  const initialSourceId =
    rateSources.find(
      (source) => wireInt32(source.CurrencyID) === initialSourceCurrencyId,
    )?.SourceID ??
    rateSources[0]?.SourceID ??
    1;

  const [fromCurrency, setFromCurrency] = useState(
    currencies.find((c) => c.CurrencyID === initialSourceCurrencyId)?.CurrencyCode ?? "VND"
  );
  const [toCurrency, setToCurrency] = useState(
    currencies.find((c) => c.CurrencyCode === DEFAULT_TARGET_CURRENCY_CODE)?.CurrencyCode ?? DEFAULT_TARGET_CURRENCY_CODE
  );
  const [selectedSource, setSelectedSource] = useState(initialSourceId);
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>("24h");
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [hasUserSelectedType, setHasUserSelectedType] = useState(false);
  
  const [historicalRates, setHistoricalRates] = useState<HistoricalDataPoint[]>([]);
  const [exchangeRateTypes, setExchangeRateTypes] = useState<ExchangeRateType[]>([]);
  const [latestRates, setLatestRates] = useState<ExchangeRateLatest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [preferredIds, setPreferredIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const cached = sessionStorage.getItem("rp_preferred_currency_ids");
    if (cached) {
      try {
        const ids: number[] = JSON.parse(cached);
        if (Array.isArray(ids)) {
          setPreferredIds(new Set(ids));
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached preferences:", e);
      }
    }

    let active = true;
    async function loadPreferences() {
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const ids: number[] = await res.json();
        if (active && Array.isArray(ids)) {
          sessionStorage.setItem("rp_preferred_currency_ids", JSON.stringify(ids));
          setPreferredIds(new Set(ids));
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      }
    }

    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const enrichedCurrencies = useMemo(() => {
    return currencies.map((c) => ({
      ...c,
      IsPreferred: preferredIds.has(c.CurrencyID),
    }));
  }, [currencies, preferredIds]);

  const currencyOptions = useMemo(() => {
    const options = enrichedCurrencies.map((c) => ({
      code: c.CurrencyCode,
      name: c.CurrencyName,
      isPreferred: c.IsPreferred,
    }));

    return options.sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [enrichedCurrencies]);

  const sourceCurrencyId = useMemo(() => {
    return currencies.find((c) => c.CurrencyCode === fromCurrency)?.CurrencyID ?? initialSourceCurrencyId;
  }, [fromCurrency, currencies, initialSourceCurrencyId]);

  const sourceOptions = useMemo(() => {
    const options = rateSources
      .filter((source) => wireInt32(source.CurrencyID) === sourceCurrencyId)
      .map((source) => {
        const code = wireString(source.SourceCode);
        return {
          id: source.SourceID,
          code,
          label: code ? `${code} - ${source.SourceName}` : source.SourceName,
        };
      });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [rateSources, sourceCurrencyId]);

  // Create mapping from type ID to type name
  const typeNameMap = useMemo(() => {
    const map = new Map<number, string>();
    exchangeRateTypes.forEach((type) => {
      map.set(type.type_id, type.type_name);
    });
    return map;
  }, [exchangeRateTypes]);

  const typeIdByName = useMemo(() => {
    const map = new Map<string, number>();
    exchangeRateTypes.forEach((type) => {
      map.set(type.type_name.trim().toLowerCase(), type.type_id);
    });
    return map;
  }, [exchangeRateTypes]);

  const selectedSourceCode = useMemo(() => {
    return sourceOptions.find((source) => source.id === selectedSource)?.code ?? "";
  }, [sourceOptions, selectedSource]);

  // Limit the chart type dropdown to types available for the selected source/pair.
  const availableTypes = useMemo(() => {
    const typeIds = new Set<number>();

    for (const rate of latestRates) {
      const sourceCode = wireString(rate.RateSourceCode);
      const typeName = wireString(rate.TypeName).trim().toLowerCase();
      const typeId = typeIdByName.get(typeName);

      if (
        typeId != null &&
        sourceCode === selectedSourceCode &&
        rate.SourceCurrencyCode === fromCurrency &&
        rate.DestinationCurrencyCode === toCurrency
      ) {
        typeIds.add(typeId);
      }
    }

    return Array.from(typeIds).sort((a, b) => a - b);
  }, [latestRates, selectedSourceCode, fromCurrency, toCurrency, typeIdByName]);

  useEffect(() => {
    if (!sourceOptions.length) return;
    if (!sourceOptions.some((source) => source.id === selectedSource)) {
      setSelectedSource(sourceOptions[0].id);
    }
  }, [sourceOptions, selectedSource]);

  useEffect(() => {
    setHasUserSelectedType(false);
  }, [fromCurrency, toCurrency, selectedSource, timeRange]);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestRates = async () => {
      try {
        const url = new URL(`${apiBase}/exchange-rates-latest`);
        url.searchParams.append("source_currency_id", String(sourceCurrencyId));
        url.searchParams.append("limit", String(EXCHANGE_RATES_LIMIT));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLatestRates([]);
          return;
        }

        const data: unknown = await res.json();
        const rates = Array.isArray(data) ? data : [];
        if (!cancelled) setLatestRates(rates);
      } catch (error) {
        console.error("Failed to fetch latest rates:", error);
        if (!cancelled) setLatestRates([]);
      }
    };

    fetchLatestRates();

    return () => {
      cancelled = true;
    };
  }, [apiBase, sourceCurrencyId]);

  // Fetch historical data from API
  useEffect(() => {
    const fetchHistorical = async () => {
      setIsLoading(true);
      try {
        const dataPoints = ANALYTICS_DATA_POINTS[timeRange];
        const toCurrencyId = currencies.find((c) => c.CurrencyCode === toCurrency)?.CurrencyID;
        
        if (!toCurrencyId || selectedType === null) {
          setHistoricalRates([]);
          return;
        }

        const url = new URL(`${apiBase}/exchange-rates/historical`);
        url.searchParams.append("source_currency_id", String(sourceCurrencyId));
        url.searchParams.append("destination_currency_id", String(toCurrencyId));
        url.searchParams.append("source_id", String(selectedSource));
        url.searchParams.append("time_range", timeRange);
        url.searchParams.append("data_points", String(dataPoints));
        url.searchParams.append("type_id", String(selectedType));

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
  }, [apiBase, sourceCurrencyId, toCurrency, selectedSource, timeRange, currencies, selectedType]);

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

  // Prefer the business-default trend type when it exists for the selected source/pair.
  useEffect(() => {
    if (availableTypes.length === 0) {
      if (selectedType !== null) {
        setSelectedType(null);
      }
      return;
    }

    const buyTransferType = availableTypes.find(
      (type) => typeNameMap.get(type)?.trim().toLowerCase() === "buy transfer",
    );
    const nextType = buyTransferType ?? availableTypes[0];

    if (
      selectedType === null ||
      !availableTypes.includes(selectedType) ||
      (!hasUserSelectedType && buyTransferType != null && selectedType !== buyTransferType)
    ) {
      setSelectedType(nextType);
    }
  }, [availableTypes, hasUserSelectedType, selectedType, typeNameMap]);

  // Transform historical data to chart format
  const chartData = useMemo(() => {
    const transformed = historicalRates
      .filter((rate) => {
        // Filter by selected type
        if (selectedType !== null && rate.TypeID !== selectedType) {
          return false;
        }
        return rate.UpdatedAt && rate.RateValue;
      })
      .map((rate) => {
        const timestamp = new Date(rate.UpdatedAt).getTime();
        return {
          date: formatChartLabel(rate.UpdatedAt, timeRange),
          timestamp,
          rate: parseFloat(rate.RateValue),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return transformed;
  }, [historicalRates, selectedType, timeRange]);



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
                  {source.label}
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
                  {c.isPreferred ? `❤️ ${c.code}` : c.code}
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
                  {c.isPreferred ? `❤️ ${c.code}` : c.code}
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
          <CurrencyPairBadge
            sourceCode={fromCurrency}
            destinationCode={toCurrency}
            separator="→"
            className="text-sm"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            {availableTypes.length > 0 && (
              <select
                value={selectedType ?? availableTypes[0]}
                onChange={(e) => {
                  setHasUserSelectedType(true);
                  setSelectedType(Number(e.target.value));
                }}
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
