import { Sidebar } from "@/components/layout/Sidebar";
import { requireAuth } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar session={session} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
