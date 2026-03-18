import type { Metadata } from "next";

import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { systemMetrics, userRows } from "@/lib/server/admin-data";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected admin dashboard for platform metrics and user management.",
};

export default async function AdminPage() {
  return <AdminDashboard systemMetrics={systemMetrics} userRows={userRows} />;
}
