import { TIME_RANGES } from "@/lib/constants";
import type {
  AnalyticsSeriesPoint,
  CurrencyPair,
  SettingsSection,
  SystemMetric,
  TimeRange,
  UserRow,
} from "@/types";

export const timeRanges = TIME_RANGES;

export const exchangeRates: Record<TimeRange, CurrencyPair[]> = {
  "1D": [
    {
      pair: "EUR/USD",
      base: "Euro",
      quote: "US Dollar",
      rate: 1.0862,
      change: 0.42,
      volume: "$1.84B",
      high: 1.0893,
      low: 1.0799,
      sparkline: [1.08, 1.081, 1.083, 1.082, 1.085, 1.084, 1.086, 1.0862],
    },
    {
      pair: "GBP/USD",
      base: "British Pound",
      quote: "US Dollar",
      rate: 1.2748,
      change: -0.19,
      volume: "$1.26B",
      high: 1.2792,
      low: 1.2712,
      sparkline: [1.281, 1.279, 1.278, 1.276, 1.277, 1.275, 1.275, 1.2748],
    },
    {
      pair: "USD/JPY",
      base: "US Dollar",
      quote: "Japanese Yen",
      rate: 149.82,
      change: 0.61,
      volume: "$2.93B",
      high: 150.1,
      low: 148.94,
      sparkline: [148.9, 149.04, 149.12, 149.28, 149.36, 149.5, 149.73, 149.82],
    },
    {
      pair: "AUD/USD",
      base: "Australian Dollar",
      quote: "US Dollar",
      rate: 0.6634,
      change: 0.23,
      volume: "$768M",
      high: 0.6651,
      low: 0.6598,
      sparkline: [0.659, 0.66, 0.661, 0.6607, 0.6618, 0.6621, 0.663, 0.6634],
    },
  ],
  "1W": [
    {
      pair: "EUR/USD",
      base: "Euro",
      quote: "US Dollar",
      rate: 1.0817,
      change: 1.14,
      volume: "$11.2B",
      high: 1.0893,
      low: 1.0632,
      sparkline: [1.064, 1.067, 1.071, 1.074, 1.078, 1.081, 1.08, 1.0817],
    },
    {
      pair: "GBP/USD",
      base: "British Pound",
      quote: "US Dollar",
      rate: 1.2782,
      change: 0.76,
      volume: "$8.4B",
      high: 1.2826,
      low: 1.2621,
      sparkline: [1.262, 1.266, 1.269, 1.272, 1.274, 1.276, 1.277, 1.2782],
    },
    {
      pair: "USD/JPY",
      base: "US Dollar",
      quote: "Japanese Yen",
      rate: 149.12,
      change: -0.37,
      volume: "$14.9B",
      high: 150.82,
      low: 148.62,
      sparkline: [149.7, 149.94, 150.2, 150.1, 149.8, 149.6, 149.3, 149.12],
    },
    {
      pair: "AUD/USD",
      base: "Australian Dollar",
      quote: "US Dollar",
      rate: 0.6582,
      change: -0.11,
      volume: "$5.7B",
      high: 0.6661,
      low: 0.6544,
      sparkline: [0.666, 0.664, 0.662, 0.661, 0.66, 0.659, 0.6585, 0.6582],
    },
  ],
  "1M": [
    {
      pair: "EUR/USD",
      base: "Euro",
      quote: "US Dollar",
      rate: 1.0741,
      change: 2.42,
      volume: "$45.8B",
      high: 1.0918,
      low: 1.041,
      sparkline: [1.041, 1.048, 1.055, 1.06, 1.065, 1.069, 1.072, 1.0741],
    },
    {
      pair: "GBP/USD",
      base: "British Pound",
      quote: "US Dollar",
      rate: 1.2662,
      change: 1.18,
      volume: "$38.1B",
      high: 1.2844,
      low: 1.2286,
      sparkline: [1.229, 1.238, 1.246, 1.251, 1.255, 1.259, 1.263, 1.2662],
    },
    {
      pair: "USD/JPY",
      base: "US Dollar",
      quote: "Japanese Yen",
      rate: 151.34,
      change: 1.73,
      volume: "$59.3B",
      high: 152.14,
      low: 147.22,
      sparkline: [147.3, 147.9, 148.6, 149.5, 150.3, 150.7, 151.1, 151.34],
    },
    {
      pair: "AUD/USD",
      base: "Australian Dollar",
      quote: "US Dollar",
      rate: 0.6517,
      change: -1.05,
      volume: "$22.9B",
      high: 0.6692,
      low: 0.6488,
      sparkline: [0.669, 0.665, 0.662, 0.659, 0.656, 0.654, 0.653, 0.6517],
    },
  ],
  "1Y": [
    {
      pair: "EUR/USD",
      base: "Euro",
      quote: "US Dollar",
      rate: 1.0938,
      change: 4.11,
      volume: "$522B",
      high: 1.1132,
      low: 1.0187,
      sparkline: [1.02, 1.03, 1.041, 1.05, 1.064, 1.078, 1.087, 1.0938],
    },
    {
      pair: "GBP/USD",
      base: "British Pound",
      quote: "US Dollar",
      rate: 1.2816,
      change: 5.32,
      volume: "$418B",
      high: 1.3146,
      low: 1.1814,
      sparkline: [1.182, 1.201, 1.219, 1.237, 1.251, 1.266, 1.274, 1.2816],
    },
    {
      pair: "USD/JPY",
      base: "US Dollar",
      quote: "Japanese Yen",
      rate: 148.42,
      change: 2.08,
      volume: "$701B",
      high: 161.95,
      low: 139.54,
      sparkline: [139.7, 142.6, 145.4, 149.1, 152.8, 156.3, 151.4, 148.42],
    },
    {
      pair: "AUD/USD",
      base: "Australian Dollar",
      quote: "US Dollar",
      rate: 0.6694,
      change: 3.46,
      volume: "$290B",
      high: 0.6942,
      low: 0.6271,
      sparkline: [0.628, 0.639, 0.645, 0.652, 0.657, 0.661, 0.665, 0.6694],
    },
  ],
};

export const analyticsData: Record<TimeRange, AnalyticsSeriesPoint[]> = {
  "1D": [
    { label: "09:00", value: 128400, volume: 340, pnl: 420 },
    { label: "11:00", value: 129020, volume: 410, pnl: 610 },
    { label: "13:00", value: 128760, volume: 385, pnl: -230 },
    { label: "15:00", value: 130180, volume: 462, pnl: 920 },
    { label: "17:00", value: 131040, volume: 508, pnl: 1210 },
    { label: "19:00", value: 131820, volume: 530, pnl: 780 },
  ],
  "1W": [
    { label: "Mon", value: 124800, volume: 2100, pnl: 1320 },
    { label: "Tue", value: 126250, volume: 2400, pnl: 1450 },
    { label: "Wed", value: 127120, volume: 2190, pnl: 870 },
    { label: "Thu", value: 128910, volume: 2560, pnl: 1790 },
    { label: "Fri", value: 130420, volume: 2780, pnl: 1510 },
  ],
  "1M": [
    { label: "W1", value: 118200, volume: 8120, pnl: 3620 },
    { label: "W2", value: 121460, volume: 8940, pnl: 3260 },
    { label: "W3", value: 126140, volume: 9340, pnl: 4680 },
    { label: "W4", value: 130980, volume: 10020, pnl: 4840 },
  ],
  "1Y": [
    { label: "Q1", value: 102400, volume: 30420, pnl: 9820 },
    { label: "Q2", value: 111300, volume: 35620, pnl: 8900 },
    { label: "Q3", value: 122840, volume: 40110, pnl: 11540 },
    { label: "Q4", value: 131820, volume: 42780, pnl: 8980 },
  ],
};

export const marketTrendData = [
  { name: "FX", value: 38 },
  { name: "Commodities", value: 22 },
  { name: "Indices", value: 18 },
  { name: "Crypto", value: 12 },
  { name: "Equities", value: 10 },
];

export const userRows: UserRow[] = [
  {
    id: "USR-1024",
    name: "Ava Reynolds",
    email: "ava@rate-pulse.trade",
    role: "trader",
    status: "Active",
    balance: 124540,
  },
  {
    id: "USR-1025",
    name: "Marco Chen",
    email: "marco@rate-pulse.trade",
    role: "trader",
    status: "Pending",
    balance: 38520,
  },
  {
    id: "USR-1026",
    name: "Nadia Foster",
    email: "nadia@rate-pulse.trade",
    role: "trader",
    status: "Restricted",
    balance: 9240,
  },
  {
    id: "USR-1027",
    name: "Olivia Hart",
    email: "olivia@rate-pulse.trade",
    role: "admin",
    status: "Active",
    balance: 218320,
  },
];

export const systemMetrics: SystemMetric[] = [
  { label: "Monthly revenue", value: "$3.42M", detail: "+12.4% vs last month" },
  { label: "Net deposits", value: "$18.6M", detail: "Across 2,490 active accounts" },
  { label: "Latency", value: "42ms", detail: "P95 order execution" },
  { label: "Uptime", value: "99.98%", detail: "Last 30 days availability" },
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
    title: "Localization & Data",
    description: "Set your trading timezone, number format, and how often the platform fetches fresh rates.",
  },
];
