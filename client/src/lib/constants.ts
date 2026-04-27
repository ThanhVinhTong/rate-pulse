export const APP_NAME = "Rate-pulse";
export const AUTH_COOKIE = "rate-pulse_session";

// Time ranges for analytics - must match backend values in util/helper.go
export const TIME_RANGES = ["24h", "7d", "2w", "1m", "6m", "1y", "2y", "5y", "10y", "all"] as const;

// Map time range to number of data points to fetch
// Can be adjusted per time range in the future for optimization
export const ANALYTICS_DATA_POINTS: Record<(typeof TIME_RANGES)[number], number> = {
  "24h": 50,
  "7d": 50,
  "2w": 50,
  "1m": 50,
  "6m": 50,
  "1y": 50,
  "2y": 50,
  "5y": 50,
  "10y": 50,
  "all": 50,
};
