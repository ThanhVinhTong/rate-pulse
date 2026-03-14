import { TIME_RANGES } from "@/lib/constants";

export type TimeRange = typeof TIME_RANGES[number];

export interface BankRate {
  id: string;
  source: string;
  baseCurrency: string;
  targetCurrency: string;
  favorite: boolean;
  fetchCountToday: number;
  cashBuy: number;
  wireBuy: number;
  cashSell: number;
  wireSell: number;
  change: number;
  country: string;
}

export interface MarketTrendPoint {
  date: string;
  rate: number;
}

export interface CurrencyPair {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  change: number;
  volume: string;
  high: number;
  low: number;
  sparkline: number[];
}

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
  volume: number;
  pnl: number;
}
