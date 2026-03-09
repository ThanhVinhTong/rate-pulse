"use client";

import { useMemo } from "react";

import { useRealtimeRates } from "@/hooks/useRealtimeRates";
import type { CurrencyPair, TimeRange } from "@/types";

import { ExchangeRateCard } from "./ExchangeRateCard";
import { TimeFilter } from "./TimeFilter";

interface ExchangeRatesDashboardProps {
  initialPairs: CurrencyPair[];
  range: TimeRange;
}

export function ExchangeRatesDashboard({
  initialPairs,
  range,
}: ExchangeRatesDashboardProps) {
  const pairs = useRealtimeRates(initialPairs);

  const summary = useMemo(() => {
    const positive = pairs.filter((pair) => pair.change >= 0).length;

    return {
      movers: positive,
      laggards: pairs.length - positive,
    };
  }, [pairs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Market pulse</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Live exchange rate dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Track major currency pairs with simulated real-time pricing, volume,
            and sparkline trend behavior tuned for mobile and desktop traders.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <TimeFilter value={range} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-[#0c1220] px-4 py-3">
              <p className="text-text-muted">Advancing pairs</p>
              <p className="mt-2 text-xl font-semibold text-status-success">{summary.movers}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0c1220] px-4 py-3">
              <p className="text-text-muted">Declining pairs</p>
              <p className="mt-2 text-xl font-semibold text-status-danger">{summary.laggards}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pairs.map((pair) => (
          <ExchangeRateCard key={pair.pair} pair={pair} />
        ))}
      </div>
    </div>
  );
}
