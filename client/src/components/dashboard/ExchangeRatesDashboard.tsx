"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Star } from "lucide-react";

import { refreshExchangeRatesAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { useRealtimeRates } from "@/hooks/useRealtimeRates";
import type { CurrencyPair, PairSnapshot, SourceSnapshot, TimeRange } from "@/types";

import { CurrencyConverter } from "./CurrencyConverter";
import { ExchangeRateChart } from "./ExchangeRateChart";
import { ExchangeRateFilters } from "./ExchangeRateFilters";

function formatRateValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

/** Stable across SSR and browser (avoids hydration mismatch from default toLocaleString()). */
function formatUpdatedAtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

interface ExpandedTypeColumn {
  key: string;
  label: string;
  typeId: number;
}

function getPrimaryOrder(label: string): number {
  const lower = label.toLowerCase();
  if (lower.startsWith("buy ")) return 0;
  if (lower.startsWith("sell ")) return 1;
  return 2;
}

function getSecondaryOrder(label: string): number {
  const lower = label.toLowerCase();
  if (lower.includes("cash")) return 0;
  if (lower.includes("transfer")) return 1;
  if (lower.includes("wire")) return 2;
  if (lower.includes("cheque") || lower.includes("check")) return 3;
  if (lower.includes("card")) return 4;
  return 5;
}

function orderExpandedColumns(columns: ExpandedTypeColumn[]): ExpandedTypeColumn[] {
  return [...columns].sort((a, b) => {
    const primary = getPrimaryOrder(a.label) - getPrimaryOrder(b.label);
    if (primary !== 0) return primary;

    const secondary = getSecondaryOrder(a.label) - getSecondaryOrder(b.label);
    if (secondary !== 0) return secondary;

    return a.label.localeCompare(b.label);
  });
}

function expandTypeColumns(
  columns: Array<{ typeId: number; typeName: string }>,
): ExpandedTypeColumn[] {
  const expanded = columns.flatMap((column) => {
    const parts = column.typeName
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return [{ key: String(column.typeId), label: column.typeName, typeId: column.typeId }];
    }

    const prefix = parts[0]?.split(" ").filter(Boolean)[0] ?? "";
    return parts.map((part, index) => ({
      key: `${column.typeId}-${index}`,
      label:
        index === 0 || !prefix || part.toLowerCase().startsWith(`${prefix.toLowerCase()} `)
          ? part
          : `${prefix} ${part}`,
      typeId: column.typeId,
    }));
  });

  return orderExpandedColumns(expanded);
}

function collectNumericRates(snapshot: PairSnapshot | undefined): number[] {
  if (!snapshot) {
    return [];
  }
  const out: number[] = [];
  for (const src of snapshot.sources) {
    for (const v of Object.values(src.rates)) {
      if (v != null && Number.isFinite(v)) {
        out.push(v);
      }
    }
  }
  return out;
}

interface ExchangeRatesDashboardProps {
  initialPairs: CurrencyPair[];
  initialPairSnapshots: PairSnapshot[];
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
  initialPairSnapshots,
  supportedCurrencyOptions,
  range,
}: ExchangeRatesDashboardProps) {
  const [pairSnapshots, setPairSnapshots] = useState(initialPairSnapshots);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setPairSnapshots(initialPairSnapshots);
  }, [initialPairSnapshots]);
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
        setPairSnapshots(result.data as PairSnapshot[]);
      }
    } catch (error) {
      console.error("Failed to refresh rates:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedSnapshot = useMemo(
    () =>
      pairSnapshots.find(
        (p) =>
          p.baseCurrency === selectedBaseCurrency && p.targetCurrency === selectedTargetCurrency,
      ),
    [pairSnapshots, selectedBaseCurrency, selectedTargetCurrency],
  );

  const conversionUpdatedAt = useMemo(() => {
    const times = (selectedSnapshot?.sources ?? [])
      .map((s) => s.updatedAt)
      .filter(Boolean) as string[];
    if (times.length === 0) {
      return "N/A";
    }
    const latest = times.sort().at(-1);
    if (!latest) {
      return "N/A";
    }
    const latestTimestamp = new Date(latest);
    const hours = String(latestTimestamp.getHours()).padStart(2, "0");
    const minutes = String(latestTimestamp.getMinutes()).padStart(2, "0");
    const day = String(latestTimestamp.getDate()).padStart(2, "0");
    const month = String(latestTimestamp.getMonth() + 1).padStart(2, "0");
    const year = latestTimestamp.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }, [selectedSnapshot]);

  const availableCurrencies = useMemo(() => {
    const pairCurrencies = realtimePairs
      .flatMap((pair) => pair.pair.split("/"))
      .filter(Boolean);

    const snapshotPairCodes = pairSnapshots.flatMap((p) => [p.baseCurrency, p.targetCurrency]);

    const mergedCodes = Array.from(
      new Set([
        ...supportedCurrencyOptions.map((currency) => currency.code),
        ...pairCurrencies,
        ...snapshotPairCodes,
        selectedBaseCurrency,
        selectedTargetCurrency,
      ]),
    ).sort((a, b) => a.localeCompare(b));

    return mergedCodes.map((code) => {
      const matched = supportedCurrencyOptions.find((currency) => currency.code === code);
      return { code, name: matched?.name ?? code, continent: matched?.continent ?? "Other" };
    });
  }, [
    realtimePairs,
    supportedCurrencyOptions,
    pairSnapshots,
    selectedBaseCurrency,
    selectedTargetCurrency,
  ]);

  const directPair = realtimePairs.find((pair) => pair.pair === `${selectedBaseCurrency}/${selectedTargetCurrency}`);
  const inversePair = realtimePairs.find((pair) => pair.pair === `${selectedTargetCurrency}/${selectedBaseCurrency}`);
  const marketReferenceRate = directPair?.rate ?? (inversePair ? Number((1 / inversePair.rate).toFixed(6)) : null);

  const sourceOptions = useMemo(() => {
    const names = (selectedSnapshot?.sources ?? []).map((s) => s.sourceName);
    return ["All Sources", ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))];
  }, [selectedSnapshot]);

  const effectiveSelectedSource = sourceOptions.includes(selectedSource)
    ? selectedSource
    : "All Sources";

  const chartSeries = (directPair?.sparkline ?? inversePair?.sparkline ?? []).map((rate, index) => ({
    date: `P${index + 1}`,
    rate: directPair ? Number(rate.toFixed(4)) : Number((1 / rate).toFixed(6)),
  }));

  const filteredSources: SourceSnapshot[] = useMemo(() => {
    const list = selectedSnapshot?.sources ?? [];
    if (effectiveSelectedSource === "All Sources") {
      return list;
    }
    return list.filter((s) => s.sourceName === effectiveSelectedSource);
  }, [selectedSnapshot, effectiveSelectedSource]);

  const numericForConversion = collectNumericRates(selectedSnapshot);
  const bestWireSellRateFromTable =
    numericForConversion.length > 0 ? Math.min(...numericForConversion) : null;
  const conversionRate = bestWireSellRateFromTable ?? marketReferenceRate ?? 1;

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

  const typeColumns = selectedSnapshot?.types ?? [];
  const expandedTypeColumns = useMemo(() => expandTypeColumns(typeColumns), [typeColumns]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exchange Rates"
        description="Real-time currency exchange rates from multiple sources"
        action={
          <Button type="button" variant="compact" onClick={handleRefreshRates} disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh Rates"}</span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
          </Button>
        }
      />

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

      <Panel variant="sheet" className="overflow-hidden">
        <div className="border-b border-white/10 bg-[#0c1220] px-4 py-4 text-oninset md:px-6">
          <h3 className="text-base font-semibold text-oninset md:text-lg">
            {selectedBaseCurrency} → {selectedTargetCurrency}
          </h3>
          <Text variant="onInsetMuted" className="mt-1">
            {filteredSources.length} source{filteredSources.length === 1 ? "" : "s"} available
            {expandedTypeColumns.length > 0
              ? ` · ${expandedTypeColumns.length} rate type${expandedTypeColumns.length === 1 ? "" : "s"}`
              : ""}
          </Text>
        </div>

        {!selectedSnapshot && (
          <div className="px-6 py-8 text-center">
            <Text variant="muted">
              No rate data for {selectedBaseCurrency}/{selectedTargetCurrency}.
            </Text>
          </div>
        )}

        {selectedSnapshot && filteredSources.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Text variant="muted">
              No source data matches your filters for {selectedBaseCurrency}/{selectedTargetCurrency}.
            </Text>
          </div>
        )}

        {selectedSnapshot && filteredSources.length > 0 && (
          <div className="divide-y divide-white/10">
            {filteredSources.map((source, idx) => {
              const sourceTypeColumns = typeColumns.filter((t) => source.rates[t.typeId] != null);
              const sourceExpandedTypeColumns = expandTypeColumns(sourceTypeColumns);
              const visibleRateCells = sourceExpandedTypeColumns.slice(0, 8);
              const hiddenCount = Math.max(0, sourceExpandedTypeColumns.length - visibleRateCells.length);

              return (
                <div key={`${source.sourceId}-${source.sourceName}`} className="bg-[#0c1220]/40">
                  <div className="flex flex-col gap-2 border-b border-white/10 bg-[#0c1220]/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-white">{source.sourceName}</div>
                        <div className="text-xs text-slate-400">
                          {source.sourceCountry ?? "—"}
                          {source.updatedAt ? ` · Updated ${formatUpdatedAtLabel(source.updatedAt)} UTC` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={idx === 0 ? "text-warning" : "text-text-muted hover:text-warning"}
                    >
                      <Star size={18} fill={idx === 0 ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="p-4 md:p-5">
                    {visibleRateCells.length === 0 ? (
                      <Text variant="muted">No meaningful rate values for this source.</Text>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {visibleRateCells.map((t) => (
                          <Panel key={t.key} variant="rateCell">
                            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-oninset-muted">
                              {t.label}
                            </div>
                            <div className="font-semibold text-oninset">{formatRateValue(source.rates[t.typeId])}</div>
                          </Panel>
                        ))}
                      </div>
                    )}
                    {hiddenCount > 0 && (
                      <Text variant="caption" className="mt-3 text-text-muted">
                        +{hiddenCount} more rate type{hiddenCount === 1 ? "" : "s"}
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <ExchangeRateChart
        baseCurrency={selectedBaseCurrency}
        targetCurrency={selectedTargetCurrency}
        data={chartSeries}
        initialRange={range}
      />
    </div>
  );
}
