export const APP_NAME = "Rate-pulse";
export const AUTH_COOKIE = "rate-pulse_session";

// Time ranges for historical - must match backend values in util/helper.go
export const TIME_RANGES = ["24h", "48h", "7d", "15d", "1m", "6m", "1y", "2y", "5y", "10y", "all"] as const;

// Map time range to number of data points to fetch
// Can be adjusted per time range in the future for optimization
export const ANALYTICS_DATA_POINTS: Record<(typeof TIME_RANGES)[number], number> = {
  "24h": 24,
  "48h": 24,
  "7d": 7,
  "15d": 15,
  "1m": 15,
  "6m": 24,
  "1y": 24,
  "2y": 24,
  "5y": 30,
  "10y": 40,
  "all": 50,
};

export const TIME_RANGE_WINDOW_DAYS: Record<(typeof TIME_RANGES)[number], number> = {
  "24h": 1,
  "48h": 2,
  "7d": 7,
  "15d": 15,
  "1m": 30,
  "6m": 180,
  "1y": 365,
  "2y": 730,
  "5y": 1825,
  "10y": 3650,
  "all": 36500,
};