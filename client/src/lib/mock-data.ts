import { TIME_RANGES } from "@/lib/constants";
import type {
  AnalyticsSeriesPoint,
  CurrencyPair,
  SettingsSection,
  TimeRange,
} from "@/types";

export const timeRanges = TIME_RANGES;

const generateSparkline = (base: number, volatility: number, points = 8) => {
  return Array.from({ length: points }, (_, i) => base + Math.sin(i) * volatility + (i * volatility * 0.2));
};

export const exchangeRates: Record<TimeRange, CurrencyPair[]> = TIME_RANGES.reduce((acc, range, index) => {
  const vol = 1 + (index * 0.5); // Increase volatility for larger time ranges
  acc[range] = [
    {
      pair: "EUR/USD",
      base: "Euro",
      quote: "US Dollar",
      rate: Number((1.0862 + Math.sin(index) * 0.05).toFixed(4)),
      change: Number((0.42 * vol * (index % 2 === 0 ? 1 : -1)).toFixed(2)),
      volume: `$${(1.84 + index * 0.5).toFixed(2)}B`,
      high: Number((1.0893 + index * 0.02).toFixed(4)),
      low: Number((1.0799 - index * 0.01).toFixed(4)),
      sparkline: generateSparkline(1.08, 0.01 * vol),
    },
    {
      pair: "GBP/USD",
      base: "British Pound",
      quote: "US Dollar",
      rate: Number((1.2748 + Math.cos(index) * 0.05).toFixed(4)),
      change: Number((-0.19 * vol).toFixed(2)),
      volume: `$${(1.26 + index * 0.3).toFixed(2)}B`,
      high: Number((1.2792 + index * 0.02).toFixed(4)),
      low: Number((1.2712 - index * 0.01).toFixed(4)),
      sparkline: generateSparkline(1.27, 0.015 * vol),
    },
    {
      pair: "USD/JPY",
      base: "US Dollar",
      quote: "Japanese Yen",
      rate: Number((149.82 - index * 0.5).toFixed(2)),
      change: Number((0.61 * vol).toFixed(2)),
      volume: `$${(2.93 + index * 0.8).toFixed(2)}B`,
      high: Number((150.1 + index * 0.5).toFixed(2)),
      low: Number((148.94 - index * 1.5).toFixed(2)),
      sparkline: generateSparkline(149.0, 0.5 * vol),
    },
    {
      pair: "AUD/USD",
      base: "Australian Dollar",
      quote: "US Dollar",
      rate: Number((0.6634 + index * 0.005).toFixed(4)),
      change: Number((0.23 * vol).toFixed(2)),
      volume: `$${(768 + index * 100)}M`,
      high: Number((0.6651 + index * 0.01).toFixed(4)),
      low: Number((0.6598 - index * 0.01).toFixed(4)),
      sparkline: generateSparkline(0.66, 0.005 * vol),
    },
  ];
  return acc;
}, {} as Record<TimeRange, CurrencyPair[]>);

export const analyticsData: Record<TimeRange, AnalyticsSeriesPoint[]> = TIME_RANGES.reduce((acc, range, index) => {
  const pointsCount = range === "48h" ? 12 : range === "7D" ? 7 : range === "15D" ? 15 : range === "30D" ? 30 : 12;
  const volBase = 300 * (index + 1);
  const pnlBase = 500 * (index + 1);
  const valBase = 120000 + (index * 5000);

  acc[range] = Array.from({ length: pointsCount }, (_, i) => {
    let label = `P${i + 1}`;
    if (range === "48h") label = `${(i * 2).toString().padStart(2, '0')}:00`;
    else if (range === "7D") label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
    else if (range.endsWith("M") || range.endsWith("Y") || range === "MAX") label = `M${i + 1}`;

    // Use deterministic math functions instead of random for stable hydration
    const pseudoRandom = Math.abs(Math.sin(i * index + 1));

    return {
      label,
      value: Math.floor(valBase + Math.sin(i) * 5000 + (i * 1000)),
      volume: Math.floor(volBase + pseudoRandom * volBase * 0.5),
      pnl: Math.floor(pnlBase + (Math.sin(i) * pnlBase * 0.8)),
    };
  });
  
  return acc;
}, {} as Record<TimeRange, AnalyticsSeriesPoint[]>);

import type { BankRate, MarketTrendPoint } from "@/types";

export const bankRates: BankRate[] = [
  {
    id: "vietcombank",
    source: "Vietcombank",
    cashBuy: 25420.00,
    wireBuy: 25450.00,
    cashSell: 25280.00,
    wireSell: 25250.00,
    change: 0.45,
    country: "Vietnam",
  },
  {
    id: "acb",
    source: "ACB",
    cashBuy: 25440.00,
    wireBuy: 25470.00,
    cashSell: 25300.00,
    wireSell: 25270.00,
    change: 0.38,
    country: "Vietnam",
  },
  {
    id: "mb-bank",
    source: "MB Bank",
    cashBuy: 25410.00,
    wireBuy: 25440.00,
    cashSell: 25270.00,
    wireSell: 25240.00,
    change: 0.52,
    country: "Vietnam",
  },
  {
    id: "bidv",
    source: "BIDV",
    cashBuy: 25430.00,
    wireBuy: 25460.00,
    cashSell: 25290.00,
    wireSell: 25260.00,
    change: 0.41,
    country: "Vietnam",
  },
];

export const marketTrends: Record<TimeRange, MarketTrendPoint[]> = TIME_RANGES.reduce((acc, range) => {
  acc[range] = [
    { date: "Mar 3", rate: 25150 },
    { date: "Mar 4", rate: 25200 },
    { date: "Mar 5", rate: 25123.66 },
    { date: "Mar 6", rate: 24980 },
    { date: "Mar 7", rate: 24850 },
    { date: "Mar 8", rate: 24780 },
    { date: "Mar 9", rate: 24750 },
    { date: "Mar 10", rate: 24710 },
  ];
  return acc;
}, {} as Record<TimeRange, MarketTrendPoint[]>);

export const marketTrendData = [
  { name: "FX", value: 38 },
  { name: "Commodities", value: 22 },
  { name: "Indices", value: 18 },
  { name: "Crypto", value: 12 },
  { name: "Equities", value: 10 },
];

export const landingStats = [
  { label: "Monthly volume", value: "$12.8B" },
  { label: "Execution speed", value: "42ms" },
  { label: "Supported markets", value: "120+" },
];

export const featureCards = [
  {
    title: "Smart execution",
    description: "Monitor fast-moving markets with live data, clear signals, and low-latency trade insights.",
  },
  {
    title: "Trader analytics",
    description: "Track performance, risk exposure, and volume trends from one responsive control center.",
  },
  {
    title: "Account controls",
    description: "Manage security, notifications, and platform preferences with structured settings flows.",
  },
];

export const settingsSections: SettingsSection[] = [
  {
    id: "security",
    title: "Security",
    description: "Password rotation, device sessions, and withdrawal confirmation policies.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose market alerts, execution updates, and portfolio summaries.",
  },
  {
    id: "privacy",
    title: "Data & Privacy",
    description: "Control exports, retention preferences, and analytics visibility.",
  },
  {
    id: "support",
    title: "Support",
    description: "Access help channels and escalation preferences for urgent trading issues.",
  },
];
