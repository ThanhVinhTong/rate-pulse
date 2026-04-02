import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Panel } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Text } from "@/components/ui/typography";
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
            This protected page combines revenue monitoring, account oversight, and system metrics for platform
            administrators.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemMetrics.map((metric) => (
          <Panel key={metric.label} variant="dark" padding="md">
            <Text variant="muted" className="text-sm">
              {metric.label}
            </Text>
            <Text variant="stat">{metric.value}</Text>
            <Text variant="muted" className="mt-2 text-sm">
              {metric.detail}
            </Text>
          </Panel>
        ))}
      </section>

      <Panel variant="darkSection">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">User management</h2>
          <Text variant="muted" className="mt-1">
            Demo account registry for active and pending traders
          </Text>
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
                    <Badge
                      variant={
                        user.status === "Active"
                          ? "success"
                          : user.status === "Pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{formatCurrency(user.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
