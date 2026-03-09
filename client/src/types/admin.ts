import type { SessionRole } from "./user";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
  status: "Active" | "Pending" | "Restricted";
  balance: number;
}

export interface SystemMetric {
  label: string;
  value: string;
  detail: string;
}
