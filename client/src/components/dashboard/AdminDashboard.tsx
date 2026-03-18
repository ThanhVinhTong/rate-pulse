import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { formatCurrency } from "@/lib/utils";
import type { SystemMetric, UserRow } from "@/types";

interface AdminDashboardProps {
  systemMetrics: SystemMetric[];
  userRows: UserRow[];
}

export function AdminDashboard({
  systemMetrics,
  userRows,
}: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Admin control room</p>
          <CardTitle className="mt-3">Revenue, users, and platform health</CardTitle>
          <CardDescription className="mt-3 max-w-2xl">
            This protected page combines revenue monitoring, account oversight,
            and system metrics for platform administrators.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-[#0d1322] p-5"
          >
            <p className="text-sm text-text-muted">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-text-muted">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1322]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">User management</h2>
          <p className="mt-1 text-sm text-text-muted">
            Demo account registry for active and pending traders
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Balance</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {userRows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-text-muted">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="uppercase tracking-wide text-text-muted">
                    {user.role}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        user.status === "Active"
                          ? "bg-status-success/10 text-status-success"
                          : user.status === "Pending"
                            ? "bg-status-warning/10 text-status-warning"
                            : "bg-status-danger/10 text-status-danger"
                      }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-white">{formatCurrency(user.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
