"use client";

import { Activity } from "lucide-react";

/** Pairs only — no rate figures (avoids implying live or accurate quotes). */
const TICKER_PAIRS = ["EUR/USD", "USD/JPY", "GBP/USD", "USD/VND", "XAU/USD", "EUR/GBP"];

export function HomeHeroShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
        Illustrative only — not live or executable prices
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#242e44] py-3 shadow-panel">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#242e44] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#242e44] to-transparent" />
        <div className="flex w-max animate-marquee font-mono text-sm text-text-muted">
          <div className="flex shrink-0 gap-10 px-4">
            {TICKER_PAIRS.map((pair) => (
              <span key={pair} className="shrink-0 text-accent">
                {pair}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 gap-10 px-4" aria-hidden>
            {TICKER_PAIRS.map((pair) => (
              <span key={`dup-${pair}`} className="shrink-0 text-accent">
                {pair}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#242e44] p-5 shadow-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <Activity className="h-4 w-4 text-accent" aria-hidden />
            Stylized curve
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            Not market data
          </span>
        </div>
        <div className="animate-chart-pulse">
          <svg viewBox="0 0 400 120" className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
            <title>Decorative chart graphic</title>
            <defs>
              <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0069fe" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0069fe" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,90 L40,82 L80,88 L120,55 L160,62 L200,38 L240,48 L280,32 L320,40 L360,25 L400,30 L400,120 L0,120 Z"
              fill="url(#heroChartFill)"
            />
            <path
              d="M0,90 L40,82 L80,88 L120,55 L160,62 L200,38 L240,48 L280,32 L320,40 L360,25 L400,30"
              fill="none"
              stroke="#00d3e5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-[#242e44]/80 p-4 shadow-panel">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Anonymous placeholders
        </p>
        <div className="space-y-2">
          {["Row A", "Row B", "Row C"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm"
            >
              <span className="font-medium text-text-muted">{label}</span>
              <span className="font-mono text-text-tertiary">— / —</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
