import { TIME_RANGES } from "@/lib/constants";

export type TimeRange = typeof TIME_RANGES[number];

export interface ExchangeRateType {
  typeId: number;
  typeName: string;
}

export interface RateSource {
  sourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceLink: string | null;
  sourceCountry: string | null;
  sourceStatus: string;
  updatedAt: string;
  createdAt: string;
}

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
  timestamp?: string;
}

export interface SourceSnapshot {
  sourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceCountry: string | null;
  updatedAt?: string;
  rates: Record<number, number | null>; // key = typeId
  // alternatively: Record<string, number | null> if keying by typeName/code
}

export interface PairSnapshot {
  baseCurrency: string;
  targetCurrency: string;
  types: ExchangeRateType[];
  sources: SourceSnapshot[];
}

export interface ExchangeSnapshotResponse {
  pairs: PairSnapshot[];
  nextCursor?: number | null;
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

export interface HistoricalSeriesPoint {
  label: string;
  value: number;
  volume: number;
  pnl: number;
}
