export type TimeRange = "1D" | "1W" | "1M" | "1Y";

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
