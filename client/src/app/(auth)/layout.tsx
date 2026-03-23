import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/profile");
  }

  return children;
}
