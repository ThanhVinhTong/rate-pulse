"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SparklineProps {
  data: number[];
  rising: boolean;
}

export function Sparkline({ data, rising }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={160} minHeight={96}>
      <LineChart
        data={data.map((value, index) => ({ index, value }))}
        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
      >
        <XAxis hide dataKey="index" />
        <YAxis hide domain={["dataMin - 0.01", "dataMax + 0.01"]} />
        <Tooltip
          cursor={false}
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#ffffff",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={rising ? "#00af30" : "#f30000"}
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
