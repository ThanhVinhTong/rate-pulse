import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatPercent } from "@/lib/utils";
import type { CurrencyPair } from "@/types";

import { Sparkline } from "./Sparkline";

interface ExchangeRateCardProps {
  pair: CurrencyPair;
}

export function ExchangeRateCard({ pair }: ExchangeRateCardProps) {
  const rising = pair.change >= 0;

  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0d1322] p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">{pair.base}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{pair.pair}</h2>
          <p className="mt-1 text-sm text-text-muted">{pair.quote}</p>
        </div>
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            rising ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"
          }`}
        >
          {rising ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-white">{pair.rate}</p>
          <p className={`mt-2 text-sm font-medium ${rising ? "text-status-success" : "text-status-danger"}`}>
            {formatPercent(pair.change)}
          </p>
        </div>
        <div className="text-right text-sm text-text-muted">
          <p>Vol. {pair.volume}</p>
          <p className="mt-1">
            {pair.low} - {pair.high}
          </p>
        </div>
      </div>

      <div className="mt-6 h-24 min-w-0">
        <Sparkline data={pair.sparkline} rising={rising} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-text-muted">
        <Activity className="h-4 w-4 text-accent" />
        Updated automatically every 5 seconds
      </div>
    </article>
  );
}
