import type { Metadata } from "next";

import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { systemMetrics, userRows } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected admin dashboard for platform metrics and user management.",
};

export default async function AdminPage() {
  await requireAdmin();

  return <AdminDashboard systemMetrics={systemMetrics} userRows={userRows} />;
}
