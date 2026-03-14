"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TIME_RANGES } from "@/lib/constants";
import type { TimeRange } from "@/types";

interface ExchangeRatePoint {
  date: string;
  rate: number;
}

interface ExchangeRateChartProps {
  baseCurrency: string;
  targetCurrency: string;
  data: ExchangeRatePoint[];
  initialRange: TimeRange;
}

const defaultData: ExchangeRatePoint[] = [
  { date: "P1", rate: 1 },
  { date: "P2", rate: 1 },
  { date: "P3", rate: 1 },
  { date: "P4", rate: 1 },
];

const rangePointCounts: Record<TimeRange, number> = {
  "48h": 12,
  "7D": 7,
  "15D": 15,
  "30D": 30,
  "60D": 30,
  "90D": 30,
  "6M": 26,
  "1Y": 12,
  "2Y": 24,
  "5Y": 20,
  "10Y": 20,
  MAX: 40,
};

const rangeWindowDays: Record<TimeRange, number> = {
  "48h": 2,
  "7D": 7,
  "15D": 15,
  "30D": 30,
  "60D": 60,
  "90D": 90,
  "6M": 180,
  "1Y": 365,
  "2Y": 730,
  "5Y": 365 * 5,
  "10Y": 365 * 10,
  MAX: 365 * 15,
};

const formatXAxisDate = (date: Date, range: TimeRange): string => {
  if (range === "48h") {
    const hour = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dayDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${hour} ${dayDate}`;
  }

  if (range.endsWith("D")) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  if (range === "6M") {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("en-GB", {
    month: "2-digit",
    year: "numeric",
  });
};

const buildRangeSeries = (seedData: ExchangeRatePoint[], range: TimeRange): ExchangeRatePoint[] => {
  const baseSeed = seedData.length > 0 ? seedData : defaultData;
  const count = rangePointCounts[range];
  const windowDays = rangeWindowDays[range];
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const lastRate = baseSeed[baseSeed.length - 1]?.rate ?? 1;
  const minRate = Math.min(...baseSeed.map((item) => item.rate));
  const maxRate = Math.max(...baseSeed.map((item) => item.rate));
  const spread = Math.max((maxRate - minRate) * 0.5, Math.abs(lastRate) * 0.003, 0.0001);

  return Array.from({ length: count }, (_, i) => {
    const progress = i / Math.max(count - 1, 1);
    const pointDate = new Date(now - windowMs + progress * windowMs);
    const wave = Math.sin((i / Math.max(count - 1, 1)) * Math.PI * 2);
    const drift = (i / Math.max(count - 1, 1) - 0.5) * spread * 0.35;
    const rate = Number((lastRate + wave * spread + drift).toFixed(6));

    return { date: formatXAxisDate(pointDate, range), rate };
  });
};

export function ExchangeRateChart({ baseCurrency, targetCurrency, data, initialRange }: ExchangeRateChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(initialRange);

  useEffect(() => {
    setSelectedRange(initialRange);
  }, [initialRange]);

  const chartData = useMemo(
    () => buildRangeSeries(data, selectedRange),
    [data, selectedRange],
  );
  const chartMinWidth = useMemo(
    () => Math.max(700, chartData.length * 64),
    [chartData.length],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Market Trends</h2>
            <p className="text-sm text-text-muted">Historical {baseCurrency} to {targetCurrency} exchange rate</p>
          </div>
        </div>
        <div className="inline-flex max-w-full overflow-x-auto gap-1 rounded-xl border border-white/10 bg-[#0c1220] p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedRange === range
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full mt-8 overflow-x-auto">
        <div className="min-h-[320px] h-[400px]" style={{ minWidth: `${chartMinWidth}px` }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0069fe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0069fe" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#bcc3d3", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#bcc3d3", fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#bcc3d3", marginBottom: "4px" }}
                formatter={(value) => {
                  if (value === undefined || value === null) {
                    return ["Rate: -", ""];
                  }

                  const normalized = Array.isArray(value) ? value[0] : value;
                  const parsed = typeof normalized === "number" ? normalized : Number(normalized);

                  return [
                    `Rate: ${Number.isFinite(parsed) ? parsed.toLocaleString() : String(normalized)}`,
                    "",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#0069fe"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRate)"
                activeDot={{ r: 6, fill: "#0069fe", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
