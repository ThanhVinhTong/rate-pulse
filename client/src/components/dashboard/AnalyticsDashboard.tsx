"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency } from "@/lib/utils";
import type { AnalyticsSeriesPoint, TimeRange } from "@/types";

import { RevenueChart } from "./RevenueChart";
import { TimeFilter } from "./TimeFilter";

const pieColors = ["#0069fe", "#00d3e5", "#ffcc00", "#00af30", "#5c5769"];

interface AnalyticsDashboardProps {
  range: TimeRange;
  data: AnalyticsSeriesPoint[];
  marketTrendData: { name: string; value: number }[];
}

export function AnalyticsDashboard({
  range,
  data,
  marketTrendData,
}: AnalyticsDashboardProps) {
  const latestPoint = data[data.length - 1];
  const firstPoint = data[0];
  const change = latestPoint.value - firstPoint.value;
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
  const totalPnl = data.reduce((sum, item) => sum + item.pnl, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Desk analytics</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Performance and market trend dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Compare portfolio value, execution volume, and market mix across
            different time ranges using server-fed data with client-side charting.
          </p>
        </div>
        <TimeFilter value={range} />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0d1322] p-5">
          <p className="text-sm text-text-muted">Portfolio value</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatCompactCurrency(latestPoint.value)}
          </p>
          <p className={`mt-2 text-sm ${change >= 0 ? "text-status-success" : "text-status-danger"}`}>
            {change >= 0 ? "+" : ""}
            {formatCompactCurrency(change)} over selected range
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0d1322] p-5">
          <p className="text-sm text-text-muted">Trade volume</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalVolume.toLocaleString()}</p>
          <p className="mt-2 text-sm text-text-muted">Orders captured in mock analytics</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0d1322] p-5">
          <p className="text-sm text-text-muted">Net P&amp;L</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatCompactCurrency(totalPnl)}
          </p>
          <p className="mt-2 text-sm text-status-success">Positive trend across diversified assets</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0d1322] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Portfolio performance</h2>
            <p className="text-sm text-text-muted">Area chart with responsive breakpoints</p>
          </div>
          <RevenueChart data={data} />
        </article>

        <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0d1322] p-5">
          <h2 className="text-lg font-semibold text-white">Market composition</h2>
          <p className="mt-1 text-sm text-text-muted">Diversification by asset class</p>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={marketTrendData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {marketTrendData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {marketTrendData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-text-muted">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: pieColors[index % pieColors.length] }}
                />
                {item.name} {item.value}%
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="min-w-0 rounded-2xl border border-white/10 bg-[#0d1322] p-5">
        <h2 className="text-lg font-semibold text-white">Trade volume by period</h2>
        <p className="mt-1 text-sm text-text-muted">Bar chart for quick throughput comparison</p>
        <div className="mt-6 h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#bcc3d3" />
              <YAxis stroke="#bcc3d3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="volume" radius={[10, 10, 0, 0]} fill="#0069fe" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
