import { TIME_RANGES } from "@/lib/constants";
import type {
  AnalyticsSeriesPoint,
  CurrencyPair,
  SettingsSection,
  TimeRange,
} from "@/types";

export const timeRanges = TIME_RANGES;

export const supportedCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$", continent: "Americas" },
  { code: "EUR", name: "Euro", symbol: "EUR", continent: "Europe" },
  { code: "GBP", name: "British Pound", symbol: "GBP", continent: "Europe" },
  { code: "JPY", name: "Japanese Yen", symbol: "JPY", continent: "Asia" },
  { code: "AUD", name: "Australian Dollar", symbol: "AUD", continent: "Oceania" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CAD", continent: "Americas" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", continent: "Europe" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CNY", continent: "Asia" },
  { code: "SGD", name: "Singapore Dollar", symbol: "SGD", continent: "Asia" },
  { code: "VND", name: "Vietnamese Dong", symbol: "VND", continent: "Asia" },
];

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
    {
      pair: "USD/CHF",
      base: "US Dollar",
      quote: "Swiss Franc",
      rate: Number((0.8832 + Math.sin(index * 0.8) * 0.01).toFixed(4)),
      change: Number((0.17 * vol * (index % 2 === 0 ? 1 : -1)).toFixed(2)),
      volume: `$${(932 + index * 90)}M`,
      high: Number((0.8871 + index * 0.004).toFixed(4)),
      low: Number((0.8789 - index * 0.003).toFixed(4)),
      sparkline: generateSparkline(0.883, 0.004 * vol),
    },
    {
      pair: "USD/CAD",
      base: "US Dollar",
      quote: "Canadian Dollar",
      rate: Number((1.3524 + Math.cos(index * 0.7) * 0.02).toFixed(4)),
      change: Number((-0.27 * vol).toFixed(2)),
      volume: `$${(1.08 + index * 0.2).toFixed(2)}B`,
      high: Number((1.359 + index * 0.01).toFixed(4)),
      low: Number((1.345 - index * 0.008).toFixed(4)),
      sparkline: generateSparkline(1.35, 0.01 * vol),
    },
    {
      pair: "EUR/GBP",
      base: "Euro",
      quote: "British Pound",
      rate: Number((0.8621 + Math.sin(index * 1.1) * 0.008).toFixed(4)),
      change: Number((0.31 * vol).toFixed(2)),
      volume: `$${(885 + index * 120)}M`,
      high: Number((0.8662 + index * 0.003).toFixed(4)),
      low: Number((0.8574 - index * 0.002).toFixed(4)),
      sparkline: generateSparkline(0.861, 0.0045 * vol),
    },
    {
      pair: "EUR/JPY",
      base: "Euro",
      quote: "Japanese Yen",
      rate: Number((162.95 - index * 0.35).toFixed(2)),
      change: Number((-0.22 * vol).toFixed(2)),
      volume: `$${(1.14 + index * 0.25).toFixed(2)}B`,
      high: Number((163.42 + index * 0.3).toFixed(2)),
      low: Number((162.11 - index * 0.8).toFixed(2)),
      sparkline: generateSparkline(162.8, 0.35 * vol),
    },
    {
      pair: "CHF/JPY",
      base: "Swiss Franc",
      quote: "Japanese Yen",
      rate: Number((169.6 - index * 0.2).toFixed(2)),
      change: Number((-0.14 * vol).toFixed(2)),
      volume: `$${(742 + index * 85)}M`,
      high: Number((170.02 + index * 0.18).toFixed(2)),
      low: Number((168.9 - index * 0.45).toFixed(2)),
      sparkline: generateSparkline(169.5, 0.28 * vol),
    },
    {
      pair: "CNY/USD",
      base: "Chinese Yuan",
      quote: "US Dollar",
      rate: Number((0.138 + Math.sin(index * 0.9) * 0.002).toFixed(4)),
      change: Number((0.11 * vol * (index % 2 === 0 ? 1 : -1)).toFixed(2)),
      volume: `$${(1.11 + index * 0.18).toFixed(2)}B`,
      high: Number((0.1394 + index * 0.0006).toFixed(4)),
      low: Number((0.1368 - index * 0.0004).toFixed(4)),
      sparkline: generateSparkline(0.138, 0.0014 * vol),
    },
    {
      pair: "CAD/JPY",
      base: "Canadian Dollar",
      quote: "Japanese Yen",
      rate: Number((110.25 + Math.cos(index * 0.5) * 0.8).toFixed(2)),
      change: Number((0.2 * vol).toFixed(2)),
      volume: `$${(626 + index * 62)}M`,
      high: Number((111.1 + index * 0.25).toFixed(2)),
      low: Number((109.45 - index * 0.4).toFixed(2)),
      sparkline: generateSparkline(110.1, 0.3 * vol),
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
    baseCurrency: "VND",
    targetCurrency: "USD",
    favorite: true,
    fetchCountToday: 6,
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
    baseCurrency: "VND",
    targetCurrency: "USD",
    favorite: false,
    fetchCountToday: 4,
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
    baseCurrency: "VND",
    targetCurrency: "USD",
    favorite: false,
    fetchCountToday: 5,
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
    baseCurrency: "VND",
    targetCurrency: "USD",
    favorite: false,
    fetchCountToday: 3,
    cashBuy: 25430.00,
    wireBuy: 25460.00,
    cashSell: 25290.00,
    wireSell: 25260.00,
    change: 0.41,
    country: "Vietnam",
  },
  {
    id: "ecb",
    source: "ECB",
    baseCurrency: "USD",
    targetCurrency: "EUR",
    favorite: true,
    fetchCountToday: 7,
    cashBuy: 0.9180,
    wireBuy: 0.9200,
    cashSell: 0.9150,
    wireSell: 0.9130,
    change: 2.34,
    country: "European Union",
  },
  {
    id: "bank-of-england",
    source: "Bank of England",
    baseCurrency: "USD",
    targetCurrency: "GBP",
    favorite: true,
    fetchCountToday: 4,
    cashBuy: 0.7880,
    wireBuy: 0.7900,
    cashSell: 0.7850,
    wireSell: 0.7830,
    change: -1.23,
    country: "United Kingdom",
  },
  {
    id: "bank-of-japan",
    source: "Bank of Japan",
    baseCurrency: "USD",
    targetCurrency: "JPY",
    favorite: true,
    fetchCountToday: 8,
    cashBuy: 149.50,
    wireBuy: 149.85,
    cashSell: 149.20,
    wireSell: 148.95,
    change: 0.89,
    country: "Japan",
  },
  {
    id: "market-rate-eu",
    source: "Market Rate",
    baseCurrency: "USD",
    targetCurrency: "EUR",
    favorite: false,
    fetchCountToday: 10,
    cashBuy: 0.9190,
    wireBuy: 0.9210,
    cashSell: 0.9160,
    wireSell: 0.9140,
    change: 2.28,
    country: "European Union",
  },
  {
    id: "third-party-api-sg",
    source: "Third Party API",
    baseCurrency: "USD",
    targetCurrency: "SGD",
    favorite: false,
    fetchCountToday: 9,
    cashBuy: 1.3390,
    wireBuy: 1.3420,
    cashSell: 1.3350,
    wireSell: 1.3330,
    change: 0.66,
    country: "Singapore",
  },
  {
    id: "swiss-national-bank",
    source: "Swiss National Bank",
    baseCurrency: "USD",
    targetCurrency: "CHF",
    favorite: false,
    fetchCountToday: 5,
    cashBuy: 0.8820,
    wireBuy: 0.8840,
    cashSell: 0.8790,
    wireSell: 0.8770,
    change: 0.64,
    country: "Switzerland",
  },
  {
    id: "bank-of-canada",
    source: "Bank of Canada",
    baseCurrency: "USD",
    targetCurrency: "CAD",
    favorite: false,
    fetchCountToday: 6,
    cashBuy: 1.3520,
    wireBuy: 1.3550,
    cashSell: 1.3480,
    wireSell: 1.3460,
    change: -0.42,
    country: "Canada",
  },
  {
    id: "mas",
    source: "Monetary Authority of Singapore",
    baseCurrency: "USD",
    targetCurrency: "SGD",
    favorite: false,
    fetchCountToday: 11,
    cashBuy: 1.3380,
    wireBuy: 1.3410,
    cashSell: 1.3340,
    wireSell: 1.3320,
    change: 0.71,
    country: "Singapore",
  },
  {
    id: "rba",
    source: "Reserve Bank of Australia",
    baseCurrency: "AUD",
    targetCurrency: "JPY",
    favorite: true,
    fetchCountToday: 5,
    cashBuy: 98.10,
    wireBuy: 98.40,
    cashSell: 97.70,
    wireSell: 97.40,
    change: 0.85,
    country: "Australia",
  },
  {
    id: "pboc",
    source: "PBOC",
    baseCurrency: "CNY",
    targetCurrency: "USD",
    favorite: false,
    fetchCountToday: 6,
    cashBuy: 0.1378,
    wireBuy: 0.1381,
    cashSell: 0.1372,
    wireSell: 0.1369,
    change: 0.44,
    country: "China",
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
    title: "Localization & Data",
    description: "Set your trading timezone, number format, and how often the platform fetches fresh rates.",
  },
];
