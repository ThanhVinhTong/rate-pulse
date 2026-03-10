import "server-only";

import type { SystemMetric, UserRow } from "@/types";

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
