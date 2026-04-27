import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Admin</p>
          <CardTitle className="mt-3">Users and system health</CardTitle>
          <CardDescription className="mt-3 max-w-2xl">
            Review account status, system metrics, and operational details for the Rate-pulse service.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <Text variant="muted" className="text-sm">
                {metric.label}
              </Text>
              <Text variant="stat">{metric.value}</Text>
              <Text variant="muted" className="mt-2 text-sm">
                {metric.detail}
              </Text>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">User management</h2>
          <Text variant="muted" className="mt-1">
            Account registry for active and pending users
          </Text>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead className="border-b border-border bg-panel">
              <tr>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Balance</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {userRows.map((user) => (
                <TableRow key={user.id} className="hover:bg-panel/70">
                  <TableCell>
                    <div>
                      <p className="font-medium text-text-primary">{user.name}</p>
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
                  <TableCell className="text-text-primary">{formatCurrency(user.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
