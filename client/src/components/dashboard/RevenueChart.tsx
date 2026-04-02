"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsSeriesPoint } from "@/types";

interface RevenueChartProps {
  data: AnalyticsSeriesPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-80 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={320}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d3e5" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0069fe" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#bcc3d3" />
          <YAxis stroke="#bcc3d3" tickFormatter={(value) => `$${value / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00d3e5"
            strokeWidth={2.5}
            fill="url(#portfolioFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
