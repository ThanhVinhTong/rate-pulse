import { TIME_RANGES } from "@/lib/constants";
import type {
  AnalyticsSeriesPoint,
  CurrencyPair,
  SettingsSection,
  TimeRange,
} from "@/types";

export const timeRanges = TIME_RANGES;

export const exchangeRates: Record<TimeRange, CurrencyPair[]> = TIME_RANGES.reduce((acc, range) => {
  acc[range] = [
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
  ];
  return acc;
}, {} as Record<TimeRange, CurrencyPair[]>);

export const analyticsData: Record<TimeRange, AnalyticsSeriesPoint[]> = TIME_RANGES.reduce((acc, range) => {
  acc[range] = [
    { label: "09:00", value: 128400, volume: 340, pnl: 420 },
    { label: "11:00", value: 129020, volume: 410, pnl: 610 },
    { label: "13:00", value: 128760, volume: 385, pnl: -230 },
    { label: "15:00", value: 130180, volume: 462, pnl: 920 },
    { label: "17:00", value: 131040, volume: 508, pnl: 1210 },
    { label: "19:00", value: 131820, volume: 530, pnl: 780 },
  ];
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
