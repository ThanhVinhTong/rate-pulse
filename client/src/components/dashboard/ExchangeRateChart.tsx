"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { TIME_RANGES } from "@/lib/constants";
import { marketTrends } from "@/lib/mock-data";
import type { TimeRange } from "@/types";

interface ExchangeRateChartProps {
  baseCurrency: string;
  targetCurrency: string;
}

export function ExchangeRateChart({ baseCurrency, targetCurrency }: ExchangeRateChartProps) {
  const [range, setRange] = useState<TimeRange>("7D");
  
  const data = marketTrends[range] || marketTrends["7D"];
  const latestRate = data[data.length - 1]?.rate;

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
        
        {/* Inline time filters instead of using the custom generic component to match the image */}
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#0c1220] p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                range === r 
                  ? "bg-primary text-white" 
                  : "text-text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {r.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full mt-8">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
              tick={{ fill: '#bcc3d3', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#bcc3d3', fontSize: 12 }} 
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111827', 
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#bcc3d3', marginBottom: '4px' }}
              formatter={(value: number) => [`Rate: ${value.toLocaleString()}`, '']}
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
  );
}
