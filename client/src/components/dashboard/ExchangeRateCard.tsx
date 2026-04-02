import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cva } from "class-variance-authority";

import { Panel } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { formatPercent } from "@/lib/utils";
import type { CurrencyPair } from "@/types";

import { Sparkline } from "./Sparkline";

const cardShell = cva("min-w-0 rounded-2xl border border-white/10 bg-[#0d1322] p-5 shadow-panel");

const trendIconBox = cva("inline-flex h-10 w-10 items-center justify-center rounded-xl", {
  variants: {
    direction: { up: "bg-status-success/10 text-status-success", down: "bg-status-danger/10 text-status-danger" },
  },
});

const changeLine = cva("mt-2 text-sm font-medium", {
  variants: {
    direction: { up: "text-status-success", down: "text-status-danger" },
  },
});

interface ExchangeRateCardProps {
  pair: CurrencyPair;
}

export function ExchangeRateCard({ pair }: ExchangeRateCardProps) {
  const rising = pair.change >= 0;
  const dir = rising ? "up" : "down";

  return (
    <article className={cardShell()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text variant="overline" className="text-text-tertiary">
            {pair.base}
          </Text>
          <h2 className="mt-2 text-xl font-semibold text-white">{pair.pair}</h2>
          <Text variant="muted" className="mt-1">
            {pair.quote}
          </Text>
        </div>
        <div className={trendIconBox({ direction: dir })}>
          {rising ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-white">{pair.rate}</p>
          <p className={changeLine({ direction: dir })}>{formatPercent(pair.change)}</p>
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

      <Panel variant="exchangeRateFooter">
        <Activity className="h-4 w-4 text-accent" />
        Updated automatically every 5 seconds
      </Panel>
    </article>
  );
}
